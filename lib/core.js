/*
 * Pulse core logic: pure functions with no DOM, network or global state.
 * Loaded in the browser before js/*.js (as window.PulseCore) and in Node for unit tests.
 */
(function (root) {
  'use strict';

  /* ---------- text and dates ---------- */

  /** Escape text for safe use inside HTML. */
  function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /** Format a Date as local YYYY-MM-DD. */
  function dateKey(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return date.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
  }

  /** Return a new Date shifted by `days` (negative goes back). */
  function addDays(date, days) {
    var copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  /** Russian plural form: plural(5, 'урок', 'урока', 'уроков') → 'уроков'. */
  function plural(n, one, few, many) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  /** A shuffled copy of an array (Fisher–Yates). `random` defaults to Math.random. */
  function shuffle(items, random) {
    var rnd = random || Math.random;
    var copy = items.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /** Compare two JSON-compatible values. */
  function sameJson(a, b) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch (e) {
      return false;
    }
  }

  /* ---------- courses ---------- */

  /** A valid course id: lowercase latin letters, digits, - and _, up to 40 characters. */
  function isCourseId(id) {
    return /^[a-z0-9][a-z0-9_-]{0,39}$/.test(String(id));
  }

  /** localStorage key of the learner state for a course. Course 'main' keeps the original key. */
  function stateKey(courseId) {
    return courseId === 'main' ? 'puls-daten-v1' : 'puls-daten-v1:' + courseId;
  }

  /** localStorage key of the cached course content. Course 'main' keeps the original key. */
  function courseKey(courseId) {
    return courseId === 'main' ? 'puls-course-v1' : 'puls-course-v1:' + courseId;
  }

  /**
   * Course look and texts. A course without `meta` gets `legacy` (the look of the first course),
   * a course with `meta` starts from `neutral` and overrides what it sets. Tag maps are merged.
   */
  function courseMeta(course, legacy, neutral) {
    var meta = course && course.meta && typeof course.meta === 'object' ? course.meta : null;
    var base = meta ? neutral : legacy;
    var result = Object.assign({}, base, meta || {});
    result.tags = Object.assign({}, base.tags, (meta && meta.tags) || {});
    result.tagIcons = Object.assign({}, base.tagIcons, (meta && meta.tagIcons) || {});
    if (!Array.isArray(result.levels) || !result.levels.length) result.levels = base.levels;
    if (!Array.isArray(result.noteCats)) result.noteCats = [];
    return result;
  }

  /** Level for an XP amount: { i, name, from, to } where `to` is null on the last level. */
  function levelFor(xp, levels) {
    var index = 0;
    for (var k = 0; k < levels.length; k++) if (xp >= levels[k][0]) index = k;
    var next = levels[index + 1];
    return { i: index, name: levels[index][1], from: levels[index][0], to: next ? next[0] : null };
  }

  /* ---------- learner state ---------- */

  /** Object-valued fields of the learner state (always present, never arrays). */
  var MAP_FIELDS = ['done', 'days', 'frozen', 'missed', 'missions', 'seen', 'prac', 'nt', 'cx'];
  /** Numeric fields of the learner state. */
  var NUMBER_FIELDS = ['xp', 'freezes', 'best', 'perfect', 'reviews', 'newN', 't'];

  /** A fresh, empty learner state. `t` is the time of the last local save (ms). */
  function defaultState() {
    return {
      name: '',
      xp: 0,
      done: {},
      days: {},
      frozen: {},
      freezes: 0,
      missed: {},
      missions: {},
      seen: {},
      prac: {},
      nt: {},
      cx: {},
      newDay: '',
      newN: 0,
      best: 0,
      perfect: 0,
      reviews: 0,
      t: 0
    };
  }

  /** Deep-copy any stored value into a well-formed learner state. Nothing is dropped. */
  function normalizeState(value) {
    var source = value && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : {};
    var state = Object.assign(defaultState(), source);
    MAP_FIELDS.forEach(function (key) {
      if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
    });
    NUMBER_FIELDS.forEach(function (key) {
      state[key] = +state[key] || 0;
    });
    return state;
  }

  /**
   * Merge two copies of one learner's progress, e.g. this device and the cloud.
   * No device can erase what was done on another: lessons, missions, seen tasks and frozen days are united,
   * days, practice and opened cards keep the larger value, XP and records never go down.
   * Settings come from the newer copy. A deliberate reset or import (`wipe`) wins over older copies.
   */
  function mergeStates(first, second) {
    var a = normalizeState(first);
    var b = normalizeState(second);
    var newer = (a.t || 0) >= (b.t || 0) ? a : b;
    var older = newer === a ? b : a;
    if ((newer.wipe || 0) > (older.t || 0)) return newer;

    var result = normalizeState(newer);
    function unite(key) {
      Object.keys(older[key]).forEach(function (id) {
        if (!(id in result[key])) result[key][id] = older[key][id];
      });
    }
    function keepMax(key) {
      Object.keys(older[key]).forEach(function (id) {
        var value = +older[key][id] || 0;
        if (!(id in result[key]) || value > (+result[key][id] || 0)) result[key][id] = older[key][id];
      });
    }
    ['done', 'frozen', 'seen', 'missions'].forEach(unite);
    ['days', 'prac', 'nt', 'cx'].forEach(keepMax);
    // A mistake is removed from `missed` once it is reviewed; only bring old ones back
    // if the newer copy is clearly behind or has none at all.
    if (
      Object.keys(result.done).length < Object.keys(older.done).length ||
      !Object.keys(result.missed).length
    ) {
      unite('missed');
    }
    ['xp', 'best', 'perfect', 'reviews'].forEach(function (key) {
      result[key] = Math.max(+newer[key] || 0, +older[key] || 0);
    });
    ['tour', 'tourDone', 'name', 'track', 'avatar'].forEach(function (key) {
      if (!result[key] && older[key]) result[key] = older[key];
    });
    if (older.wipe && !(result.wipe >= older.wipe)) result.wipe = older.wipe;
    return result;
  }

  /* ---------- streak ---------- */

  /** A day counts for the streak if the learner studied or a freeze covered it. */
  function isActiveDay(key, state) {
    return state.days[key] !== undefined || !!(state.frozen && state.frozen[key]);
  }

  /**
   * Days in a row with study up to `now` (today may still be open: then the streak counts up to yesterday).
   * Frozen days keep the streak alive but are not counted.
   */
  function streakOf(state, now) {
    var day = new Date(now || Date.now());
    if (!isActiveDay(dateKey(day), state)) {
      day = addDays(day, -1);
      if (!isActiveDay(dateKey(day), state)) return 0;
    }
    var count = 0;
    while (isActiveDay(dateKey(day), state)) {
      if (state.days[dateKey(day)] !== undefined) count++;
      day = addDays(day, -1);
    }
    return count;
  }

  var api = {
    escapeHtml: escapeHtml,
    dateKey: dateKey,
    addDays: addDays,
    plural: plural,
    shuffle: shuffle,
    sameJson: sameJson,
    isCourseId: isCourseId,
    stateKey: stateKey,
    courseKey: courseKey,
    courseMeta: courseMeta,
    levelFor: levelFor,
    defaultState: defaultState,
    normalizeState: normalizeState,
    mergeStates: mergeStates,
    isActiveDay: isActiveDay,
    streakOf: streakOf
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PulseCore = api;
})(typeof self !== 'undefined' ? self : this);
