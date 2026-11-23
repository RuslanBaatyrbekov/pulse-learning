/* Pulse · push
 * Installable app and daily reminders (Web Push).
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- installable app and reminders (Web Push) ---------- */
var INSTALL_EVT = null,
  PUSHBUSY = false;
var IOS =
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function standalone() {
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    navigator.standalone === true
  );
}
function pushOk() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!(window.PULS_CONFIG || {}).vapidPublic
  );
}
function needHome() {
  return IOS && !standalone();
}
function remH() {
  return S.remind && S.remind.h != null ? S.remind.h : 19;
}
function hh(h) {
  return (h < 10 ? '0' : '') + h + ':00';
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  INSTALL_EVT = e;
  if (view === 'progress') render();
});
window.addEventListener('appinstalled', function () {
  INSTALL_EVT = null;
  render();
});
function b64u(x) {
  var p = '='.repeat((4 - (x.length % 4)) % 4),
    b = atob((x + p).replace(/-/g, '+').replace(/_/g, '/')),
    a = new Uint8Array(b.length);
  for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}
function subRow(sub, h) {
  var j = sub.toJSON();
  var tz = 'Europe/Berlin';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz;
  } catch (e) {}
  return {
    endpoint: j.endpoint,
    user_id: ME,
    p256dh: j.keys.p256dh,
    auth: j.keys.auth,
    hour: h,
    tz: tz,
    updated_at: new Date().toISOString()
  };
}
function pushOn(h) {
  if (PUSHBUSY) return;
  if (!pushOk()) {
    toast(
      needHome()
        ? 'На iPhone: «Поделиться» → «На экран Домой», потом открой приложение с иконки.'
        : 'Этот браузер не поддерживает уведомления. Открой сайт в Chrome или установи приложение.'
    );
    return;
  }
  if (!SB || !ME) {
    toast('Сначала войди в аккаунт.');
    return;
  }
  PUSHBUSY = true;
  render();
  Notification.requestPermission()
    .then(function (perm) {
      if (perm !== 'granted') throw new Error('denied');
      return navigator.serviceWorker.ready;
    })
    .then(function (reg) {
      return reg.pushManager.getSubscription().then(function (old) {
        return (
          old ||
          reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: b64u(window.PULS_CONFIG.vapidPublic)
          })
        );
      });
    })
    .then(function (sub) {
      return SB.from('push_subs')
        .upsert(subRow(sub, h), { onConflict: 'endpoint' })
        .then(function (r) {
          if (r.error) throw r.error;
        });
    })
    .then(function () {
      S.remind = { on: 1, h: h };
      S.remindAsk = 1;
      save();
      PUSHBUSY = false;
      render();
      toast('Напоминания включены: каждый день в ' + hh(h) + '.');
    })
    .catch(function (e) {
      PUSHBUSY = false;
      render();
      toast(
        String(e && e.message) === 'denied'
          ? 'Уведомления запрещены в браузере. Разреши их в настройках сайта (значок замка у адреса).'
          : 'Не получилось включить напоминания. Попробуй ещё раз.'
      );
    });
}
function pushOff() {
  if (PUSHBUSY) return;
  PUSHBUSY = true;
  var done = function () {
    S.remind = { on: 0, h: remH() };
    save();
    PUSHBUSY = false;
    render();
  };
  if (!pushOk()) {
    done();
    return;
  }
  navigator.serviceWorker.ready
    .then(function (reg) {
      return reg.pushManager.getSubscription();
    })
    .then(function (sub) {
      if (!sub) return;
      var ep = sub.endpoint;
      return sub.unsubscribe().then(function () {
        if (SB && ME) return SB.from('push_subs').delete().eq('endpoint', ep);
      });
    })
    .then(done, done);
}
function pushHour(h) {
  if (!(S.remind && S.remind.on)) {
    S.remind = { on: 0, h: h };
    save();
    render();
    return;
  }
  if (!pushOk() || !SB || !ME) return;
  navigator.serviceWorker.ready
    .then(function (reg) {
      return reg.pushManager.getSubscription();
    })
    .then(function (sub) {
      if (!sub) {
        pushOn(h);
        return;
      }
      return SB.from('push_subs')
        .upsert(subRow(sub, h), { onConflict: 'endpoint' })
        .then(function (r) {
          if (r.error) throw r.error;
          S.remind = { on: 1, h: h };
          save();
          render();
          toast('Напоминания: каждый день в ' + hh(h) + '.');
        });
    })
    .catch(function () {
      toast('Не получилось сменить время. Попробуй ещё раз.');
    });
}
/* keeps the server copy of this device's subscription fresh (new keys, another account on the same phone) */
function pushSync() {
  if (!pushOk() || !SB || !ME || OWNER || !(S.remind && S.remind.on) || Notification.permission !== 'granted')
    return;
  navigator.serviceWorker.ready
    .then(function (reg) {
      return reg.pushManager.getSubscription();
    })
    .then(function (sub) {
      if (sub)
        SB.from('push_subs')
          .upsert(subRow(sub, remH()), { onConflict: 'endpoint' })
          .then(
            function () {},
            function () {}
          );
    })
    .catch(function () {});
}
function remCard() {
  if (OWNER || S.remindAsk || (S.remind && S.remind.on) || !S.tourDone || TOUR >= 0) return '';
  if (!pushOk() && !needHome()) return '';
  if (window.Notification && Notification.permission === 'denied') return '';
  return (
    '<section class="card remcard"><div class="row" style="gap:12px;align-items:flex-start;flex-wrap:nowrap"><span class="rci" aria-hidden="true">🔔</span><div class="grow"><b>Напоминать о занятии в ' +
    hh(remH()) +
    '?</b><p class="small muted" style="margin:4px 0 0">' +
    (needHome()
      ? 'На iPhone сначала: «Поделиться» → «На экран Домой», потом открой приложение с иконки.'
      : 'Одно уведомление в день и только если сегодня ещё не было урока. Время можно поменять в профиле.') +
    '</p></div></div>' +
    '<div class="foot">' +
    (needHome() ? '' : '<button class="btn small" data-a="remon">Включить</button>') +
    '<button class="linkbtn" data-a="remlater">Не сейчас</button></div></section>'
  );
}
function remBlock() {
  if (OWNER) return '';
  var on = S.remind && S.remind.on,
    h = remH(),
    opts = '';
  for (var i = 6; i <= 22; i++)
    opts += '<option value="' + i + '"' + (i === h ? ' selected' : '') + '>' + hh(i) + '</option>';
  var st = !pushOk()
    ? needHome()
      ? 'На iPhone: «Поделиться» → «На экран Домой», потом открой приложение с иконки — там можно включить напоминания.'
      : 'Этот браузер не поддерживает уведомления. Открой сайт в Chrome или установи приложение.'
    : window.Notification && Notification.permission === 'denied'
      ? 'Уведомления запрещены в браузере. Разреши их в настройках сайта (значок замка у адреса).'
      : 'Одно уведомление в день в выбранное время — только если сегодня ещё не было урока.';
  var inst = INSTALL_EVT
    ? '<div style="margin-top:10px"><button class="btn small ghost" data-a="install">📲 Установить приложение</button><p class="small muted" style="margin:6px 0 0">Иконка на главном экране, открывается без адресной строки.</p></div>'
    : '';
  return (
    '<div class="remblk"><div class="small" style="margin-bottom:6px"><b>🔔 Напоминания</b></div><p class="small muted" style="margin:0 0 8px">' +
    st +
    '</p>' +
    (pushOk()
      ? '<div class="row" style="gap:8px"><label class="small" for="remh">Время</label><select id="remh" class="txt sel" data-ch="remh">' +
        opts +
        '</select>' +
        (on
          ? '<button class="btn small ghost" data-a="remoff"' +
            (PUSHBUSY ? ' disabled' : '') +
            '>Выключить</button><span class="small" style="color:var(--ok)">✓ включены</span>'
          : '<button class="btn small" data-a="remon"' +
            (PUSHBUSY ? ' disabled' : '') +
            '>Включить</button>') +
        '</div>'
      : '') +
    inst +
    '</div>'
  );
}
