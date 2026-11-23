/* Pulse · routing
 * Views and URL hash, toasts.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

/* ---------- routing ---------- */
var VIEWS = ['path', 'practice', 'notes', 'glossary', 'sandbox', 'progress', 'watch'],
  view = 'path',
  R = null,
  T = null,
  RES = null,
  toastT = null,
  BACK = 'path';
function fromHash() {
  var h = (location.hash || '').slice(1);
  return VIEWS.indexOf(h) >= 0 ? h : 'path';
}
window.addEventListener('hashchange', function () {
  if (view === 'run' || view === 'result' || view === 'note') return;
  view = fromHash();
  render();
});
function toast(m) {
  var o = $('.toast');
  if (o) o.remove();
  var t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = m;
  document.body.appendChild(t);
  clearTimeout(toastT);
  toastT = setTimeout(function () {
    t.remove();
  }, 3600);
}
