/* Pulse · progress
 * Streak, freezes, levels and lesson order.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

function active(k, st) {
  return Core.isActiveDay(k, st || S);
}
function streak(st) {
  return Core.streakOf(st || S, Date.now());
}
function applyFreezes() {
  var keys = Object.keys(S.days).concat(Object.keys(S.frozen)).sort();
  if (!keys.length || !S.freezes) return;
  var last = keys[keys.length - 1],
    gap = [],
    d = addDays(new Date(), -1);
  while (ds(d) > last && gap.length < 6) {
    gap.push(ds(d));
    d = addDays(d, -1);
  }
  if (gap.length && gap.length <= S.freezes) {
    gap.forEach(function (k) {
      S.frozen[k] = 1;
    });
    S.freezes -= gap.length;
    save();
  }
}
function level(st) {
  return Core.levelFor((st || S).xp, LEVELS);
}
function lvPct(st) {
  var lv = level(st);
  st = st || S;
  return lv.to ? Math.round(((st.xp - lv.from) / (lv.to - lv.from)) * 100) : 100;
}
function listFor(st) {
  return !st || st === S ? ALL : daysFor(st);
}
function nextIdx(st) {
  var list = listFor(st);
  st = st || S;
  for (var i = 0; i < list.length; i++) if (!st.done[list[i].id]) return i;
  return -1;
}
function nextLesson(st) {
  var i = nextIdx(st);
  return i < 0 ? null : listFor(st)[i];
}
function needTrack(st) {
  st = st || S;
  return hasTracks() && !st.track && listFor(st).length > 0 && nextIdx(st) < 0;
}
function newToday() {
  return S.newDay === today() ? S.newN : 0;
}
function doneCount(st) {
  st = st || S;
  var n = 0;
  Object.keys(st.done || {}).forEach(function (id) {
    if (LBY[id]) n++;
  });
  return n;
}
function plural(n, a, b, c) {
  return Core.plural(n, a, b, c);
}
