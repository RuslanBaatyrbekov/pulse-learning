/* Pulse · runner
 * Lesson runner: lessons, practice, review and their tasks.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- lesson, practice, review ---------- */
function startRun(L, kind, q, isNew, sec) {
  if (view !== 'run' && view !== 'result') {
    BACK = view;
    try {
      history.pushState({ pulsRun: 1 }, '');
    } catch (e) {}
  }
  R = {
    L: L,
    kind: kind,
    sec: sec || '',
    q: q,
    pos: 0,
    total: q.length,
    ok: 0,
    fixed: 0,
    isNew: !!isNew,
    review: kind === 'review',
    mission: false
  };
  T = null;
  view = 'run';
  render();
  window.scrollTo(0, 0);
}
function leaveRun() {
  var wasRun = view === 'run';
  R = null;
  T = null;
  view = VIEWS.indexOf(BACK) >= 0 ? BACK : 'path';
  try {
    if (location.hash.slice(1) !== view) history.replaceState(history.state, '', '#' + view);
  } catch (e) {}
  render();
  window.scrollTo(0, 0);
  return wasRun;
}
function backOut() {
  try {
    if (history.state && history.state.pulsRun) {
      history.back();
      return;
    }
  } catch (e) {}
  leaveRun();
}
window.addEventListener('popstate', function () {
  if (view === 'run' || view === 'result') {
    if (leaveRun()) toast('Урок не засчитан. Его можно начать заново.');
  } else if (view === 'note') closeNote();
});
function weekTasks(wi) {
  var a = [];
  WK[wi].days.forEach(function (l) {
    (l.tasks || []).forEach(function (t) {
      a.push(t);
    });
  });
  return a;
}
function openLesson(i) {
  var L = ALL[i],
    isNew = !S.done[L.id];
  if (isNew && i !== nextIdx()) return toast('Сначала пройди предыдущий день.');
  if (isNew && newToday() >= 2) return toast('Два новых урока в день — максимум. Этот откроется завтра.');
  var tasks = L.boss ? shuffle(weekTasks(L.week)).slice(0, 8) : L.tasks;
  var q = L.cards
    .map(function (c) {
      return { k: 'card', c: c };
    })
    .concat(
      tasks.map(function (t) {
        return { k: 'task', t: t, first: true };
      })
    );
  if (L.mission) q.push({ k: 'mission', m: L.mission });
  startRun(L, 'lesson', q, isNew);
}
function openReview() {
  var pool = doneTasks();
  if (!pool.length) return toast('Повторять пока нечего. Пройди первый урок.');
  var tasks = pickFrom(pool, 6);
  startRun(
    { id: 'review', title: 'Повторение', tag: 'stat' },
    'review',
    shuffle(tasks).map(function (t) {
      return { k: 'task', t: t, first: true };
    }),
    false
  );
}
function initTask(t) {
  T = { done: false, right: false, tutor: '' };
  if (t.t === 'mc') {
    T.opts = shuffle(
      t.o.map(function (_, i) {
        return i;
      })
    );
    T.sel = -1;
  }
  if (t.t === 'order') {
    T.pool = shuffle(
      t.lines.map(function (_, i) {
        return i;
      })
    );
    if (
      T.pool.every(function (v, i) {
        return v === i;
      })
    )
      T.pool.reverse();
    T.ans = [];
  }
  if (t.t === 'match') {
    T.right_ = shuffle(
      t.pairs.map(function (_, i) {
        return i;
      })
    );
    T.l = -1;
    T.ok = {};
    T.err = 0;
    T.bad = null;
  }
  if (t.t === 'fill') {
    T.val = '';
  }
}
function codeBlock(c, run) {
  return (
    '<pre class="code">' +
    esc(c) +
    '</pre>' +
    (run
      ? '<div><button class="btn small ghost" data-a="runhere"' +
        (pyLoading ? ' disabled' : '') +
        '>' +
        (pyLoading ? 'Выполняю…' : 'Запустить код') +
        '</button></div>' +
        (R && R.out ? '<pre class="out" aria-live="polite">' + esc(R.out) + '</pre>' : '')
      : '')
  );
}
function vRun() {
  var st = R.q[R.pos],
    pct = Math.round((R.pos / R.q.length) * 100);
  var h =
    '<div class="runhead"><button class="x" data-a="quit" aria-label="Выйти из урока">✕ Выйти</button><div class="bar acc grow"><i style="width:' +
    pct +
    '%"></i></div></div><section class="lesson">';
  if (st.k === 'card') {
    var c = st.c,
      isPy = sandOn() && c.code && R.L.tag === 'py';
    h +=
      '<div class="eyebrow">' +
      esc(R.L.title) +
      '</div><h1>' +
      c.h +
      '</h1><p>' +
      c.t +
      '</p>' +
      (c.code ? codeBlock(c.code, isPy) : '') +
      '<div class="foot"><button class="btn" data-a="next">Дальше</button></div>';
  } else if (st.k === 'mission') {
    var m = st.m;
    h +=
      '<div class="eyebrow">Практика недели</div><h1>' +
      m.h +
      '</h1><p>Настоящий код вне уроков. Это 15–20 минут, можно сделать сегодня или в выходной.</p><ol class="steps">' +
      m.steps
        .map(function (s) {
          return '<li>' + esc(s) + '</li>';
        })
        .join('') +
      '</ol>' +
      (m.url
        ? '<div><a href="' +
          esc(m.url) +
          '" target="_blank" rel="noopener">' +
          esc(m.label || M.missionLabel) +
          '</a></div>'
        : '') +
      '<div class="foot"><button class="btn" data-a="mission" data-v="1">' +
      esc(M.missionDone) +
      '</button><button class="btn ghost" data-a="mission" data-v="0">Сделаю позже</button></div>';
  } else {
    var t = st.t;
    if (!T) initTask(t);
    h +=
      '<div class="eyebrow">' +
      (R.kind === 'lesson' ? '' : esc(TAGS[t._tag] || '') + ' · ') +
      (st.first ? 'Задание' : 'Ещё раз') +
      '</div><h2>' +
      t.q +
      '</h2>';
    if (t.t === 'mc') {
      if (t.code) h += codeBlock(t.code);
      h +=
        '<div class="opts">' +
        T.opts
          .map(function (j) {
            var cl = T.done ? (j === t.a ? ' good' : j === T.sel ? ' wrong' : '') : j === T.sel ? ' sel' : '';
            return (
              '<button class="opt' +
              cl +
              '" data-a="sel" data-j="' +
              j +
              '"' +
              (T.done ? ' disabled' : '') +
              '>' +
              t.o[j] +
              '</button>'
            );
          })
          .join('') +
        '</div>';
    }
    if (t.t === 'fill') {
      h +=
        '<pre class="code">' +
        esc(t.code).replace(
          '___',
          '<input id="fillin" aria-label="Пропуск в коде" autocomplete="off" autocapitalize="off" spellcheck="false" value="' +
            esc(T.val) +
            '"' +
            (T.done ? ' disabled' : '') +
            '>'
        ) +
        '</pre>';
      if (T.done && !T.right) h += '<p class="small">Правильно: <code>' + esc(t.a[0]) + '</code></p>';
    }
    if (t.t === 'order') {
      h +=
        '<div class="lines" aria-label="Твоя программа">' +
        (T.ans.length
          ? T.ans
              .map(function (j) {
                return (
                  '<button class="ln" data-a="unpick" data-j="' +
                  j +
                  '"' +
                  (T.done ? ' disabled' : '') +
                  '>' +
                  esc(t.lines[j]) +
                  '</button>'
                );
              })
              .join('')
          : '<span class="small muted">Нажимай строки ниже в нужном порядке</span>') +
        '</div><div class="pool">' +
        T.pool
          .filter(function (j) {
            return T.ans.indexOf(j) < 0;
          })
          .map(function (j) {
            return '<button class="ln" data-a="pick" data-j="' + j + '">' + esc(t.lines[j]) + '</button>';
          })
          .join('') +
        '</div>';
      if (T.done && !T.right) h += '<p class="small">Правильный порядок:</p>' + codeBlock(t.lines.join('\n'));
    }
    if (t.t === 'match') {
      h += '<div class="match">';
      for (var i = 0; i < t.pairs.length; i++) {
        var r = T.right_[i];
        h +=
          '<button class="' +
          (T.ok[i] ? 'good' : T.l === i ? 'sel' : '') +
          '" data-a="ml" data-j="' +
          i +
          '"' +
          (T.ok[i] ? ' disabled' : '') +
          '>' +
          esc(t.pairs[i][0]) +
          '</button><button class="' +
          (T.ok[r] ? 'good' : T.bad === r ? 'wrong' : '') +
          '" data-a="mr" data-j="' +
          r +
          '"' +
          (T.ok[r] ? ' disabled' : '') +
          '>' +
          esc(t.pairs[r][1]) +
          '</button>';
      }
      h += '</div><p class="small muted">Нажми слева, потом пару справа.</p>';
    }
    if (T.done) {
      h +=
        '<div class="fb ' +
        (T.right ? 'ok' : 'bad') +
        '" role="status"><b>' +
        (T.right ? 'Верно' : 'Пока нет') +
        '</b><span>' +
        t.e +
        '</span>' +
        (T.right ? '' : '<span class="small">Задание вернётся в конце.</span>') +
        (T.tutor ? '<div class="tutor">' + esc(T.tutor) + '</div>' : '') +
        '</div>';
      h +=
        '<div class="foot"><button class="btn" data-a="next">Дальше</button>' +
        (tutorOn && !T.tutor ? '<button class="btn ghost" data-a="tutor">Объясни подробнее</button>' : '') +
        '</div>';
    } else if (t.t !== 'match') {
      var ready = t.t === 'mc' ? T.sel >= 0 : t.t === 'order' ? T.ans.length === t.lines.length : true;
      h +=
        '<div class="foot"><button class="btn" data-a="check"' +
        (ready ? '' : ' disabled') +
        '>Проверить</button></div>';
    }
  }
  return h + '</section>';
}
function norm(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/['‘’‚“”„«»`]/g, '"')
    .replace(/\s+/g, '');
}
/* a mistake is cleared in review and practice; in the lesson itself it stays visible to the observer */
function settle(right) {
  var st = R.q[R.pos],
    t = st.t;
  T.done = true;
  T.right = right;
  S.seen[t._k] = today();
  if (right) {
    if (st.first) R.ok++;
    else R.fixed++;
    if (R.kind !== 'lesson' && S.missed[t._k]) delete S.missed[t._k];
  } else {
    S.missed[t._k] = (S.missed[t._k] || 0) + 1;
    R.q.push({ k: 'task', t: t, first: false });
  }
  render();
}
function check() {
  var t = R.q[R.pos].t,
    ok = false;
  if (t.t === 'mc') ok = T.sel === t.a;
  if (t.t === 'fill') {
    T.val = $('#fillin').value;
    var v = norm(T.val);
    if (!v) return toast('Впиши ответ в пропуск.');
    ok = t.a.some(function (a) {
      return norm(a) === v;
    });
  }
  if (t.t === 'order')
    ok = T.ans.every(function (j, i) {
      return t.lines[j] === t.lines[i];
    });
  settle(ok);
}
function next() {
  T = null;
  R.out = '';
  R.pos++;
  if (R.pos >= R.q.length) finish();
  else {
    render();
    window.scrollTo(0, 0);
  }
}
function finish() {
  var L = R.L,
    td = today(),
    first = S.days[td] === undefined,
    gain,
    tasks = R.ok + R.fixed,
    perfect = R.fixed === 0 && tasks > 0;
  if (R.kind === 'review') {
    gain = tasks * 3;
    S.reviews++;
  } else if (R.kind === 'practice') {
    gain = R.ok * 5 + R.fixed * 2;
    S.prac[R.sec] = (S.prac[R.sec] || 0) + 1;
  } else if (!R.isNew) gain = 5;
  else gain = R.ok * 10 + R.fixed * 5 + (L.boss ? 50 : 20);
  if (R.mission) {
    gain += 30;
    S.missions[L.id] = 1;
  }
  S.xp += gain;
  S.days[td] = (S.days[td] || 0) + gain;
  if (R.isNew && R.kind === 'lesson') {
    S.done[L.id] = { d: td, p: perfect ? 1 : 0 };
    if (perfect) S.perfect++;
    if (S.newDay !== td) {
      S.newDay = td;
      S.newN = 0;
    }
    S.newN++;
  }
  var s = streak(),
    fz = false;
  if (s > S.best) S.best = s;
  if (first && s > 0 && s % 7 === 0 && S.freezes < 2) {
    S.freezes++;
    fz = true;
  }
  var kx =
    R.isNew && R.kind === 'lesson'
      ? (C.concepts || []).filter(function (k) {
          return k.after === L.id;
        }).length
      : 0;
  save();
  RES = {
    gain: gain,
    ok: R.ok,
    tasks: tasks,
    streak: s,
    first: first,
    fz: fz,
    title: L.title,
    kind: R.kind,
    sec: R.sec,
    isNew: R.isNew,
    perfect: perfect,
    terms: R.isNew && R.kind === 'lesson' && L.terms ? L.terms.length : 0,
    kx: kx
  };
  R = null;
  view = 'result';
  render();
  window.scrollTo(0, 0);
}
function vResult() {
  var r = RES,
    lv = level(),
    ni = nextIdx(),
    more = ni >= 0 && newToday() < 2;
  var head =
    r.kind === 'review'
      ? 'Повторение сделано'
      : r.kind === 'practice'
        ? 'Тренировка сделана'
        : r.isNew
          ? 'День закрыт'
          : 'Повторено';
  var line = r.first
    ? 'Сегодняшний удар пульса записан. Серия: ' +
      r.streak +
      ' ' +
      plural(r.streak, 'день', 'дня', 'дней') +
      '.'
    : 'Серия: ' + r.streak + ' ' + plural(r.streak, 'день', 'дня', 'дней') + '.';
  var opened = [];
  if (r.terms) opened.push('терминов: ' + r.terms);
  if (r.kx) opened.push('карточек кода: ' + r.kx);
  return (
    '<section class="result"><svg class="ecg" viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 55 H90 Q100 42 110 55 H128 L138 64 L152 8 L166 78 L176 55 H196 Q214 34 232 55 H400"/></svg><div><div class="eyebrow">' +
    esc(r.title) +
    '</div><h1>' +
    head +
    '</h1><p style="margin:8px 0 0">' +
    line +
    (r.fz ? ' За 7 дней подряд ты получила заморозку.' : '') +
    '</p></div>' +
    '<div class="stats"><div class="stat"><b class="num">+' +
    r.gain +
    '</b><span class="small muted">XP</span></div><div class="stat"><b class="num">' +
    r.ok +
    ' / ' +
    r.tasks +
    '</b><span class="small muted">с первой попытки</span></div><div class="stat"><b class="num">' +
    r.streak +
    '</b><span class="small muted">' +
    plural(r.streak, 'день подряд', 'дня подряд', 'дней подряд') +
    '</span></div></div>' +
    '<div class="card"><div class="row small" style="justify-content:space-between"><span><b>Уровень ' +
    (lv.i + 1) +
    '.</b> ' +
    lv.name +
    '</span><span class="muted num">' +
    S.xp +
    (lv.to ? ' / ' + lv.to : '') +
    ' XP</span></div><div class="bar" style="margin-top:6px"><i style="width:' +
    lvPct() +
    '%"></i></div>' +
    (opened.length
      ? '<p class="small" style="margin:10px 0 0">В словаре открыто: ' + opened.join(', ') + '.</p>'
      : '') +
    (r.perfect && r.kind === 'lesson' ? '<p class="small" style="margin:6px 0 0">Ни одной ошибки.</p>' : '') +
    '</div>' +
    '<div class="foot"><button class="btn" data-a="home">' +
    (BACK === 'path' ? 'На главную' : 'Назад') +
    '</button>' +
    (r.kind === 'practice'
      ? '<button class="btn ghost" data-a="prac" data-v="' + esc(r.sec) + '">Ещё тренировка</button>'
      : more && r.kind === 'lesson'
        ? '<button class="btn ghost" data-a="open" data-i="' + ni + '">Ещё один урок</button>'
        : '') +
    '</div><p class="small muted" style="margin:0">Завтра ждёт ' +
    (ni >= 0
      ? 'день ' + (ni + 1) + ': ' + esc(ALL[ni].title)
      : needTrack()
        ? 'выбор трека на главной'
        : 'повторение') +
    '.</p></section>'
  );
}
