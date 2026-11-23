'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../lib/core.js');

const richCloud = {
  name: 'Adina',
  avatar: '🌸',
  xp: 500,
  t: 100,
  tour: 1,
  tourDone: 1,
  done: { l01: { d: '2026-11-18', p: 1 }, l02: { d: '2026-11-19', p: 0 } },
  days: { '2026-11-18': 120, '2026-11-19': 110 },
  prac: { py: 4 },
  missions: { b1: 1 },
  missed: { 'l02:3': 1 }
};

test.describe('mergeStates', () => {
  test('a fresh device never wipes progress stored in the cloud', () => {
    // A new browser closed the tour (newer timestamp) before the cloud copy arrived.
    const freshDevice = { tour: 1, t: 200 };
    const merged = core.mergeStates(freshDevice, richCloud);
    assert.equal(merged.xp, 500);
    assert.deepEqual(Object.keys(merged.done).sort(), ['l01', 'l02']);
    assert.equal(merged.days['2026-11-19'], 110);
    assert.equal(merged.prac.py, 4);
    assert.equal(merged.missions.b1, 1);
    assert.equal(merged.name, 'Adina');
    assert.equal(merged.avatar, '🌸');
    assert.equal(merged.tourDone, 1);
  });

  test('progress from two devices is united, not replaced', () => {
    const laptop = {
      xp: 380,
      t: 300,
      done: { l01: {}, l03: {} },
      days: { '2026-11-19': 40, '2026-11-20': 90 }
    };
    const merged = core.mergeStates(laptop, richCloud);
    assert.equal(merged.xp, 500, 'XP never goes down');
    assert.deepEqual(Object.keys(merged.done).sort(), ['l01', 'l02', 'l03']);
    assert.equal(merged.days['2026-11-19'], 110, 'keeps the larger XP of the same day');
    assert.equal(merged.days['2026-11-20'], 90);
  });

  test('the result does not depend on argument order', () => {
    const phone = { xp: 520, t: 300, done: { l03: {} }, days: { '2026-11-20': 30 } };
    assert.deepEqual(core.mergeStates(phone, richCloud), core.mergeStates(richCloud, phone));
  });

  test('settings come from the newer copy', () => {
    const newer = { name: 'Adina T', t: 300 };
    assert.equal(core.mergeStates(newer, richCloud).name, 'Adina T');
  });

  test('a deliberate reset wins over older copies', () => {
    const reset = { xp: 0, t: 300, wipe: 250 };
    const merged = core.mergeStates(reset, richCloud);
    assert.equal(merged.xp, 0);
    assert.deepEqual(merged.done, {});
  });

  test('a copy saved after the reset is merged normally', () => {
    const reset = { xp: 30, t: 300, wipe: 250, done: { l01: {} } };
    const later = { xp: 60, t: 400, done: { l01: {}, l02: {} } };
    const merged = core.mergeStates(later, reset);
    assert.equal(merged.xp, 60);
    assert.equal(merged.wipe, 250, 'the reset mark is kept');
  });

  test('reviewed mistakes are not brought back by an older copy', () => {
    const newer = { t: 300, done: { l01: {}, l02: {} }, missed: { 'l01:1': 1 } };
    const merged = core.mergeStates(newer, richCloud);
    assert.deepEqual(merged.missed, { 'l01:1': 1 });
  });
});

test.describe('normalizeState', () => {
  test('fills missing fields and fixes broken types', () => {
    const state = core.normalizeState({ xp: '12', done: [], days: null });
    assert.equal(state.xp, 12);
    assert.deepEqual(state.done, {});
    assert.deepEqual(state.days, {});
    assert.deepEqual(state.missions, {});
  });

  test('keeps unknown fields and does not share objects with the input', () => {
    const input = { done: { l01: {} }, custom: 1 };
    const state = core.normalizeState(input);
    assert.equal(state.custom, 1);
    state.done.l02 = {};
    assert.deepEqual(Object.keys(input.done), ['l01']);
  });

  test('accepts garbage', () => {
    assert.deepEqual(core.normalizeState(null), core.defaultState());
    assert.deepEqual(core.normalizeState('x'), core.defaultState());
  });
});

