/* Pulse · login
 * Start screens: no course, sign-in, loading; Supabase client set-up.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

function fromCache() {
  try {
    var c = JSON.parse(localStorage.getItem(CKEY) || 'null');
    if (c && setCourse(c)) {
      toast('Нет связи: уроки открыты из сохранённой копии.');
      return true;
    }
  } catch (e) {}
  return false;
}
function brandH() {
  return (
    '<div class="brand"><svg viewBox="0 0 28 16"><path d="M0 9h7l2-3 3 9 3-14 3 8h10"/></svg>' +
    esc(M.brand) +
    '</div>'
  );
}
function vNoCourse() {
  var noCfg = !cfgOk();
  return (
    '<div class="top">' +
    brandH() +
    '</div><section class="card hero"><h1>' +
    (noCfg ? 'Курс не настроен' : 'Уроки не загрузились') +
    '</h1><p class="small" style="margin:0">' +
    (noCfg ? 'Заполни адрес базы и ключ в config.js. Подробности в README.' : esc(courseErr)) +
    '</p>' +
    (noCfg
      ? ''
      : '<div class="foot"><button class="btn" data-a="retry">Попробовать снова</button>' +
        (ME ? '<button class="btn ghost" data-a="logout">Выйти</button>' : '') +
        '</div>') +
    '</section>'
  );
}
function initCloud() {
  if (!cfgOk()) return;
  var c = window.PULS_CONFIG;
  SB = window.supabase.createClient(c.url, c.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  view = 'boot';
  render();
  SB.auth.getSession().then(
    function (r) {
      onSession(r && r.data && r.data.session);
    },
    function () {
      onSession(null);
    }
  );
  SB.auth.onAuthStateChange(function (ev) {
    if (ev === 'SIGNED_OUT' && ME) onSession(null);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    pull();
    if (ME && !OWNER) beat();
    if (OWNER && view === 'watch') loadWatch();
  });
  window.addEventListener('online', function () {
    pull();
  });
}
function doLogin() {
  var em = $('#em').value.trim(),
    pw = $('#pw').value;
  loginEm = em;
  if (!em || !pw) {
    loginErr = 'Введи email и пароль.';
    render();
    return;
  }
  loginBusy = true;
  loginErr = '';
  render();
  SB.auth.signInWithPassword({ email: em, password: pw }).then(
    function (r) {
      loginBusy = false;
      if (r.error) {
        loginErr = /invalid/i.test(r.error.message)
          ? 'Неверный email или пароль.'
          : 'Не получилось войти: ' + r.error.message;
        render();
        return;
      }
      onSession(r.data.session);
    },
    function () {
      loginBusy = false;
      loginErr = 'Нет связи с сервером. Проверь интернет.';
      render();
    }
  );
}
function vLogin() {
  return (
    '<div class="top">' +
    brandH() +
    '</div>' +
    '<section class="card hero"><div class="eyebrow">Вход</div><h1>Твой курс ждёт</h1><p class="small muted" style="margin:0">Вход нужен, чтобы прогресс сохранялся на сервере и был виден на всех твоих устройствах. Аккаунт выдаёт владелец курса, регистрации нет.</p>' +
    '<form id="lf" style="display:flex;flex-direction:column;gap:10px"><label class="small" for="em">Email</label><input class="txt" style="max-width:none" id="em" type="email" autocomplete="username" inputmode="email" required value="' +
    esc(loginEm) +
    '">' +
    '<label class="small" for="pw">Пароль</label><input class="txt" style="max-width:none" id="pw" type="password" autocomplete="current-password" required>' +
    (loginErr
      ? '<p class="small" role="alert" style="margin:0;color:var(--bad)">' + esc(loginErr) + '</p>'
      : '') +
    '<button class="btn" type="submit"' +
    (loginBusy ? ' disabled' : '') +
    '>' +
    (loginBusy ? 'Вхожу…' : 'Войти') +
    '</button></form></section>'
  );
}
function vBoot() {
  return '<div class="card">Загрузка…</div>';
}
