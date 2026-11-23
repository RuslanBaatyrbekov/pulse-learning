/* Pulse · tutor
 * Optional AI tutor that explains a correct answer.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- AI tutor ---------- */
var tutorOn = false,
  sampleFn = null;
function initTutor() {
  if (!window.claude || !window.claude.use) return;
  window.claude
    .use('sample')
    .then(function (s) {
      if (s) {
        sampleFn = s;
        tutorOn = true;
      }
    })
    .catch(function () {});
}
function askTutor() {
  var st = R && R.q[R.pos];
  if (!st || !sampleFn || !T) return;
  var t = st.t,
    mine = T;
  mine.tutor = 'Думаю…';
  render();
  var body =
    'Вопрос: ' +
    t.q.replace(/<[^>]+>/g, '') +
    (t.code ? '\nКод:\n' + t.code : '') +
    (t.o ? '\nПравильный ответ: ' + t.o[t.a].replace(/<[^>]+>/g, '') : '') +
    (t.lines ? '\nПравильный порядок:\n' + t.lines.join('\n') : '') +
    (t.a && t.t === 'fill' ? '\nПравильный ответ: ' + t.a[0] : '') +
    '\nКраткое пояснение из урока: ' +
    t.e.replace(/<[^>]+>/g, '');
  sampleFn(M.tutor + '\n\n' + body, {
    modelTier: 'quick',
    onText: function (o) {
      if (T === mine) {
        mine.tutor = o.text;
        var el = $('.tutor');
        if (el) el.textContent = o.text;
      }
    }
  }).then(
    function (r) {
      if (T === mine) {
        mine.tutor = r.text || mine.tutor;
        render();
      }
    },
    function (e) {
      if (e && e.code === 'not_granted') tutorOn = false;
      if (T === mine) {
        mine.tutor = 'Наставник сейчас недоступен. Попробуй позже.';
        render();
      }
    }
  );
}
