/**
 * Aggregations for fitness logs: weight series and frequency by exercise / body part.
 */

import { getTodayKey, addDays, getWeekStart, getMonthStart, isInWeek, isInMonth } from '../dateUtils';

/** @typedef {{ weight?: number|null, workouts?: Array<{ id: string, exercises: Array<{ id: string, name: string, bodyPart?: string, sets?: Array<{ weight?: number, reps?: number }> }> }> }} DayEntry */

/**
 * Last N calendar days including null weight when not logged.
 * @param {Record<string, DayEntry>} logs
 * @param {number} days
 * @returns {{ dateKey: string, weight: number | null }[]}
 */
export function getWeightSeries(logs, days = 30) {
  const today = getTodayKey();
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const dateKey = addDays(today, -i);
    const raw = logs[dateKey]?.weight;
    const weight = raw != null && raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : null;
    out.push({ dateKey, weight });
  }
  return out;
}

/**
 * @param {Record<string, DayEntry>} logs
 * @param {'week'|'month'} period
 */
function filterDateKeysForPeriod(logs, period) {
  const today = getTodayKey();
  const keys = Object.keys(logs);
  if (period === 'week') {
    const ws = getWeekStart(today);
    return keys.filter((k) => isInWeek(k, ws));
  }
  const ms = getMonthStart(today);
  return keys.filter((k) => isInMonth(k, ms));
}

/**
 * Count each exercise (by name) or body part across workouts in the date range.
 * @param {Record<string, DayEntry>} logs
 * @param {'week'|'month'} period
 * @param {'exercise'|'bodyPart'} groupBy
 * @returns {{ label: string, count: number }[]}
 */
export function getFrequencyPairs(logs, period, groupBy) {
  const dateKeys = new Set(filterDateKeysForPeriod(logs, period));
  /** @type {Map<string, { label: string, count: number }>} */
  const map = new Map();

  const bump = (rawKey, displayLabel) => {
    if (!rawKey) return;
    const key = rawKey.trim().toLowerCase();
    if (!key) return;
    const prev = map.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      map.set(key, { label: displayLabel.trim() || rawKey, count: 1 });
    }
  };

  for (const dateKey of dateKeys) {
    const day = logs[dateKey];
    if (!day?.workouts?.length) continue;
    for (const w of day.workouts) {
      for (const ex of w.exercises || []) {
        if (groupBy === 'exercise') {
          const name = (ex.name || '').trim();
          if (name) bump(name, name);
        } else {
          const bp = (ex.bodyPart || '').trim();
          if (bp) bump(bp, bp);
        }
      }
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * Min/max for chart scaling (ignores null weights).
 * @param {{ dateKey: string, weight: number | null }[]} series
 */
export function getWeightRange(series) {
  const weights = series.map((p) => p.weight).filter((w) => w != null);
  if (weights.length === 0) return { min: 0, max: 1 };
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.02, 0.5);
    return { min: min - pad, max: max + pad };
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}
