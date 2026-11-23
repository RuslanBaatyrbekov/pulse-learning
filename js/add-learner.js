/* Pulse · add-learner
 * Adding a learner or granting a course (observers only, Edge Function create-learner).
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* new learner account: Edge Function create-learner, the secret key stays in Supabase */
var ADD = { busy: false, res: null, err: '' };
function vAdd() {
  var h =
    '<details class="card"' +
    (ADD.res || ADD.err ? ' open' : '') +
    '><summary>Добавить ученика</summary><p class="small muted">Аккаунт создаётся сразу, письмо не нужно. Пароль можно не вводить — придумаю сам. Потом отправь данные ученице.</p>' +
    '<form id="af" style="display:flex;flex-direction:column;gap:8px"><input class="txt" style="max-width:none" id="ae" type="email" placeholder="Email ученика" autocomplete="off" required>' +
    '<input class="txt" style="max-width:none" id="an" placeholder="Имя (необязательно)" maxlength="30" autocomplete="off">' +
    '<input class="txt" style="max-width:none" id="ap" placeholder="Пароль (от 8 символов, необязательно)" autocomplete="new-password">' +
    (!OLDDB && CAT.length
      ? '<label class="small" for="ac">Курс</label><select class="txt sel" style="max-width:none" id="ac">' +
        CAT.map(function (c) {
          return (
            '<option value="' +
            esc(c.id) +
            '"' +
            (c.id === CUR ? ' selected' : '') +
            '>' +
            esc(c.title || c.id) +
            '</option>'
          );
        }).join('') +
        '</select>'
      : '') +
    '<button class="btn" type="submit"' +
    (ADD.busy ? ' disabled' : '') +
    '>' +
    (ADD.busy ? 'Создаю…' : 'Создать аккаунт') +
    '</button></form>';
  if (ADD.err) h += '<p class="small" role="alert" style="color:var(--bad)">' + esc(ADD.err) + '</p>';
  if (ADD.res)
    h +=
      '<p class="small"><b>Готово! Отправь эти данные:</b></p><textarea class="txt" id="amsg" style="max-width:none;min-height:120px" readonly>' +
      esc(addMsg(ADD.res)) +
      '</textarea><div class="row" style="margin-top:8px"><button class="btn small" data-a="addcopy">Скопировать сообщение</button></div>';
  return h + '</details>';
}
function addMsg(r) {
  var cid = r.course_id || CUR,
    head = cid === CUR && M.invite ? M.invite : courseTitle(cid) + ' — ежедневный курс',
    url = location.origin + location.pathname;
  if (r.granted)
    return (
      head +
      '\n' +
      url +
      '\nТебе открыт этот курс. Вход прежний: ' +
      r.email +
      '.\n\nЕсли курсов несколько, переключиться можно в профиле: кнопка с аватаром вверху справа.'
    );
  return (
    head +
    '\n' +
    url +
    '\nEmail: ' +
    r.email +
    '\nПароль: ' +
    r.password +
    '\n\nПароль можно сменить в профиле: кнопка с аватаром вверху справа.'
  );
}
function doAdd() {
  var em = $('#ae').value.trim(),
    nm = $('#an').value.trim(),
    pw = $('#ap').value.trim(),
    ac = $('#ac'),
    cid = ac ? ac.value : '';
  if (!em) return;
  if (!SB || !SB.functions) return;
  ADD = { busy: true, res: null, err: '' };
  render();
  SB.auth.getUser().then(
    function (u) {
      if (u && u.error) {
        ADD = { busy: false, res: null, err: '' };
        sessionLost();
        return null;
      }
      var body = { email: em, name: nm, password: pw };
      if (cid) body.course_id = cid;
      return SB.functions.invoke('create-learner', { body: body }).then(function (r) {
        var d = r.data,
          e = r.error;
        if (e) {
          var ctx = e.context,
            p = ctx && ctx.json ? ctx.json() : Promise.resolve(null);
          return p.then(
            function (j) {
              var code = j && j.error;
              ADD = {
                busy: false,
                res: null,
                err:
                  code === 'exists'
                    ? 'Такой email уже зарегистрирован.'
                    : code === 'course'
                      ? 'Такого курса нет в базе.'
                      : code === 'password'
                        ? 'Пароль должен быть не короче 8 символов.'
                        : code === 'email'
                          ? 'Проверь email.'
                          : /not found|404|FunctionsFetchError|Failed to send/i.test(
                                String(e.message) + String(e.name)
                              )
                            ? 'В Supabase не установлена функция create-learner. Инструкция в README.'
                            : 'Не получилось: ' +
                              (code || e.message || '?') +
                              (j && j.detail ? ' (' + j.detail + ')' : '')
              };
              render();
            },
            function () {
              ADD = { busy: false, res: null, err: 'Не получилось: ' + (e.message || '?') };
              render();
            }
          );
        }
        ADD = { busy: false, res: d, err: '' };
        render();
        loadWatch();
      });
    },
    function (e) {
      ADD = { busy: false, res: null, err: 'Не получилось: ' + String((e && e.message) || e) };
      render();
    }
  );
}
