/* Pulse · main
 * Rendering, event handlers and app start.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- render and events ---------- */
function render() {
  rebuild();
  if (view === 'sandbox' && !sandOn()) view = 'path';
  maybeTour();
  var a = $('#app'),
    tabs = $('#tabs'),
    inRun = view === 'run' || view === 'result' || view === 'login' || view === 'boot' || view === 'nocourse';
  tabs.hidden = inRun;
  tabs.style.display = inRun ? 'none' : '';
  a.innerHTML =
    view === 'nocourse'
      ? vNoCourse()
      : view === 'login'
        ? vLogin()
        : view === 'boot'
          ? vBoot()
          : view === 'run'
            ? vRun()
            : view === 'result'
              ? vResult()
              : view === 'practice'
                ? vPractice()
                : view === 'notes'
                  ? vNotes()
                  : view === 'note'
                    ? vNote()
                    : view === 'glossary'
                      ? vGloss()
                      : view === 'sandbox'
                        ? vSand()
                        : view === 'progress'
                          ? vProg()
                          : view === 'watch'
                            ? vWatch()
                            : vPath();
  var wt = $('#watchtab');
  if (wt) wt.hidden = !OWNER;
  var sbt = $('#sandtab');
  if (sbt) sbt.hidden = !sandOn();
  if (!inRun)
    tabs.querySelectorAll('button').forEach(function (b) {
      if (b.dataset.v === view || (view === 'note' && b.dataset.v === 'notes'))
        b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  if (view === 'glossary' && GQ) gFilter();
  var old = $('.tour');
  if (old) old.remove();
  if (TOUR >= 0) {
    var tg = tours()[TOUR][0] && document.querySelector(tours()[TOUR][0]);
    if (tg && tg.closest('#app')) window.scrollBy(0, tg.getBoundingClientRect().top - 80);
    document.body.insertAdjacentHTML('beforeend', vTour());
    placeTour();
  }
  var f = $('#fillin');
  if (f && !f.disabled) f.focus({ preventScroll: true });
}
var resetArmed = false,
  impArmed = false;
var A = {
  tab: function (el) {
    view = el.dataset.v;
    try {
      location.hash = view;
    } catch (e) {}
    render();
    window.scrollTo(0, 0);
  },
  open: function (el) {
    if (el.getAttribute('aria-disabled')) return toast('Этот день откроется после предыдущего.');
    openLesson(+el.dataset.i);
  },
  prac: function (el) {
    if (el.getAttribute('aria-disabled')) return toast('Тема откроется после первого урока по ней.');
    openPractice(el.dataset.v);
  },
  review: openReview,
  next: next,
  check: check,
  home: backOut,
  quit: function () {
    backOut();
    toast('Урок не засчитан. Его можно начать заново.');
  },
  sel: function (el) {
    if (T.done) return;
    T.sel = +el.dataset.j;
    render();
  },
  pick: function (el) {
    if (T.done) return;
    T.ans.push(+el.dataset.j);
    render();
  },
  unpick: function (el) {
    if (T.done) return;
    T.ans = T.ans.filter(function (j) {
      return j !== +el.dataset.j;
    });
    render();
  },
  ml: function (el) {
    T.l = +el.dataset.j;
    T.bad = null;
    render();
  },
  mr: function (el) {
    if (T.l < 0) return toast('Сначала выбери слева.');
    var j = +el.dataset.j,
      st = R.q[R.pos],
      t = st.t;
    if (j === T.l) {
      T.ok[j] = 1;
      T.l = -1;
      T.bad = null;
      if (Object.keys(T.ok).length === t.pairs.length) {
        var clean = T.err === 0;
        T.done = true;
        T.right = true;
        S.seen[t._k] = today();
        if (clean && st.first) R.ok++;
        else R.fixed++;
        if (!clean) S.missed[t._k] = (S.missed[t._k] || 0) + 1;
        else if (R.kind !== 'lesson') delete S.missed[t._k];
      }
    } else {
      T.err++;
      T.bad = j;
    }
    render();
  },
  mission: function (el) {
    R.mission = el.dataset.v === '1';
    next();
  },
  logout: function () {
    if (!SB) return;
    try {
      history.replaceState(null, '', '#path');
    } catch (e) {}
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('puls-course-v1') === 0) localStorage.removeItem(k);
      });
      localStorage.removeItem(CATKEY);
    } catch (e) {}
    CAT = [];
    setCourse({ weeks: [], roadmap: [] });
    presStop();
    SB.auth.signOut({ scope: 'local' }).then(
      function () {},
      function () {}
    );
    onSession(null);
  },
  retry: function () {
    view = 'boot';
    render();
    SB.auth.getSession().then(function (r) {
      ME = null;
      onSession(r && r.data && r.data.session);
    });
  },
  track: function (el) {
    var v = el.dataset.v;
    if (trackList().indexOf(v) < 0) return;
    S.track = v;
    save();
    rebuild();
    view = 'path';
    try {
      location.hash = 'path';
    } catch (e) {}
    render();
    window.scrollTo(0, 0);
    toast('Трек: ' + trackName(v) + '. Следующий урок уже ждёт.');
  },
  runhere: runHere,
  run: runPy,
  tutor: askTutor,
  course: function (el) {
    switchCourse(el.dataset.v);
  },
  courses: function () {
    view = 'progress';
    try {
      location.hash = 'progress';
    } catch (e) {}
    render();
    var c = document.getElementById('courses');
    if (c) c.scrollIntoView({ block: 'center' });
  },
  copen: function () {
    var c = CAT.filter(function (x) {
      return x.id === CUR;
    })[0];
    if (!c || !SB) return;
    var v = !c.open;
    SB.from('course_content')
      .update({ open: v })
      .eq('id', CUR)
      .then(function (r) {
        if (authErr(r)) return sessionLost();
        if (r.error) return toast('Не получилось: ' + r.error.message);
        c.open = v;
        loadCatalog().then(function () {
          render();
        });
        toast(v ? 'Курс открыт всем вошедшим.' : 'Курс закрыт: его видят только ученики из списка.');
      });
  },
  revoke: function (el) {
    var u = el.dataset.v;
    if (!SB) return;
    SB.from('course_access')
      .delete()
      .eq('user_id', u)
      .eq('course_id', CUR)
      .then(function (r) {
        if (authErr(r)) return sessionLost();
        if (r.error) return toast('Не получилось: ' + r.error.message);
        toast('Доступ закрыт.');
        loadWatch();
      });
  },
  tosand: function (el) {
    sandSrc = el.dataset.src;
    sandOut = '';
    view = 'sandbox';
    try {
      location.hash = 'sandbox';
    } catch (e) {}
    render();
    window.scrollTo(0, 0);
  },
  note: function (el) {
    openNote(el.dataset.v);
  },
  nback: function () {
    try {
      if (history.state && history.state.pulsNote) {
        history.back();
        return;
      }
    } catch (e) {}
    closeNote();
  },
  ncat: function (el) {
    NCAT = el.dataset.v;
    document.querySelectorAll('.ncats .chip').forEach(function (c) {
      var on = c.dataset.v === NCAT;
      c.classList.toggle('on', on);
      c.setAttribute('aria-selected', on);
    });
    nFilter();
  },
  gtab: function (el) {
    GT = el.dataset.v;
    GQ = '';
    render();
  },
  theme: function (el) {
    S.theme = el.dataset.v;
    applyTheme(S.theme);
    save();
    render();
  },
  avatar: function (el) {
    S.avatar = el.dataset.v;
    save();
    render();
  },
  tour: function () {
    TOURQ = false;
    TOUR = 0;
    view = 'path';
    try {
      location.hash = 'path';
    } catch (e) {}
    render();
  },
  tournext: function () {
    TOURQ = false;
    if (TOUR < tours().length - 1) {
      TOUR++;
      render();
    } else {
      TOUR = -1;
      S.tour = 1;
      S.tourDone = 1;
      save();
      render();
      toast('Готово! Хорошей учёбы.');
    }
  },
  tourask: function () {
    TOURQ = true;
    render();
  },
  tourcont: function () {
    TOURQ = false;
    render();
  },
  tourskip: function () {
    TOURQ = false;
    TOUR = -1;
    S.tour = 1;
    save();
    render();
  },
  remon: function () {
    var el = $('#remh');
    pushOn(el ? +el.value : remH());
  },
  remoff: function () {
    pushOff();
  },
  remlater: function () {
    S.remindAsk = 1;
    save();
    render();
  },
  install: function () {
    if (!INSTALL_EVT) return;
    var e = INSTALL_EVT;
    e.prompt();
    (e.userChoice || Promise.resolve()).then(function () {
      INSTALL_EVT = null;
      render();
    });
  },
  wsort: function (el) {
    W.sort = el.dataset.v;
    render();
  },
  wopen: function (el) {
    var id = el.dataset.v;
    W.open[id] = !W.open[id];
    render();
  },
  addcopy: function () {
    var ta = $('#amsg');
    ta.select();
    try {
      navigator.clipboard.writeText(ta.value).then(
        function () {
          toast('Скопировано.');
        },
        function () {
          toast('Выдели текст и скопируй вручную.');
        }
      );
    } catch (e) {
      toast('Выдели текст и скопируй вручную.');
    }
  },
  exp: function () {
    var code = btoa(unescape(encodeURIComponent(JSON.stringify(S)))),
      ta = $('#code');
    ta.value = code;
    ta.select();
    try {
      navigator.clipboard.writeText(code).then(
        function () {
          toast('Код скопирован. Сохрани его в надёжном месте.');
        },
        function () {
          toast('Код в поле ниже. Выдели его и скопируй вручную.');
        }
      );
    } catch (e) {
      toast('Код в поле ниже. Выдели его и скопируй вручную.');
    }
  },
  imp: function () {
    var v = $('#code').value.replace(/\s+/g, ''),
      o = null;
    if (!v) return toast('Сначала вставь код в поле.');
    try {
      o = JSON.parse(decodeURIComponent(escape(atob(v))));
    } catch (e) {}
    if (!o || typeof o.xp !== 'number' || typeof o.done !== 'object' || typeof o.days !== 'object')
      return toast('Код не читается. Проверь, что он вставлен целиком.');
    if (o.xp < S.xp && !impArmed) {
      impArmed = true;
      setTimeout(function () {
        impArmed = false;
      }, 6000);
      return toast(
        'В коде меньше XP, чем сейчас (' + o.xp + ' против ' + S.xp + '). Нажми ещё раз, чтобы заменить.'
      );
    }
    impArmed = false;
    var uid = S.uid,
      em = S.email;
    S = fix(o);
    if (uid) {
      S.uid = uid;
      S.email = em;
    }
    S.wipe = Date.now();
    save();
    render();
    toast('Прогресс восстановлен: ' + S.xp + ' XP.');
  },
  name: function () {
    S.name = $('#nm').value.trim().slice(0, 30);
    save();
    render();
    toast('Сохранено.');
  },
  reset: function (el) {
    if (!resetArmed) {
      resetArmed = true;
      el.textContent = 'Нажми ещё раз, чтобы стереть всё';
      setTimeout(function () {
        resetArmed = false;
      }, 5000);
      return;
    }
    resetArmed = false;
    var n = S.name,
      av = S.avatar,
      th = S.theme,
      uid = S.uid,
      em = S.email;
    S = def();
    S.name = n;
    S.avatar = av;
    S.theme = th;
    S.tour = 1;
    S.tourDone = 1;
    if (uid) {
      S.uid = uid;
      S.email = em;
    }
    S.wipe = Date.now();
    save();
    render();
    toast('Прогресс сброшен.');
  }
};
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  var f = A[el.dataset.a];
  if (f) f(el);
});
document.addEventListener('change', function (e) {
  if (e.target.id === 'upf' && e.target.files && e.target.files[0]) {
    doUpload(e.target.files[0]);
    e.target.value = '';
    return;
  }
  if (e.target.dataset && e.target.dataset.ch === 'remh') pushHour(+e.target.value);
});
document.addEventListener('submit', function (e) {
  if (e.target.id === 'lf') {
    e.preventDefault();
    doLogin();
  }
  if (e.target.id === 'af') {
    e.preventDefault();
    doAdd();
  }
  if (e.target.id === 'pwf') {
    e.preventDefault();
    doPw();
  }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target.id === 'fillin') {
    e.preventDefault();
    check();
  }
});
document.addEventListener('input', function (e) {
  var id = e.target.id;
  if (id === 'ucid') upFill();
  else if (id === 'src') sandSrc = e.target.value;
  else if (id === 'fillin' && T) T.val = e.target.value;
  else if (id === 'nq') {
    NQ = e.target.value.trim();
    nFilter();
  } else if (id === 'gq') {
    GQ = e.target.value.trim();
    gFilter();
  }
});
/* an opened code card: counted for the observer */
document.addEventListener(
  'toggle',
  function (e) {
    var d = e.target;
    if (d && d.classList && d.classList.contains('cx') && d.open && d.dataset.id) {
      S.cx[d.dataset.id] = (S.cx[d.dataset.id] || 0) + 1;
      save();
    }
  },
  true
);

window.PULS_APP = {
  state: function () {
    return S;
  },
  view: function () {
    return view;
  }
};
if (window.COURSE) setCourse(window.COURSE);
applyFreezes();
view = cfgOk() ? 'boot' : ALL.length ? fromHash() : 'nocourse';
render();
initCloud();
initTutor();
