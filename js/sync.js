/* Pulse · sync
 * Learner state: local storage and cloud sync (merge, push after the first pull).
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- learner state ---------- */
var S = def(),
  SB = null,
  ME = null,
  EMAIL = '',
  OWNER = false,
  syncState = 'local',
  pushT = null,
  pushing = false,
  again = false,
  loginErr = '',
  loginBusy = false,
  loginEm = '';
try {
  var raw = localStorage.getItem(KEY);
  if (raw) S = fix(JSON.parse(raw));
} catch (e) {}
(function () {
  var th = S.theme;
  try {
    th = th || localStorage.getItem(TKEY);
  } catch (e) {}
  applyTheme(th || 'auto');
})();
function cfgOk() {
  var c = window.PULS_CONFIG || {};
  return !!(
    c.url &&
    c.anonKey &&
    c.url.indexOf('ВСТАВЬ') < 0 &&
    window.supabase &&
    window.supabase.createClient
  );
}
function save() {
  S.t = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
  schedulePush();
}
/* Merge two copies of one learner's progress (see lib/core.js). */
function mergeS(a, b) {
  return Core.mergeStates(a, b);
}
function same(a, b) {
  return Core.sameJson(a, b);
}
/* PULLED: the cloud copy of the current course has been read. Nothing is pushed before that,
   otherwise the empty state of a new device would overwrite the progress in the cloud. */
var PULLED = false;
function adopt(c) {
  S = fix(c);
  if (S.theme) applyTheme(S.theme);
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
}
function schedulePush() {
  if (!SB || !ME || OWNER) return;
  clearTimeout(pushT);
  pushT = setTimeout(push, 600);
}
/* The session was revoked or expired: sign out on this device only and ask to sign in again. Local progress stays. */
function authErr(r) {
  var e = r && r.error;
  return (
    !!r &&
    (r.status === 401 ||
      (!!e && /jwt|PGRST30[0-3]/i.test(String(e.message || '') + ' ' + String(e.code || ''))))
  );
}
var lostShown = false;
function sessionLost() {
  if (!SB) return;
  loginEm = EMAIL || S.email || loginEm;
  presStop();
  SB.auth.signOut({ scope: 'local' }).then(
    function () {},
    function () {}
  );
  onSession(null);
  if (!lostShown) {
    lostShown = true;
    setTimeout(function () {
      lostShown = false;
    }, 5000);
    toast('Сессия устарела. Войди ещё раз — прогресс на месте.');
  }
}
function push() {
  if (!SB || !ME || OWNER || !PULLED) return;
  if (pushing) {
    again = true;
    return;
  }
  pushing = true;
  again = false;
  var row = { user_id: ME, state: JSON.parse(JSON.stringify(S)), updated_at: new Date().toISOString() };
  if (!OLDDB) row.course_id = CUR;
  SB.from('progress')
    .upsert(row, OLDDB ? undefined : { onConflict: 'user_id,course_id' })
    .then(
      function (r) {
        if (authErr(r)) {
          pushing = false;
          sessionLost();
          return;
        }
        syncState = r.error ? 'error' : 'cloud';
      },
      function () {
        syncState = 'error';
      }
    )
    .then(function () {
      pushing = false;
      if (again) push();
      if (view === 'progress') render();
    });
}
/* this learner's progress row in the current course */
function myRow() {
  var q = SB.from('progress').select('state').eq('user_id', ME);
  if (!OLDDB) q = q.eq('course_id', CUR);
  return q.maybeSingle();
}
function pull() {
  if (!SB || !ME || OWNER) return;
  var cid = CUR;
  myRow().then(
    function (r) {
      if (cid !== CUR) return;
      if (authErr(r)) {
        sessionLost();
        return;
      }
      if (r.error) {
        syncState = 'error';
        if (view === 'progress') render();
        return;
      }
      var c = r.data && r.data.state;
      PULLED = true;
      var calm = view !== 'run' && view !== 'result';
      if (!c) {
        if (S.t) push();
        else syncState = 'cloud';
        if (calm) render();
        return;
      }
      var m = mergeS(S, c);
      m.uid = ME;
      if (!same(m, S)) {
        var busy = view === 'run' || view === 'result';
        if (busy) m.t = Math.max(m.t || 0, S.t || 0);
        adopt(m);
        if (m.tour && TOUR >= 0) {
          TOUR = -1;
          TOURQ = false;
        }
        if (!busy) render();
      }
      if (!same(m, fix(c))) push();
      else {
        syncState = 'cloud';
        if (calm) render();
      }
    },
    function () {
      syncState = 'error';
    }
  );
}
