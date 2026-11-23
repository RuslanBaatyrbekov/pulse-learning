'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const course = require('../examples/course.example.json');

const TASK_TYPES = ['mc', 'fill', 'order', 'match'];

test('example course has the shape the app expects', () => {
  assert.ok(Array.isArray(course.weeks) && course.weeks.length, 'weeks');
  if (course.meta !== undefined) assert.equal(typeof course.meta, 'object', 'meta must be an object');
  const ids = new Set();
  for (const week of course.weeks) {
    assert.ok(Array.isArray(week.days), 'days of ' + week.id);
    for (const day of week.days) {
      assert.ok(day.id && day.title && Array.isArray(day.cards), 'lesson ' + day.id);
      assert.ok(!ids.has(day.id), 'unique lesson id ' + day.id);
      ids.add(day.id);
    }
  }
});

test('every task in the example course can be answered', () => {
  for (const day of course.weeks.flatMap(week => week.days)) {
    for (const task of day.tasks || []) {
      const where = day.id + ': ' + task.q;
      assert.ok(TASK_TYPES.includes(task.t), 'task type in ' + where);
      if (task.t === 'mc') assert.ok(task.a >= 0 && task.a < task.o.length, 'answer index in ' + where);
      if (task.t === 'fill') {
        assert.equal(task.code.split('___').length, 2, 'one blank in ' + where);
        assert.ok(Array.isArray(task.a) && task.a.length, 'answers in ' + where);
      }
      if (task.t === 'order')
        assert.equal(new Set(task.lines).size, task.lines.length, 'unique lines in ' + where);
      if (task.t === 'match')
        assert.ok(
          task.pairs.every(pair => pair.length === 2),
          'pairs in ' + where
        );
    }
  }
});
