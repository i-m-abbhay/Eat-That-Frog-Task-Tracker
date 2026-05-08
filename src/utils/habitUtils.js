/**
 * Daily habit completion logs and streak helpers.
 * habitLogs shape: { [dateKey]: { [habitId]: true } }
 */

import { addDays } from '../dateUtils.js';

export function isHabitDone(logs, habitId, dateKey) {
  const day = logs[dateKey];
  return !!(day && typeof day === 'object' && day[habitId]);
}

/**
 * Consecutive days ending at today or yesterday if today is not done yet (grace until you miss a day).
 */
export function getCurrentStreak(logs, habitId, todayKey) {
  let cursor = todayKey;
  if (!isHabitDone(logs, habitId, cursor)) {
    cursor = addDays(todayKey, -1);
    if (!isHabitDone(logs, habitId, cursor)) return 0;
  }
  let n = 0;
  while (isHabitDone(logs, habitId, cursor)) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

/** Longest run of consecutive calendar days with the habit completed (from stored logs only). */
export function getLongestStreak(logs, habitId) {
  const dates = Object.keys(logs)
    .filter((d) => isHabitDone(logs, habitId, d))
    .sort();
  if (dates.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i += 1) {
    if (addDays(dates[i - 1], 1) === dates[i]) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/** Oldest → newest, length n, ending at endingDateKey. */
export function getRecentDayKeysEnding(endingDateKey, n) {
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(addDays(endingDateKey, -i));
  }
  return keys;
}
