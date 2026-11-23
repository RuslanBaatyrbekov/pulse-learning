/* Pulse · catalog
 * Course catalog and switching between courses.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- courses ---------- */
function courseTitle(id) {
  var c = CAT.filter(function (x) {
    return x.id === id;
  })[0];
  return (c && c.title) || (id === CUR ? M.brand : id);
}
function loadCatalog() {
  if (!SB) return Promise.resolve();
  return SB.from('course_content')
    .select('id,title,open')
    .order('id')
    .then(
      function (r) {
        if (r.error) {
          if (/title|open|42703|column/i.test(String(r.error.message) + ' ' + String(r.error.code))) {
            OLDDB = true;
            CAT = [{ id: 'main', title: '', open: true }];
          }
          return;
        }
        OLDDB = false;
        CAT = (r.data || []).map(function (x) {
          return { id: x.id, title: x.title || '', open: !!x.open };
        });
        try {
          localStorage.setItem(CATKEY, JSON.stringify(CAT));
        } catch (e) {}
      },
      function () {}
    );
}
/* course to open: the last one chosen on this device, otherwise main, otherwise the first available */
function pickCourse() {
  var ids = CAT.map(function (x) {
    return x.id;
  });
  if (!ids.length || ids.indexOf(CUR) >= 0) return;
  useCourse(ids.indexOf('main') >= 0 ? 'main' : ids[0]);
}
/* the profile (name, avatar, theme, reminders, finished tour) is shared by all courses */
function carry(o) {
  var n = def();
  ['name', 'avatar', 'theme', 'remind', 'remindAsk', 'tour', 'tourDone', 'uid', 'email'].forEach(
    function (k) {
      if (o && o[k] !== undefined) n[k] = o[k];
    }
  );
  return n;
}
function useCourse(id) {
  if (id === CUR) return;
  var prev = S;
  CUR = id;
  setKeys();
  PULLED = false;
  try {
    localStorage.setItem(CURKEY, CUR);
  } catch (e) {}
  var st = null;
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) st = fix(JSON.parse(raw));
  } catch (e) {}
  if (!st || (ME && st.uid && st.uid !== ME)) st = carry(prev);
  S = st;
  R = null;
  T = null;
  NOTE = null;
  NCAT = 'all';
  NQ = '';
  GQ = '';
  var c = null;
  try {
    c = JSON.parse(localStorage.getItem(CKEY) || 'null');
  } catch (e) {}
  if (!c || !setCourse(c)) {
    C = { weeks: [], roadmap: [] };
    setCourse(C);
  }
}
function switchCourse(id) {
  if (
    id === CUR ||
    !CAT.some(function (x) {
      return x.id === id;
    })
  )
    return;
  var keep = view === 'watch' ? 'watch' : 'path';
  clearTimeout(pushT);
  if (SB && ME && !OWNER && S.t) push();
  useCourse(id);
  view = 'boot';
  render();
  (SB && ME ? loadCourse() : Promise.resolve(fromCache())).then(function (ok) {
    if (!ok) {
      view = 'nocourse';
      render();
      return;
    }
    if (SB && ME && !OWNER) {
      syncState = 'connecting';
      pull();
    }
    view = keep;
    try {
      history.replaceState(null, '', '#' + keep);
    } catch (e) {}
    render();
    window.scrollTo(0, 0);
    toast('Курс: ' + courseTitle(id) + '.');
  });
}
function courseLine() {
  return CAT.length > 1
    ? '<div class="row small crsline" style="gap:6px"><span class="muted">Курс:</span><b>' +
        esc(courseTitle(CUR)) +
        '</b><button class="linkbtn" data-a="courses">сменить</button></div>'
    : '';
}
function courseBlock() {
  if (CAT.length < 2) return '';
  return (
    '<div id="courses"><div class="small" style="margin-bottom:6px"><b>Курсы</b></div><p class="small muted" style="margin:0 0 8px">У каждого курса свой прогресс, серия и XP. Имя, аватар, тема и напоминания общие.</p><div class="row" style="gap:8px">' +
    CAT.map(function (c) {
      var on = c.id === CUR;
      return (
        '<button class="btn small' +
        (on ? '' : ' ghost') +
        '" data-a="course" data-v="' +
        esc(c.id) +
        '"' +
        (on ? ' aria-pressed="true"' : '') +
        '>' +
        (on ? '✓ ' : '') +
        esc(c.title || c.id) +
        '</button>'
      );
    }).join('') +
    '</div></div>'
  );
}