test.describe('streakOf', () => {
  const now = new Date(2026, 10, 23, 12);
  const key = offset => core.dateKey(core.addDays(now, offset));

  test('counts days in a row including today', () => {
    const state = core.normalizeState({
      days: { [key(0)]: 30, [key(-1)]: 30, [key(-2)]: 30, [key(-4)]: 30 }
    });
    assert.equal(core.streakOf(state, now), 3);
  });

  test('today still open: the streak counts up to yesterday', () => {
    const state = core.normalizeState({ days: { [key(-1)]: 30, [key(-2)]: 30 } });
    assert.equal(core.streakOf(state, now), 2);
  });

  test('a frozen day keeps the streak but is not counted', () => {
    const state = core.normalizeState({ days: { [key(0)]: 30, [key(-2)]: 30 }, frozen: { [key(-1)]: 1 } });
    assert.equal(core.streakOf(state, now), 2);
  });

  test('two days missed: no streak', () => {
    const state = core.normalizeState({ days: { [key(-2)]: 30 } });
    assert.equal(core.streakOf(state, now), 0);
  });
});

test.describe('courses', () => {
  const legacy = {
    brand: 'Пульс данных',
    tags: { py: 'Python', boss: 'Контрольная' },
    tagIcons: {},
    levels: [[0, 'A']]
  };
  const neutral = { brand: 'Pulse', tags: { boss: 'Контрольная' }, tagIcons: {}, levels: [[0, 'B']] };

  test('a course without meta keeps the original look', () => {
    assert.equal(core.courseMeta({ weeks: [] }, legacy, neutral).brand, 'Пульс данных');
  });

  test('meta overrides neutral defaults and merges tags', () => {
    const meta = core.courseMeta(
      { meta: { brand: 'Symfony-Puls', tags: { orm: 'Doctrine' } } },
      legacy,
      neutral
    );
    assert.equal(meta.brand, 'Symfony-Puls');
    assert.deepEqual(meta.tags, { boss: 'Контрольная', orm: 'Doctrine' });
    assert.deepEqual(meta.levels, [[0, 'B']], 'empty levels fall back to defaults');
  });

  test('course main keeps the original storage keys', () => {
    assert.equal(core.stateKey('main'), 'puls-daten-v1');
    assert.equal(core.courseKey('main'), 'puls-course-v1');
    assert.equal(core.stateKey('symfony'), 'puls-daten-v1:symfony');
  });

  test('course ids', () => {
    assert.ok(core.isCourseId('symfony'));
    assert.ok(core.isCourseId('laravel-pro_2'));
    assert.ok(!core.isCourseId('Symfony'));
    assert.ok(!core.isCourseId('-x'));
    assert.ok(!core.isCourseId('a'.repeat(41)));
  });

  test('levelFor', () => {
    const levels = [
      [0, 'A'],
      [100, 'B'],
      [300, 'C']
    ];
    assert.deepEqual(core.levelFor(150, levels), { i: 1, name: 'B', from: 100, to: 300 });
    assert.equal(core.levelFor(999, levels).to, null);
  });
});

test.describe('text', () => {
  test('escapeHtml', () => {
    assert.equal(core.escapeHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });

  test('Russian plural', () => {
    const p = n => core.plural(n, 'урок', 'урока', 'уроков');
    assert.deepEqual([1, 2, 5, 11, 12, 21, 22, 25, 111].map(p), [
      'урок',
      'урока',
      'уроков',
      'уроков',
      'уроков',
      'урок',
      'урока',
      'уроков',
      'уроков'
    ]);
  });

  test('shuffle keeps all items and does not touch the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = core.shuffle(input);
    assert.deepEqual([...out].sort(), input);
    assert.deepEqual(input, [1, 2, 3, 4, 5]);
  });
});
