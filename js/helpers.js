/* Pulse · helpers
 * Small DOM helper and short names for the pure functions in lib/core.js.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

var $ = function (s) {
  return document.querySelector(s);
};
/* short names for the pure helpers in lib/core.js */
function esc(s) {
  return Core.escapeHtml(s);
}
function ds(d) {
  return Core.dateKey(d);
}
function today() {
  return ds(new Date());
}
function addDays(d, n) {
  return Core.addDays(d, n);
}
function shuffle(a) {
  return Core.shuffle(a);
}
function def() {
  return Core.defaultState();
}
/* Bring any stored state to the current format. Nothing is dropped: old progress stays as it was. */
function fix(o) {
  return Core.normalizeState(o);
}
