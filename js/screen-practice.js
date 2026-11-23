/* Pulse · screen-practice
 * Free practice by topic.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- free practice ---------- */
function doneTasks(tag) {
  var a = [];
  ALL.forEach(function (l) {
    if (S.done[l.id] && (!tag || l.tag === tag))
      (l.tasks || []).forEach(function (t) {
        a.push(t);
      });
  });
  return a;
}
function tagStats(tag) {
  var a = doneTasks(tag),
    seen = 0,
    miss = 0;
  a.forEach(function (x) {
    if (S.seen[x._k]) seen++;
    if (S.missed[x._k]) miss++;
  });
  return { n: a.length, seen: seen, miss: miss };
}
function practiceTags() {
  var o = [];
  ALL.forEach(function (l) {
    if (l.tag !== 'boss' && o.indexOf(l.tag) < 0 && (l.tasks || []).length) o.push(l.tag);
  });
  return o;
}
function vPractice() {
  var h =
    header() +
    '<section><div class="eyebrow">Практика</div><h1>Свободная тренировка</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">Задания из пройденных уроков по выбранной теме. Сначала те, где были ошибки, потом давно не виденные. Новые уроки здесь не открываются, зато XP идут.</p></section>';
  var allMiss = doneTasks().filter(function (x) {
    return S.missed[x._k];
  }).length;
  h += '<div class="secs">';
  if (allMiss)
    h +=
      '<button class="sec hot" data-a="prac" data-v="miss"><span class="ico" aria-hidden="true">✗→✓</span><span class="grow"><span class="tt">Работа над ошибками</span><br><span class="st">Все задания, где ошибка ещё не исправлена</span></span><span class="num small" style="color:var(--bad)">' +
      allMiss +
      '</span></button>';
  practiceTags().forEach(function (tag) {
    var st = tagStats(tag),
      lock = !st.n;
    h +=
      '<button class="sec' +
      (lock ? ' off' : '') +
      '" data-a="prac" data-v="' +
      tag +
      '"' +
      (lock ? ' aria-disabled="true"' : '') +
      '><span class="ico" aria-hidden="true">' +
      esc(TAG_ICO[tag] || tag) +
      '</span><span class="grow"><span class="tt">' +
      esc(TAGS[tag] || tag) +
      '</span><br><span class="st">' +
      (lock
        ? 'Откроется после первого урока по теме'
        : st.n + ' ' + plural(st.n, 'задание', 'задания', 'заданий') + ' из пройденных уроков') +
      '</span></span><span class="num small muted" style="text-align:right">' +
      (lock
        ? '🔒'
        : st.seen +
          '/' +
          st.n +
          (st.miss ? '<br><span style="color:var(--bad)">ошибок: ' + st.miss + '</span>' : '')) +
      '</span></button>';
  });
  h += '</div>';
  if (doneCount())
    h +=
      '<section class="card"><h3>Повторение</h3><p class="small" style="margin:6px 0 10px">Смесь из всех пройденных тем, 6 заданий. Хорошо в конце дня.</p><button class="btn small" data-a="review">Начать повторение</button></section>';
  return h;
}
function pickFrom(pool, n) {
  var miss = shuffle(
      pool.filter(function (x) {
        return S.missed[x._k];
      })
    ),
    fresh = shuffle(
      pool.filter(function (x) {
        return !S.missed[x._k] && !S.seen[x._k];
      })
    ),
    old = pool
      .filter(function (x) {
        return !S.missed[x._k] && S.seen[x._k];
      })
      .sort(function (a, b) {
        return String(S.seen[a._k]).localeCompare(String(S.seen[b._k]));
      });
  var all = miss.slice(0, Math.ceil(n / 2)).concat(fresh, old, miss.slice(Math.ceil(n / 2))),
    out = [];
  all.forEach(function (x) {
    if (out.length < n && out.indexOf(x) < 0) out.push(x);
  });
  return out;
}
function openPractice(tag) {
  var pool =
    tag === 'miss'
      ? doneTasks().filter(function (x) {
          return S.missed[x._k];
        })
      : doneTasks(tag);
  if (!pool.length) return toast('Здесь пока пусто: пройди урок по этой теме.');
  var tasks = shuffle(pickFrom(pool, 8));
  startRun(
    {
      id: 'prac-' + tag,
      title: tag === 'miss' ? 'Работа над ошибками' : 'Практика: ' + (TAGS[tag] || tag),
      tag: tag === 'miss' ? 'stat' : tag
    },
    'practice',
    tasks.map(function (t) {
      return { k: 'task', t: t, first: true };
    }),
    false,
    tag
  );
}
