/* Pulse · upload
 * Uploading a course from the app (observers only).
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* new course version right from the app (RLS policy "course: observers update") */
function vUpload() {
  var file =
    '<label class="btn small ghost" style="display:inline-flex;align-items:center;cursor:pointer;align-self:flex-start">Выбрать файл<input type="file" id="upf" accept=".json,application/json" hidden></label>';
  if (OLDDB)
    return (
      '<details class="card"><summary>Загрузить курс</summary><p class="small muted">Выбери файл course.json. Курс заменится для всех сразу, прогресс учеников не трогается: он привязан к id уроков. Чтобы держать несколько курсов, выполни в Supabase migrations/001_multi_course.sql.</p>' +
      file +
      '</details>'
    );
  var c =
    CAT.filter(function (x) {
      return x.id === CUR;
    })[0] || {};
  return (
    '<details class="card"><summary>Загрузить курс</summary><p class="small muted">Тот же id — новая версия курса: прогресс учеников не трогается, он привязан к id уроков. Новый id — новый курс со своим прогрессом.</p>' +
    '<div style="display:flex;flex-direction:column;gap:8px"><label class="small" for="ucid">id курса</label><input class="txt" style="max-width:none" id="ucid" list="ucat" value="' +
    esc(CUR) +
    '" autocomplete="off" spellcheck="false" placeholder="латиница, цифры, - и _"><datalist id="ucat">' +
    CAT.map(function (x) {
      return '<option value="' + esc(x.id) + '">' + esc(x.title || '') + '</option>';
    }).join('') +
    '</datalist>' +
    '<label class="small" for="uttl">Название</label><input class="txt" style="max-width:none" id="uttl" maxlength="60" value="' +
    esc(c.title || '') +
    '" placeholder="Как курс называется в списке">' +
    '<label class="small"><input type="checkbox" id="uopen"' +
    (c.open ? ' checked' : '') +
    '> Открыт всем вошедшим (иначе только тем, кому выдан доступ)</label>' +
    file +
    '</div></details>'
  );
}
function upFill() {
  var id = ($('#ucid') || {}).value,
    c = CAT.filter(function (x) {
      return x.id === id;
    })[0];
  if (!c) return;
  var t = $('#uttl'),
    o = $('#uopen');
  if (t) t.value = c.title || '';
  if (o) o.checked = !!c.open;
}
function doUpload(file) {
  var id = OLDDB
      ? 'main'
      : String(($('#ucid') || {}).value || '')
          .trim()
          .toLowerCase(),
    ttl = String(($('#uttl') || {}).value || '')
      .trim()
      .slice(0, 60),
    op = !!($('#uopen') || {}).checked;
  if (!Core.isCourseId(id)) return toast('id курса: латиница, цифры, «-» и «_», до 40 символов.');
  var rd = new FileReader();
  rd.onload = function () {
    var c = null;
    try {
      c = JSON.parse(rd.result);
    } catch (e) {}
    var ok =
      c &&
      Array.isArray(c.weeks) &&
      c.weeks.length &&
      c.weeks.every(function (w) {
        return (
          w &&
          Array.isArray(w.days) &&
          w.days.every(function (d) {
            return d && d.id && d.title && Array.isArray(d.cards);
          })
        );
      });
    if (!ok) return toast('Это не файл курса: нет недель или у урока нет id.');
    var row = { id: id, data: c, updated_at: new Date().toISOString() };
    if (!OLDDB) {
      row.title = ttl || (c.meta && c.meta.brand) || id;
      row.open = op;
    }
    SB.from('course_content')
      .upsert(row)
      .then(
        function (r) {
          if (authErr(r)) return sessionLost();
          if (r.error) return toast('Не получилось: ' + r.error.message);
          var n = 0;
          c.weeks.forEach(function (w) {
            n += w.days.length;
          });
          try {
            localStorage.setItem(kC(id), JSON.stringify(c));
          } catch (e) {}
          if (id === CUR) setCourse(c);
          loadCatalog().then(function () {
            render();
            toast(
              (id === CUR ? 'Курс обновлён: ' : 'Курс «' + courseTitle(id) + '» загружен: ') +
                n +
                ' ' +
                plural(n, 'урок', 'урока', 'уроков') +
                ', шпаргалок ' +
                (c.notes || []).length +
                '.'
            );
          });
        },
        function (e) {
          toast('Не получилось: ' + String((e && e.message) || e));
        }
      );
  };
  rd.readAsText(file);
}
