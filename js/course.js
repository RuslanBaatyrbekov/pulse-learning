/* Pulse · course
 * Course structure: storage keys, weeks and tracks, lesson index.
 * Classic script: shares the global scope with the other files in js/ (load order is set in index.html). */
'use strict';

var C = { weeks: [], roadmap: [] },
  WK = [],
  ALL = [],
  LBY = {},
  TOTAL = 0,
  KEY = 'puls-daten-v1',
  CKEY = 'puls-course-v1',
  TKEY = 'puls-theme',
  courseErr = '';
/* Several courses. Course 'main' keeps the original storage keys, so existing progress and cache are picked up unchanged. */
var CUR = 'main',
  CAT = [],
  OLDDB = false,
  CURKEY = 'puls-cur',
  CATKEY = 'puls-catalog';
var Core = window.PulseCore;
function kS(id) {
  return Core.stateKey(id);
}
function kC(id) {
  return Core.courseKey(id);
}
function setKeys() {
  KEY = kS(CUR);
  CKEY = kC(CUR);
}
try {
  CUR = localStorage.getItem(CURKEY) || 'main';
  CAT = JSON.parse(localStorage.getItem(CATKEY) || '[]') || [];
} catch (e) {}
if (!Core.isCourseId(CUR)) CUR = 'main';
setKeys();
/* A week with a `track` field is part of the course only if the learner chose that track. Until then the course ends before the first track week. */
function weeksFor(st) {
  st = st || {};
  var out = [],
    stop = false;
  (C.weeks || []).forEach(function (w) {
    if (stop) return;
    if (w.track) {
      if (st.track === w.track) out.push(w);
      else if (!st.track) stop = true;
    } else out.push(w);
  });
  return out;
}
function daysFor(st) {
  var a = [];
  weeksFor(st).forEach(function (w) {
    a = a.concat(w.days);
  });
  return a;
}
function rebuild() {
  WK = weeksFor(S);
  ALL = [];
  WK.forEach(function (w, wi) {
    w.days.forEach(function (d) {
      d.week = wi;
      d.idx = ALL.length;
      ALL.push(d);
    });
  });
}
function setCourse(c) {
  if (!c || !c.weeks) return false;
  C = c;
  applyMeta(c);
  LBY = {};
  TOTAL = 0;
  var tr = null;
  C.weeks.forEach(function (w) {
    if (w.track && !tr) tr = w.track;
    if (!w.track || w.track === tr) TOTAL += w.days.length;
    w.days.forEach(function (d) {
      LBY[d.id] = d;
      (d.tasks || []).forEach(function (t, i) {
        t._k = d.id + ':' + i;
        t._tag = d.tag;
      });
    });
  });
  rebuild();
  return true;
}
function hasTracks() {
  return (C.weeks || []).some(function (w) {
    return !!w.track;
  });
}
function trackList() {
  var o = [];
  (C.weeks || []).forEach(function (w) {
    if (w.track && o.indexOf(w.track) < 0) o.push(w.track);
  });
  return o;
}
function trackName(t) {
  var m = C.tracks || {},
    d = M.tracks || {};
  return (m[t] && m[t].name) || (d[t] && d[t].name) || t;
}
