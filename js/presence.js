/* Pulse · presence
 * Presence and "was online" heartbeat for the observer.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* presence: who has the app open right now (Supabase Realtime, no table) */
var PCH = null,
  ONLINE = {},
  BEAT = null;
function presStart() {
  if (!SB || !ME || PCH || !SB.channel) return;
  try {
    PCH = SB.channel('puls-online', { config: { presence: { key: ME } } });
    PCH.on('presence', { event: 'sync' }, function () {
      var st = PCH.presenceState() || {},
        o = {};
      Object.keys(st).forEach(function (k) {
        o[k] = 1;
      });
      ONLINE = o;
      presPaint();
    });
    PCH.subscribe(function (status) {
      if (status === 'SUBSCRIBED' && !document.hidden) PCH.track({ at: Date.now() });
    });
  } catch (e) {
    PCH = null;
  }
}
function presStop() {
  if (PCH) {
    try {
      SB.removeChannel(PCH);
    } catch (e) {}
    PCH = null;
    ONLINE = {};
  }
  clearInterval(BEAT);
  BEAT = null;
}
/* every 5 minutes while the app is open: a "was online" mark for the observer */
function beat() {
  if (!SB || !ME || OWNER || document.hidden) return;
  var cid = CUR;
  myRow().then(
    function (r) {
      if (cid !== CUR) return;
      if (authErr(r)) {
        sessionLost();
        return;
      }
      if (r.error) return;
      var c = r.data && r.data.state;
      PULLED = true;
      if (c) {
        var m = mergeS(S, c);
        m.uid = ME;
        if (!same(m, S) && view !== 'run' && view !== 'result') {
          adopt(m);
          render();
        }
      }
      S.lastOn = Date.now();
      try {
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch (e) {}
      if (view !== 'run') push();
    },
    function () {}
  );
}
function beatStart() {
  clearInterval(BEAT);
  setTimeout(beat, 1500);
  BEAT = setInterval(beat, 5 * 60000);
}
function presPaint() {
  document.querySelectorAll('[data-uid]').forEach(function (el) {
    var on = !!ONLINE[el.dataset.uid];
    el.classList.toggle('on', on);
    el.title = on ? 'в сети' : '';
  });
  document.querySelectorAll('[data-seen]').forEach(function (el) {
    var on = !!ONLINE[el.dataset.seen];
    el.textContent = on ? 'в сети сейчас' : 'была ' + ago(+el.dataset.ts);
    el.classList.toggle('onl', on);
  });
}
window.addEventListener('online', function () {
  if (SB && ME && !OWNER) pull();
});
document.addEventListener('visibilitychange', function () {
  if (!PCH) return;
  try {
    if (document.hidden) PCH.untrack();
    else PCH.track({ at: Date.now() });
  } catch (e) {}
});
