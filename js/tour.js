/* Pulse · tour
 * First-run tour.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- first-run tour ---------- */
var TOURQ = false,
  TOUR = -1;
var TOURS_L = [
  [
    null,
    '👋',
    'Пульс данных обновился',
    'Курс тот же, весь прогресс на месте. Покажу, что нового, — это 30 секунд.'
  ],
  [
    '.todayc',
    '📅',
    'Сегодня — один шаг',
    'На главной только сегодняшний урок. Нажала, прошла — пульс записан. Список всех недель ниже.'
  ],
  [
    '#tabs [data-v="practice"]',
    '🏋️',
    'Практика',
    'Свободная тренировка по темам пройденных уроков. Сначала задания, где были ошибки.'
  ],
  [
    '#tabs [data-v="notes"]',
    '📒',
    'Шпаргалки',
    'Python, pandas, SQL, графики, тесты, метрики, FHIR, MDR — короткие справки, когда пишешь код или читаешь вакансию.'
  ],
  [
    '#tabs [data-v="glossary"]',
    '📖',
    'Словарь из двух частей',
    '«Термины» на трёх языках и «Программирование»: раскрывающиеся карточки — переменные, списки, функции — с примером и типичной ошибкой.'
  ],
  [
    '#tabs [data-v="sandbox"]',
    '🐍',
    'Код',
    'Python прямо в браузере. Примеры из словаря и шпаргалок открываются здесь одной кнопкой.'
  ],
  [
    '#app .hdr .mebtn',
    '👤',
    'Профиль',
    'Нажми на аватар: прогресс, награды, пульс за 14 дней, тема, аватар, напоминания и смена пароля.'
  ],
  [
    null,
    '💡',
    'Главный совет',
    '15 минут каждый день лучше, чем два часа раз в неделю. Включи напоминание — и приложение само позовёт.'
  ]
];
function tours() {
  if (M.tour === 'legacy') return TOURS_L;
  var t = [[null, '👋', M.brand, 'Покажу, как здесь всё устроено, — это 30 секунд.'], TOURS_L[1], TOURS_L[2]];
  if (notes().length)
    t.push([
      '#tabs [data-v="notes"]',
      '📒',
      'Шпаргалки',
      'Короткие справки по темам курса: открывай, когда нужно быстро вспомнить.'
    ]);
  t.push([
    '#tabs [data-v="glossary"]',
    '📖',
    'Словарь',
    'Термины и карточки понятий открываются по мере прохождения уроков.'
  ]);
  if (sandOn()) t.push(TOURS_L[5]);
  return t.concat([TOURS_L[6], TOURS_L[7]]);
}
function vTour() {
  if (TOUR < 0) return '';
  var x = tours()[TOUR],
    last = TOUR === tours().length - 1,
    spot = x[0] && document.querySelector(x[0]);
  return (
    '<div class="tour' +
    (spot ? ' spot' : '') +
    '" role="dialog" aria-modal="true" aria-labelledby="tourh">' +
    (spot ? '<div class="hole"></div>' : '') +
    '<div class="tourbox">' +
    (spot ? '<span class="tarr"></span>' : '') +
    '<div class="tourico" aria-hidden="true">' +
    x[1] +
    '</div><h2 id="tourh">' +
    esc(x[2]) +
    '</h2><p>' +
    esc(x[3]) +
    '</p>' +
    '<div class="tourdots">' +
    tours()
      .map(function (_, i) {
        return '<i class="' + (i === TOUR ? 'on' : '') + '"></i>';
      })
      .join('') +
    '</div>' +
    (TOURQ
      ? '<div class="tourq"><p>Точно пропустить? Это всего 30 секунд.</p><div class="foot"><button class="btn" data-a="tourcont">Продолжить</button><button class="linkbtn" data-a="tourskip">Всё равно пропустить</button></div></div>'
      : '<div class="foot">' +
        (last ? '' : '<button class="linkbtn" data-a="tourask">Пропустить</button>') +
        '<button class="btn" data-a="tournext">' +
        (last ? 'Начать' : 'Дальше') +
        '</button></div>') +
    '</div></div>'
  );
}
function placeTour() {
  var box = $('.tour.spot');
  if (!box) return;
  var el = document.querySelector(tours()[TOUR][0]);
  if (!el) return;
  var r = el.getBoundingClientRect(),
    vh = window.innerHeight,
    vw = document.documentElement.clientWidth || window.innerWidth,
    pad = 6,
    hole = box.querySelector('.hole'),
    tip = box.querySelector('.tourbox'),
    arr = box.querySelector('.tarr');
  hole.style.left = r.left - pad + 'px';
  hole.style.top = r.top - pad + 'px';
  hole.style.width = r.width + pad * 2 + 'px';
  hole.style.height = r.height + pad * 2 + 'px';
  var w = Math.min(360, vw - 24);
  tip.style.width = w + 'px';
  var cx = r.left + r.width / 2,
    left = Math.max(12, Math.min(vw - w - 12, cx - w / 2));
  tip.style.left = left + 'px';
  arr.style.left = Math.max(16, Math.min(w - 28, cx - left - 8)) + 'px';
  var above = r.top - pad - 26,
    below = vh - r.bottom - pad - 26;
  if (above > below) {
    tip.style.top = 'auto';
    tip.style.bottom = vh - r.top + pad + 14 + 'px';
    tip.style.maxHeight = above + 'px';
    arr.className = 'tarr down';
  } else {
    tip.style.bottom = 'auto';
    tip.style.top = r.bottom + pad + 14 + 'px';
    tip.style.maxHeight = below + 'px';
    arr.className = 'tarr up';
  }
  tip.style.overflow = '';
  if (tip.scrollHeight > tip.clientHeight + 2) {
    tip.style.overflow = 'auto';
    arr.style.display = 'none';
  } else arr.style.display = '';
}
window.addEventListener('resize', placeTour);
window.addEventListener('scroll', placeTour, { passive: true });
function maybeTour() {
  if (
    !S.tour &&
    TOUR < 0 &&
    !OWNER &&
    (!SB || !ME || PULLED) &&
    ALL.length &&
    VIEWS.indexOf(view) >= 0 &&
    view !== 'watch'
  ) {
    if (view !== 'path') {
      view = 'path';
      try {
        history.replaceState(null, '', '#path');
      } catch (e) {}
    }
    TOUR = 0;
  }
}
