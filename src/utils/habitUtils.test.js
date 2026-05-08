import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isHabitDone,
  getCurrentStreak,
  getLongestStreak,
  getRecentDayKeysEnding,
} from './habitUtils.js';

const hid = 'h1';

test('getCurrentStreak counts backward from today when done today', () => {
  const logs = {
    '2026-05-06': { [hid]: true },
    '2026-05-07': { [hid]: true },
    '2026-05-08': { [hid]: true },
  };
  assert.equal(getCurrentStreak(logs, hid, '2026-05-08'), 3);
});

test('getCurrentStreak allows today not done if yesterday done', () => {
  const logs = {
    '2026-05-06': { [hid]: true },
    '2026-05-07': { [hid]: true },
  };
  assert.equal(getCurrentStreak(logs, hid, '2026-05-08'), 2);
});

test('getCurrentStreak is zero when today and yesterday missing', () => {
  const logs = { '2026-05-05': { [hid]: true } };
  assert.equal(getCurrentStreak(logs, hid, '2026-05-08'), 0);
});

test('getLongestStreak finds max run', () => {
  const logs = {
    '2026-05-01': { [hid]: true },
    '2026-05-02': { [hid]: true },
    '2026-05-04': { [hid]: true },
    '2026-05-05': { [hid]: true },
    '2026-05-06': { [hid]: true },
  };
  assert.equal(getLongestStreak(logs, hid), 3);
});

test('getRecentDayKeysEnding order', () => {
  assert.deepEqual(getRecentDayKeysEnding('2026-05-08', 3), ['2026-05-06', '2026-05-07', '2026-05-08']);
});

test('isHabitDone', () => {
  assert.equal(isHabitDone({ '2026-05-08': { [hid]: true } }, hid, '2026-05-08'), true);
  assert.equal(isHabitDone({ '2026-05-08': {} }, hid, '2026-05-08'), false);
});
