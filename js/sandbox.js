/* Pulse · sandbox
 * In-browser Python sandbox (Pyodide).
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- Python sandbox ---------- */
var sandSrc =
    'werte = [72, 80, 95, 110]\nfor w in werte:\n    if w > 100:\n        print(w, "Tachykardie")\n    else:\n        print(w, "ok")',
  sandOut = '',
  py = null,
  pyLoading = false;
function vSand() {
  return (
    header() +
    '<section><div class="eyebrow">Код</div><h1>Python прямо здесь</h1><p class="small muted" style="margin:6px 0 0;max-width:60ch">Пиши код и запускай. Первый запуск загружает Python, это до минуты. Примеры из уроков, словаря и шпаргалок открываются здесь одной кнопкой.</p></section>' +
    '<label class="eyebrow" for="src">Код</label><textarea id="src" spellcheck="false" autocapitalize="off" autocomplete="off">' +
    esc(sandSrc) +
    '</textarea><div class="foot"><button class="btn" data-a="run" id="runbtn"' +
    (pyLoading ? ' disabled' : '') +
    '>' +
    (pyLoading ? 'Выполняю…' : 'Запустить') +
    '</button><a class="btn ghost" style="text-decoration:none;text-align:center" href="https://colab.research.google.com" target="_blank" rel="noopener">Открыть Google Colab</a></div><div class="eyebrow">Результат</div><pre class="out" id="out" aria-live="polite">' +
    esc(sandOut || 'Здесь появится вывод программы.') +
    '</pre>'
  );
}
function loadPy() {
  if (py) return Promise.resolve(py);
  return new Promise(function (res, rej) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    s.onload = res;
    s.onerror = function () {
      rej(new Error('load'));
    };
    document.head.appendChild(s);
  })
    .then(function () {
      return window.loadPyodide();
    })
    .then(function (p) {
      py = p;
      return p;
    });
}
function execPy(code, show) {
  if (pyLoading) return;
  pyLoading = true;
  show('Загружаю Python. Первый раз это до минуты…');
  var buf = [],
    out;
  var timer = setTimeout(function () {
    if (pyLoading)
      show('Python всё ещё загружается. Если это длится дольше двух минут, открой Google Colab.', true);
  }, 25000);
  loadPy()
    .then(function (p) {
      p.setStdout({
        batched: function (s) {
          buf.push(s);
        }
      });
      p.setStderr({
        batched: function (s) {
          buf.push(s);
        }
      });
      return p.loadPackagesFromImports(code).then(function () {
        return p.runPythonAsync(code);
      });
    })
    .then(
      function () {
        out = buf.join('\n') || 'Программа выполнилась, но ничего не напечатала. Добавь print().';
      },
      function (e) {
        var m = String((e && e.message) || e);
        if (!py) out = 'Не получилось загрузить Python в этом окне. Открой Google Colab и вставь код туда.';
        else {
          var ls = m.trim().split('\n');
          out = (buf.length ? buf.join('\n') + '\n\n' : '') + 'Ошибка: ' + ls[ls.length - 1];
        }
      }
    )
    .then(function () {
      clearTimeout(timer);
      pyLoading = false;
      show(out);
    });
}
function runPy() {
  var ta = $('#src');
  if (ta) sandSrc = ta.value;
  execPy(sandSrc, function (o) {
    sandOut = o;
    if (view === 'sandbox') render();
  });
}
function runHere() {
  var run = R,
    pos = R.pos,
    c = R.q[pos].c;
  execPy(c.code, function (o) {
    if (R === run && R.pos === pos) {
      R.out = o;
      render();
    }
  });
}
