/* Pulse · screen-path
 * Header and the Today screen (course path).
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- header ---------- */
function header() {
  var nm = (S.name || '').trim().split(/\s+/)[0] || 'Профиль',
    on = view === 'progress';
  return (
    '<div class="top hdr"><div class="hl">' +
    brandH() +
    '' +
    (OWNER
      ? '<div class="small muted">Режим наблюдателя</div>'
      : '<div class="chips"><span class="chip num" title="Дней подряд"><b>♥</b> ' +
        streak() +
        '</span><span class="chip xp num" title="Очки опыта"><b>XP</b> ' +
        S.xp +
        '</span></div>') +
    '</div>' +
    '<button class="mebtn' +
    (on ? ' on' : '') +
    '" data-a="tab" data-v="progress" aria-label="Профиль и прогресс"' +
    (on ? ' aria-current="page"' : '') +
    '><span class="meav" aria-hidden="true">' +
    esc(S.avatar || M.avatar) +
    '</span><span class="mename">' +
    esc(nm) +
    '</span></button></div>'
  );
}

/* ---------- today (path) ---------- */
function dayRow(L) {
  var done = !!S.done[L.id],
    nx = nextIdx() === L.idx,
    cls = done ? 'done' : nx ? 'next' : 'lock';
  var st = done
    ? (S.done[L.id].p ? 'Без ошибок' : 'Пройдено') + ' · можно повторить'
    : nx
      ? L.boss
        ? 'Контрольная и практика · 20 мин'
        : 'Урок · 15 мин'
      : 'Откроется после предыдущего дня';
  return (
    '<button class="day ' +
    cls +
    '" data-a="open" data-i="' +
    L.idx +
    '"' +
    (cls === 'lock' ? ' aria-disabled="true"' : '') +
    '><span class="n">' +
    (done ? '✓' : L.idx + 1) +
    '</span><span class="grow"><span class="tt">' +
    esc(L.title) +
    '</span><br><span class="st">' +
    st +
    '</span></span><span class="tag">' +
    (TAGS[L.tag] || '') +
    '</span></button>'
  );
}
function vPath() {
  var s = streak(),
    ni = nextIdx(),
    did = S.days[today()] !== undefined,
    cap = newToday() >= 2,
    h = header(),
    dc = doneCount(),
    lv = level(),
    body;
  if (S.tour && !S.tourDone && TOUR < 0)
    h +=
      '<button class="tourcard" data-a="tour"><span class="tci" aria-hidden="true">🎓</span><span class="grow"><b>Что нового — за 30 секунд</b><br><span class="small">Практика, шпаргалки, словарь, напоминания</span></span><span class="tcb" aria-hidden="true">▶</span></button>';
  h += remCard() + courseLine();
  var rev = dc ? '<button class="linkbtn" data-a="review">Повторение пройденного</button>' : '';
  if (needTrack()) {
    body =
      '<div class="eyebrow">Развилка</div><h2 class="daytitle">Общая часть пройдена</h2><p class="small" style="margin:0">' +
      esc(M.trackPrompt) +
      '</p><div class="foot">' +
      trackList()
        .map(function (t, i) {
          return (
            '<button class="btn' +
            (i ? ' ghost' : '') +
            '" data-a="track" data-v="' +
            esc(t) +
            '">' +
            esc(trackName(t)) +
            '</button>'
          );
        })
        .join('') +
      '</div>';
  } else if (ni < 0) {
    body =
      '<div class="eyebrow">🏁 Финиш</div><h2 class="daytitle">Весь курс пройден</h2><p class="small" style="margin:0">Повторение и практика держат знания свежими, а профиль хранит весь путь.</p><div class="foot"><button class="btn" data-a="review">Повторение</button><button class="btn ghost" data-a="tab" data-v="practice">Практика</button></div>';
  } else if (!did) {
    var L = ALL[ni];
    body =
      '<div class="eyebrow">Сегодня · день ' +
      (ni + 1) +
      '</div><h2 class="daytitle">' +
      esc(L.title) +
      '</h2><p class="small muted" style="margin:0">' +
      (TAGS[L.tag] || '') +
      ' · ' +
      (L.boss ? 'контрольная и практика, ≈ 20 минут' : '≈ 15 минут') +
      '</p>' +
      '<p class="small" style="margin:0">' +
      (s > 0
        ? 'Пульс ' + s + ' ' + plural(s, 'день', 'дня', 'дней') + ' подряд — не прерывай серию.'
        : 'Один урок в день, и пульс пошёл.') +
      '</p>' +
      '<div class="foot"><button class="btn big-cta" data-a="open" data-i="' +
      ni +
      '">Начать день ' +
      (ni + 1) +
      ' →</button></div>' +
      rev;
  } else {
    body =
      '<div class="eyebrow">✅</div><h2 class="daytitle">День ' +
      Math.max(1, ni) +
      ' сделан!</h2><p class="small" style="margin:0">' +
      (cap
        ? 'Два новых урока за день — максимум. День ' + (ni + 1) + ' откроется завтра.'
        : 'Сегодняшний пульс записан. Можно остановиться, пройти ещё урок или потренироваться.') +
      '</p>' +
      '<div class="foot">' +
      (cap
        ? ''
        : '<button class="btn ghost" data-a="open" data-i="' +
          ni +
          '">Ещё урок: день ' +
          (ni + 1) +
          '</button>') +
      '<button class="btn ghost" data-a="tab" data-v="practice">Практика</button></div>' +
      rev;
  }
  h +=
    '<section class="card hero todayc' +
    (did && ni >= 0 && !needTrack() ? ' done' : '') +
    '"><div class="todaygo">' +
    body +
    '</div><div class="lvline"><div class="row small" style="justify-content:space-between"><span><b>Уровень ' +
    (lv.i + 1) +
    '.</b> ' +
    lv.name +
    '</span><span class="muted num">' +
    S.xp +
    (lv.to ? ' / ' + lv.to : '') +
    ' XP</span></div><div class="bar" style="margin-top:6px"><i style="width:' +
    lvPct() +
    '%"></i></div></div></section>';
  WK.forEach(function (w, wi) {
    var d = w.days.filter(function (l) {
      return S.done[l.id];
    }).length;
    h +=
      '<section class="week"><div><div class="eyebrow">Неделя ' +
      (wi + 1) +
      (w.track ? ' · трек ' + esc(trackName(w.track)) : '') +
      ' · <span class="num">' +
      d +
      ' из ' +
      w.days.length +
      '</span></div><h2>' +
      esc(w.title) +
      '</h2><p class="small muted" style="margin:4px 0 0">' +
      esc(w.sub) +
      '</p></div><div class="days">' +
      w.days.map(dayRow).join('') +
      '</div></section>';
  });
  if (C.roadmap && C.roadmap.length)
    h +=
      '<section class="card"><div class="eyebrow">Дальше по плану</div><h2 style="margin:4px 0 12px">' +
      esc(M.roadmapTitle) +
      '</h2><div class="road">' +
      C.roadmap
        .map(function (r) {
          return (
            '<div><span class="small muted">' +
            r.w +
            '</span><br><b>' +
            r.t +
            '</b><br><span class="small">' +
            r.d +
            '</span></div>'
          );
        })
        .join('') +
      '</div></section>';
  return h;
}
