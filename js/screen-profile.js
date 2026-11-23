/* Pulse · screen-profile
 * Profile: progress, badges, settings, account.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- profile ---------- */
function badges() {
  var s = Math.max(S.best, streak()),
    dn = doneCount(),
    pr = Object.keys(S.prac).reduce(function (a, k) {
      return a + S.prac[k];
    }, 0);
  var hasMission = ALL.some(function (l) {
      return !!l.mission;
    }),
    out = [
      ['Первый шаг', 'Пройден первый урок', dn >= 1],
      ['Три дня подряд', 'Пульс держится 3 дня', s >= 3],
      ['Неделя без пропусков', '7 дней подряд', s >= 7],
      ['Две недели', '14 дней подряд', s >= 14],
      ['Месяц', '30 дней подряд', s >= 30],
      ['Чистая работа', 'Урок без единой ошибки', S.perfect >= 1],
      ['Пять чистых', '5 уроков без ошибок', S.perfect >= 5]
    ];
  /* course milestones: a lesson id or a special condition (@mission, @track, @final) */
  (M.milestones || []).forEach(function (b) {
    var k = b[2];
    if (k === '@mission') {
      if (hasMission || M.tour === 'legacy') out.push([b[0], b[1], Object.keys(S.missions).length >= 1]);
    } else if (k === '@track') {
      if (hasTracks() || M.tour === 'legacy') out.push([b[0], b[1], !!S.track]);
    } else if (k === '@final') out.push([b[0], b[1], dn > 0 && nextIdx() < 0 && !needTrack()]);
    else out.push([b[0], b[1], !!S.done[k]]);
  });
  out.push(
    ['Повторение — мать учения', '10 повторений', S.reviews >= 10],
    ['Тренировка', '5 свободных тренировок', pr >= 5]
  );
  if (notes().length || M.tour === 'legacy')
    out.push(['Справочник', 'Открыто 5 шпаргалок', Object.keys(S.nt).length >= 5]);
  return out;
}
function syncLine() {
  return (
    {
      cloud:
        'Синхронизация включена: прогресс хранится на защищённом сервере и виден на всех твоих устройствах.',
      connecting: 'Подключаю синхронизацию…',
      owner:
        'Ты наблюдатель: твой прогресс хранится только в этом браузере, прогресс учеников — во вкладке «Наблюдение».',
      error: 'Нет связи с сервером. Прогресс сохраняется в этом браузере и отправится, когда связь появится.'
    }[syncState] || 'Прогресс сохраняется автоматически в этом браузере на этом устройстве.'
  );
}
function vProg() {
  var lv = level(),
    dn = doneCount(),
    s = streak();
  var h =
    header() +
    '<section class="card hero"><div class="row" style="gap:14px;flex-wrap:nowrap"><div class="me-av" aria-hidden="true">' +
    esc(S.avatar || M.avatar) +
    '</div><div class="grow"><div class="eyebrow">Профиль</div><h1 style="margin:2px 0">' +
    esc(S.name || 'Твой прогресс') +
    '</h1><div class="small"><b>Уровень ' +
    (lv.i + 1) +
    '.</b> ' +
    lv.name +
    ' · <span class="num muted">' +
    S.xp +
    ' XP</span></div></div></div><div class="bar"><i style="width:' +
    lvPct() +
    '%"></i></div></section>';
  h +=
    '<div class="stats"><div class="stat"><b class="num">' +
    dn +
    ' / ' +
    TOTAL +
    '</b><span class="small muted">дней курса</span></div><div class="stat"><b class="num">' +
    S.xp +
    '</b><span class="small muted">XP</span></div><div class="stat"><b class="num">' +
    Math.max(S.best, s) +
    '</b><span class="small muted">рекорд дней подряд</span></div></div>';
  h +=
    '<section class="card"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><h3>Пульс за 14 дней</h3><div class="row" style="align-items:baseline;gap:8px;margin-top:4px"><span class="big num">' +
    s +
    '</span><span class="muted">' +
    plural(s, 'день подряд', 'дня подряд', 'дней подряд') +
    '</span></div></div><div class="small muted" style="text-align:right">Заморозки: <b class="num">' +
    S.freezes +
    '</b></div></div><div style="margin-top:10px">' +
    stripSvg() +
    '</div></section>';
  h +=
    '<section class="card"><h3>Последние 5 недель</h3><p class="small muted" style="margin:4px 0 10px">Пн–Вс. Зелёный: занималась. Жёлтый: сработала заморозка.</p>' +
    heat() +
    '</section>';
  var byTag = {};
  ALL.forEach(function (l) {
    if (l.tag === 'boss') return;
    var b = (byTag[l.tag] = byTag[l.tag] || [0, 0]);
    b[1]++;
    if (S.done[l.id]) b[0]++;
  });
  h +=
    '<section class="card" style="display:flex;flex-direction:column;gap:10px"><h3>По темам</h3>' +
    Object.keys(byTag)
      .map(function (k) {
        var b = byTag[k];
        return (
          '<div><div class="row small" style="justify-content:space-between"><span>' +
          esc(TAGS[k] || k) +
          '</span><span class="num muted">' +
          b[0] +
          ' / ' +
          b[1] +
          '</span></div><div class="bar acc" style="margin-top:4px"><i style="width:' +
          Math.round((b[0] / b[1]) * 100) +
          '%"></i></div></div>'
        );
      })
      .join('') +
    '</section>';
  h +=
    '<section><h3 style="margin-bottom:8px">Награды</h3><div class="badges">' +
    badges()
      .map(function (b) {
        return (
          '<div class="badge' +
          (b[2] ? '' : ' off') +
          '"><b>' +
          (b[2] ? '✓ ' : '') +
          b[0] +
          '</b><span class="small muted">' +
          b[1] +
          '</span></div>'
        );
      })
      .join('') +
    '</div></section>';
  h +=
    '<section class="card"><h3>Как это работает</h3><p class="small" style="margin:6px 0 0;max-width:62ch">Один урок в день держит пульс. В день можно пройти не больше двух новых уроков, повторять и тренироваться можно сколько угодно. За каждые 7 дней подряд ты получаешь заморозку: она спасает серию, если один день пропущен. Ошибки не страшны: задание вернётся в конце урока, а потом в «Работе над ошибками».</p></section>';
  h +=
    '<section class="card" style="display:flex;flex-direction:column;gap:14px"><h3>Настройки</h3>' +
    '<div><div class="small" style="margin-bottom:6px"><b>Тема</b></div><div class="themes">' +
    THEMES.map(function (x) {
      var cur = (S.theme || 'auto') === x[0];
      return (
        '<button class="th" data-a="theme" data-v="' +
        x[0] +
        '" aria-pressed="' +
        cur +
        '"><span class="sw">' +
        (x[2]
          ? x[2]
              .map(function (c) {
                return '<i style="background:' + c + '"></i>';
              })
              .join('')
          : '<i style="background:#f2f5f4"></i><i style="background:#0c181d"></i>') +
        '</span>' +
        esc(x[1]) +
        '</button>'
      );
    }).join('') +
    '</div></div>' +
    '<div><div class="small" style="margin-bottom:6px"><b>Аватар</b></div><div class="avs">' +
    AVATARS.map(function (a) {
      return (
        '<button class="av" data-a="avatar" data-v="' +
        a +
        '" aria-pressed="' +
        (S.avatar === a) +
        '">' +
        a +
        '</button>'
      );
    }).join('') +
    '</div></div>' +
    remBlock() +
    courseBlock() +
    '<div class="row"><label for="nm" class="small">Имя</label><input class="txt" id="nm" value="' +
    esc(S.name) +
    '" maxlength="30"><button class="btn small" data-a="name">Сохранить</button></div>' +
    (hasTracks() && S.track
      ? '<div><div class="small"><b>Трек:</b> ' +
        esc(trackName(S.track)) +
        '. Пройденные уроки всех треков сохраняются.</div><div class="row" style="margin-top:8px">' +
        trackList()
          .filter(function (t) {
            return t !== S.track;
          })
          .map(function (t) {
            return (
              '<button class="btn small ghost" data-a="track" data-v="' +
              esc(t) +
              '">Перейти на ' +
              esc(trackName(t)) +
              '</button>'
            );
          })
          .join('') +
        '</div></div>'
      : '') +
    '<p class="small muted" style="margin:0">' +
    syncLine() +
    (EMAIL ? ' Вход: ' + esc(EMAIL) + '.' : '') +
    '</p>' +
    '<details><summary class="small">Резервная копия прогресса</summary><p class="small" style="margin:8px 0 10px;max-width:62ch">Код прогресса хранит всё: пройденные дни, XP и серию. Скопируй его и сохрани, например отправь себе в мессенджер. Чтобы восстановить, вставь код и нажми «Восстановить».</p><div class="row"><button class="btn small" data-a="exp">Скопировать код прогресса</button></div><label class="eyebrow" for="code" style="display:block;margin-top:12px">Код</label><textarea id="code" class="txt" style="max-width:100%;min-height:70px;font-family:var(--f-mono);font-size:12px" spellcheck="false" autocomplete="off" placeholder="Вставь сюда сохранённый код"></textarea><div class="row" style="margin-top:8px"><button class="btn small ghost" data-a="imp">Восстановить из кода</button></div></details>' +
    (SB && ME
      ? '<details><summary class="small">Сменить пароль</summary><form id="pwf" style="display:flex;flex-direction:column;gap:8px;margin-top:8px"><input type="email" autocomplete="username" value="' +
        esc(EMAIL) +
        '" hidden><input class="txt" style="max-width:none" id="pw1" type="password" autocomplete="new-password" placeholder="Новый пароль (от 8 символов)"><input class="txt" style="max-width:none" id="pw2" type="password" autocomplete="new-password" placeholder="Повтори пароль"><button class="btn small" type="submit">Сохранить пароль</button></form></details>'
      : '') +
    '<div class="row"><button class="btn small ghost" data-a="tour">Как пользоваться</button>' +
    (SB && ME ? '<button class="btn small ghost" data-a="logout">Выйти на этом устройстве</button>' : '') +
    '<button class="btn small ghost" data-a="reset" id="rst" style="color:var(--bad)">Сбросить весь прогресс</button></div></section>';
  return h;
}
function doPw() {
  var a = $('#pw1').value,
    b = $('#pw2').value;
  if (a.length < 8) return toast('Пароль слишком короткий: нужно минимум 8 символов.');
  if (a !== b) return toast('Пароли не совпадают.');
  SB.auth.updateUser({ password: a }).then(
    function (r) {
      if (authErr(r)) return sessionLost();
      if (r.error) {
        toast('Не получилось: ' + r.error.message);
        return;
      }
      $('#pw1').value = '';
      $('#pw2').value = '';
      toast('Пароль изменён.');
    },
    function (e) {
      toast('Не получилось: ' + String((e && e.message) || e));
    }
  );
}
