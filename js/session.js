/* Pulse · session
 * Sign-in session and loading the current course.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

function onSession(sess) {
  var id = sess && sess.user ? sess.user.id : null;
  if (!id) {
    presStop();
    ME = null;
    EMAIL = '';
    OWNER = false;
    syncState = 'local';
    R = null;
    T = null;
    view = 'login';
    render();
    return;
  }
  if (id === ME && view !== 'boot' && view !== 'login') return;
  ME = id;
  EMAIL = sess.user.email || '';
  setTimeout(presStart, 0);
  PULLED = false;
  if (S.uid && S.uid !== ME) {
    S = def();
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {}
  }
  S.uid = ME;
  S.email = EMAIL;
  if (!S.name && sess.user.user_metadata && sess.user.user_metadata.name)
    S.name = String(sess.user.user_metadata.name).slice(0, 30);
  SB.from('observers')
    .select('user_id')
    .eq('user_id', ME)
    .maybeSingle()
    .then(
      function (r) {
        OWNER = !!(r && r.data);
      },
      function () {
        OWNER = false;
      }
    )
    .then(loadCatalog)
    .then(pickCourse)
    .then(loadCourse)
    .then(function (ok) {
      if (!ok) {
        view = 'nocourse';
        render();
        return;
      }
      if (OWNER) syncState = 'owner';
      else {
        syncState = 'connecting';
        pull();
        beatStart();
        setTimeout(pushSync, 3000);
      }
      if (view === 'login') {
        view = 'path';
        try {
          history.replaceState(null, '', '#path');
        } catch (e) {}
      } else if (view === 'boot' || view === 'nocourse') view = fromHash();
      render();
    });
}
function loadCourse() {
  var cid = CUR;
  return SB.from('course_content')
    .select('data')
    .eq('id', cid)
    .maybeSingle()
    .then(
      function (r) {
        if (cid !== CUR) return true;
        if (!r.error && r.data && setCourse(r.data.data)) {
          courseErr = '';
          try {
            localStorage.setItem(CKEY, JSON.stringify(r.data.data));
          } catch (e) {}
          return true;
        }
        courseErr = r.error
          ? 'Сервер не отдал уроки: ' + (r.error.message || 'ошибка доступа') + '.'
          : 'В базе нет уроков. Выполни content.sql в Supabase.';
        return fromCache();
      },
      function () {
        courseErr = 'Нет связи с сервером.';
        return fromCache();
      }
    );
}
