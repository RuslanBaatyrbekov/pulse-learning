/* Pulse · screen-observer
 * Observer dashboard: learners per course and course access (observers only).
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- observer (owner only) ---------- */
var W = { docs: null, acc: [], at: 0, err: '', ch: null, poll: null, busy: false, sort: 'recent', open: {} };
function ago(t) {
  if (!t) return 'нет данных';
  var m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return m + ' мин назад';
  var hh = Math.round(m / 60);
  if (hh < 24) return hh + ' ч назад';
  var d = Math.round(hh / 24);
  return d + ' ' + plural(d, 'день', 'дня', 'дней') + ' назад';
}
function loadWatch() {
  if (!SB || !OWNER || W.busy) return;
  W.busy = true;
  var acc = OLDDB
    ? Promise.resolve(null)
    : SB.from('course_access')
        .select('user_id,course_id')
        .then(
          function (r) {
            return r.error ? null : r.data;
          },
          function () {
            return null;
          }
        );
  SB.from('progress')
    .select('user_id,state,updated_at' + (OLDDB ? '' : ',course_id'))
    .then(
      function (r) {
        return acc.then(function (a) {
          W.busy = false;
          W.acc = a || [];
          if (authErr(r)) return sessionLost();
          if (r.error) {
            W.err = r.error.message || 'error';
          } else {
            W.err = '';
            W.at = Date.now();
            W.docs = (r.data || [])
              .filter(function (x) {
                return x.user_id !== ME && x.state;
              })
              .map(function (x) {
                var o = fix(x.state);
                o._id = x.user_id;
                o._c = x.course_id || 'main';
                return o;
              });
          }
          if (view === 'watch') renderKeep();
        });
      },
      function () {
        W.busy = false;
        W.err = 'нет связи';
        if (view === 'watch') render();
      }
    );
}
/* learners of the current course; W.open is keyed by learner, so the row key is the learner id */
function wDocs() {
  return (W.docs || []).filter(function (x) {
    return OLDDB || x._c === CUR;
  });
}
function whoName(uid) {
  var d = (W.docs || []).filter(function (x) {
    return x._id === uid && (x.name || x.email);
  })[0];
  return d ? d.name || d.email : uid.slice(0, 8) + '…';
}
/* re-render without losing what the observer is typing: open details, field values, focus */
function renderKeep() {
  var app = $('#app');
  if (!app) {
    render();
    return;
  }
  var det = [].map.call(app.querySelectorAll('details'), function (d) {
    return d.open;
  });
  var vals = {};
  app.querySelectorAll('input,select,textarea').forEach(function (f, i) {
    var k = f.id || f.name || '#' + i;
    vals[k] = f.type === 'checkbox' || f.type === 'radio' ? { c: f.checked } : { v: f.value };
  });
  var ae = document.activeElement,
    fk = ae && app.contains(ae) ? ae.id || ae.name : null,
    sel = null;
  try {
    if (fk && ae.selectionStart != null) sel = [ae.selectionStart, ae.selectionEnd];
  } catch (e) {}
  var y = window.scrollY;
  render();
  [].forEach.call(app.querySelectorAll('details'), function (d, i) {
    if (det[i] != null) d.open = det[i];
  });
  app.querySelectorAll('input,select,textarea').forEach(function (f, i) {
    var k = f.id || f.name || '#' + i,
      o = vals[k];
    if (!o) return;
    if ('c' in o) f.checked = o.c;
    else if (f.type !== 'file') f.value = o.v;
  });
  if (fk) {
    var n = document.getElementById(fk);
    if (n) {
      try {
        n.focus({ preventScroll: true });
        if (sel) n.setSelectionRange(sel[0], sel[1]);
      } catch (e) {}
    }
  }
  window.scrollTo(0, y);
}
function startWatch() {
  if (!SB || !OWNER) return;
  if (!W.docs && !W.busy) loadWatch();
  if (!W.ch && SB.channel) {
    try {
      W.ch = SB.channel('progress-watch')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' }, function () {
          clearTimeout(W.deb);
          W.deb = setTimeout(loadWatch, 3000);
        })
        .subscribe();
    } catch (e) {
      W.ch = null;
    }
  }
  if (!W.poll)
    W.poll = setInterval(function () {
      if (view === 'watch' && !document.hidden) loadWatch();
    }, 60000);
}
function wTags(label, items) {
  return (
    '<div class="small wtags"><b>' +
    esc(label) +
    ':</b> ' +
    (items.length
      ? items
          .map(function (x) {
            return '<span class="tag">' + esc(x[0]) + ' · ' + x[1] + '</span>';
          })
          .join(' ')
      : '<span class="muted">пока нет</span>') +
    '</div>'
  );
}
function learnerDetail(st) {
  var s = streak(st),
    lv = level(st),
    dn = doneCount(st),
    nl = nextLesson(st),
    ni = nextIdx(st),
    t = new Date(),
    wk = 0;
  for (var i = 0; i < 7; i++) if (st.days[ds(addDays(t, -i))] !== undefined) wk++;
  var weak = {},
    bylesson = {};
  Object.keys(st.missed || {}).forEach(function (k) {
    var L = LBY[k.split(':')[0]];
    if (!L) return;
    weak[L.tag] = (weak[L.tag] || 0) + st.missed[k];
    bylesson[L.id] = (bylesson[L.id] || 0) + st.missed[k];
  });
  var topL = Object.keys(bylesson)
    .sort(function (a, b) {
      return bylesson[b] - bylesson[a];
    })
    .slice(0, 3);
  var ns = notes(),
    ks = C.concepts || [];
  var h =
    '<div class="wdetail"><p class="small" style="margin:0">' +
    (nl
      ? 'Сейчас на дне ' + (ni + 1) + ': <b>' + esc(nl.title) + '</b>.'
      : needTrack(st)
        ? 'Общая часть пройдена, ждёт выбора трека.'
        : 'Курс пройден полностью.') +
    (st.track ? ' Трек: ' + esc(trackName(st.track)) + '.' : '') +
    '</p>' +
    '<p class="small muted" style="margin:0">Последний урок или действие: ' +
    ago(st.t) +
    ' · ' +
    (st.tourDone ? 'обучение пройдено' : 'обучение не пройдено') +
    ' · напоминания ' +
    (st.remind && st.remind.on ? 'в ' + hh(st.remind.h) : 'выключены') +
    '</p>' +
    stripSvg(st) +
    '<div class="stats"><div class="stat"><b class="num" style="color:var(--pulse)">' +
    s +
    '</b><span class="small muted">' +
    plural(s, 'день подряд', 'дня подряд', 'дней подряд') +
    '</span></div><div class="stat"><b class="num">' +
    dn +
    ' / ' +
    TOTAL +
    '</b><span class="small muted">дней курса</span></div><div class="stat"><b class="num">' +
    wk +
    ' / 7</b><span class="small muted">за неделю</span></div></div>' +
    '<div><div class="row small" style="justify-content:space-between"><span><b>Уровень ' +
    (lv.i + 1) +
    '.</b> ' +
    lv.name +
    '</span><span class="muted num">' +
    st.xp +
    ' XP</span></div><div class="bar" style="margin-top:6px"><i style="width:' +
    lvPct(st) +
    '%"></i></div></div>' +
    '<p class="small" style="margin:0">Рекорд серии: ' +
    Math.max(st.best || 0, s) +
    '. Заморозок: ' +
    (st.freezes || 0) +
    '. Уроков без ошибок: ' +
    (st.perfect || 0) +
    '. Повторений: ' +
    (st.reviews || 0) +
    '.</p>' +
    wTags(
      'Практика',
      Object.keys(st.prac)
        .sort(function (a, b) {
          return st.prac[b] - st.prac[a];
        })
        .map(function (k) {
          return [k === 'miss' ? 'Работа над ошибками' : TAGS[k] || k, st.prac[k]];
        })
    ) +
    wTags(
      'Шпаргалки',
      Object.keys(st.nt)
        .sort(function (a, b) {
          return st.nt[b] - st.nt[a];
        })
        .map(function (k) {
          var n = ns.filter(function (x) {
            return x.id === k;
          })[0];
          return [n ? n.h : k, st.nt[k]];
        })
    ) +
    wTags(
      'Карточки кода',
      Object.keys(st.cx).map(function (k) {
        var x = ks.filter(function (c) {
          return c.id === k;
        })[0];
        return [x ? x.h : k, st.cx[k]];
      })
    ) +
    '<div><h3>Где были ошибки</h3>' +
    (topL.length
      ? '<div class="row" style="margin-top:6px">' +
        Object.keys(weak)
          .map(function (g) {
            return '<span class="tag">' + esc(TAGS[g] || g) + ': ' + weak[g] + '</span>';
          })
          .join('') +
        '</div><ul class="small" style="margin:8px 0 0;padding-left:18px">' +
        topL
          .map(function (id) {
            return '<li>' + esc(LBY[id].title) + ' — ' + bylesson[id] + '</li>';
          })
          .join('') +
        '</ul>'
      : '<p class="small muted" style="margin:4px 0 0">Неисправленных ошибок нет.</p>') +
    '</div>' +
    '<details><summary class="small">Недели и календарь</summary><div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">' +
    weeksFor(st)
      .map(function (w, wi) {
        var d = w.days.filter(function (l) {
          return st.done[l.id];
        }).length;
        return (
          '<div><div class="row small" style="justify-content:space-between"><span>' +
          (wi + 1) +
          '. ' +
          esc(w.title) +
          '</span><span class="muted num">' +
          d +
          ' / ' +
          w.days.length +
          '</span></div><div class="bar acc" style="margin-top:4px"><i style="width:' +
          Math.round((d / w.days.length) * 100) +
          '%"></i></div></div>'
        );
      })
      .join('') +
    '</div><div style="margin-top:12px">' +
    heat(st) +
    '</div></details></div>';
  return h;
}
function learnerLine(st) {
  var id = st._id,
    open = !!W.open[id],
    name = st.name || st.email || 'Ученица',
    s = streak(st),
    dn = doneCount(st),
    td = st.days[today()] !== undefined,
    seenTs = Math.max(st.lastOn || 0, st.t || 0),
    dots = '',
    t = new Date();
  for (var i = 6; i >= 0; i--)
    dots += '<i class="' + (st.days[ds(addDays(t, -i))] !== undefined ? 'a' : '') + '"></i>';
  var row =
    '<button class="wline' +
    (open ? ' open' : '') +
    '" data-a="wopen" data-v="' +
    esc(id) +
    '" aria-expanded="' +
    open +
    '"><span class="wst' +
    (ONLINE[id] ? ' on' : '') +
    '" data-uid="' +
    esc(id) +
    '"></span><span class="wav">' +
    esc(st.avatar || '🙂') +
    '</span><span class="grow wnm"><b>' +
    esc(name) +
    '</b>' +
    (td ? '<span class="wtd">урок сегодня ✓</span>' : '') +
    '<span class="small muted wseen' +
    (ONLINE[id] ? ' onl' : '') +
    '" data-seen="' +
    esc(id) +
    '" data-ts="' +
    seenTs +
    '">' +
    (ONLINE[id] ? 'в сети сейчас' : 'была ' + ago(seenTs)) +
    '</span></span><span class="wdots" aria-label="Дни за неделю">' +
    dots +
    '</span><span class="wnum num wxp" title="XP">' +
    (st.xp || 0) +
    '</span><span class="wnum num" title="Дней подряд" style="color:var(--pulse)">♥' +
    s +
    '</span><span class="wnum num" title="Дней курса">' +
    dn +
    '/' +
    TOTAL +
    '</span></button>';
  return '<div class="wrow">' + row + (open ? learnerDetail(st) : '') + '</div>';
}
function vWatch() {
  if (!OWNER) return header() + '<div class="card">Эта вкладка доступна только владельцу курса.</div>';
  startWatch();
  var h =
    header() +
    '<section><div class="eyebrow">Наблюдение · обновляется вживую</div><h1>Прогресс учеников</h1><p class="small muted wleg" style="margin:6px 0 0">' +
    (W.at ? 'Данные получены ' + ago(W.at) + '. ' : '') +
    '<span class="wst on"></span> приложение открыто сейчас</p></section>';
  if (CAT.length > 1)
    h +=
      '<div class="row small" style="gap:6px"><span class="muted">Курс:</span>' +
      CAT.map(function (c) {
        return (
          '<button class="chipbtn' +
          (c.id === CUR ? ' on' : '') +
          '" data-a="course" data-v="' +
          esc(c.id) +
          '">' +
          esc(c.title || c.id) +
          '</button>'
        );
      }).join('') +
      '</div>';
  var D = wDocs();
  if (W.err)
    h +=
      '<div class="card">Не удалось получить данные (' +
      esc(W.err) +
      '). Проверь интернет и обнови страницу.</div>';
  else if (!W.docs) h += '<div class="card">Загружаю…</div>';
  else if (!D.length)
    h +=
      '<div class="card">' +
      (CAT.length > 1
        ? 'В этом курсе пока никто не синхронизировал прогресс.'
        : 'Пока никто не синхронизировал прогресс.') +
      ' Он появится здесь после первого входа ученика.</div>';
  else {
    var td = today(),
      act = D.filter(function (x) {
        return x.days[td] !== undefined;
      }).length,
      sort = W.sort;
    var keyf = {
      recent: function (x) {
        return Math.max(x.t || 0, x.lastOn || 0);
      },
      streak: function (x) {
        return streak(x);
      },
      days: function (x) {
        return doneCount(x) * 1e6 + (x.xp || 0);
      }
    }[sort];
    var docs = D.slice().sort(
      sort === 'name'
        ? function (a, b) {
            return String(a.name || a.email || '').localeCompare(String(b.name || b.email || ''));
          }
        : function (a, b) {
            return keyf(b) - keyf(a);
          }
    );
    if (D.length === 1) W.open[D[0]._id] = W.open[D[0]._id] !== false;
    h +=
      '<div class="wsum"><b class="num">' +
      act +
      ' / ' +
      D.length +
      '</b><span class="small">занимались сегодня</span></div>';
    if (D.length > 1)
      h +=
        '<div class="row small" style="gap:6px"><span class="muted">Сортировка:</span>' +
        [
          ['recent', 'Активность'],
          ['streak', 'Серия'],
          ['days', 'Прогресс'],
          ['name', 'Имя']
        ]
          .map(function (k) {
            return (
              '<button class="chipbtn' +
              (sort === k[0] ? ' on' : '') +
              '" data-a="wsort" data-v="' +
              k[0] +
              '">' +
              k[1] +
              '</button>'
            );
          })
          .join('') +
        '</div>';
    h += '<div class="wlist">' + docs.map(learnerLine).join('') + '</div>';
  }
  return h + vAccess() + vAdd() + vUpload();
}
/* who can see the current course */
function vAccess() {
  if (OLDDB) return '';
  var c = CAT.filter(function (x) {
    return x.id === CUR;
  })[0];
  if (!c) return '';
  var who = (W.acc || []).filter(function (a) {
    return a.course_id === CUR;
  });
  return (
    '<details class="card"><summary>Доступ к курсу «' +
    esc(c.title || c.id) +
    '»</summary>' +
    '<p class="small" style="margin:8px 0">' +
    (c.open
      ? 'Курс <b>открыт</b>: его видят все, кто вошёл.'
      : 'Курс <b>закрыт</b>: его видят только ученики из списка ниже.') +
    '</p>' +
    '<div class="row"><button class="btn small ghost" data-a="copen">' +
    (c.open ? 'Закрыть курс' : 'Открыть всем вошедшим') +
    '</button></div>' +
    (who.length
      ? '<ul class="small" style="margin:12px 0 0;padding-left:18px">' +
        who
          .map(function (a) {
            return (
              '<li>' +
              esc(whoName(a.user_id)) +
              ' <button class="linkbtn" data-a="revoke" data-v="' +
              esc(a.user_id) +
              '">забрать доступ</button></li>'
            );
          })
          .join('') +
        '</ul>'
      : '<p class="small muted" style="margin:12px 0 0">Отдельный доступ ещё никому не выдан.</p>') +
    '<p class="small muted" style="margin:10px 0 0">Выдать доступ: «Добавить ученика» ниже с этим курсом. Если аккаунт с таким email уже есть, ему просто откроется курс.</p></details>'
  );
}
