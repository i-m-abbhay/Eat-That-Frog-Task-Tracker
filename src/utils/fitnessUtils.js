/**
 * Aggregations for fitness logs: weight series and frequency by exercise / body part.
 * Weight values are stored in the unit recorded at save time (`weightUnit` on each day);
 * charts convert to the current display unit.
 */

import { getTodayKey, addDays, getWeekStart, getMonthStart, isInWeek, isInMonth } from '../dateUtils.js';

/** 1 lb in kg (international avoirdupois pound) */
export const LB_IN_KG = 0.45359237;

/**
 * @param {number|null|undefined} weight
 * @param {'kg'|'lb'} unit
 * @returns {number|null}
 */
export function weightToKg(weight, unit) {
  if (weight == null || weight === '' || Number.isNaN(Number(weight))) return null;
  const w = Number(weight);
  return unit === 'lb' ? w * LB_IN_KG : w;
}

/**
 * @param {number|null} kg
 * @param {'kg'|'lb'} displayUnit
 * @returns {number|null}
 */
export function kgToDisplay(kg, displayUnit) {
  if (kg == null || Number.isNaN(kg)) return null;
  return displayUnit === 'lb' ? kg / LB_IN_KG : kg;
}

/**
 * Convert a stored weight to the current display unit using the unit it was logged in.
 * @param {number|null|undefined} raw
 * @param {'kg'|'lb'|null|undefined} storedUnit
 * @param {'kg'|'lb'} displayUnit
 * @param {'kg'|'lb'} [legacyDefault] when `storedUnit` is missing (old data)
 */
export function displayWeight(raw, storedUnit, displayUnit, legacyDefault = 'kg') {
  const u = storedUnit === 'lb' || storedUnit === 'kg' ? storedUnit : legacyDefault;
  const kg = weightToKg(raw, u);
  return kgToDisplay(kg, displayUnit);
}

/** @typedef {{ weight?: number|null, weightUnit?: 'kg'|'lb'|null, workouts?: Array<{ id: string, exercises: Array<{ id: string, name: string, bodyPart?: string, sets?: Array<{ weight?: number, reps?: number }> }> }> }} DayEntry */

/**
 * Last N calendar days including null weight when not logged.
 * @param {Record<string, DayEntry>} logs
 * @param {number} days
 * @param {'kg'|'lb'} displayUnit
 * @param {'kg'|'lb'} legacyDefaultUnit unit assumed for entries without `weightUnit`
 * @returns {{ dateKey: string, weight: number | null }[]}
 */
export function getWeightSeries(logs, days = 30, displayUnit = 'kg', legacyDefaultUnit = 'kg') {
  const today = getTodayKey();
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const dateKey = addDays(today, -i);
    const raw = logs[dateKey]?.weight;
    const stored = logs[dateKey]?.weightUnit;
    if (raw == null || raw === '' || Number.isNaN(Number(raw))) {
      out.push({ dateKey, weight: null });
    } else {
      const w = displayWeight(Number(raw), stored, displayUnit, legacyDefaultUnit);
      out.push({ dateKey, weight: w });
    }
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
 * Distinct exercise names across all logs, most frequent first (for datalist suggestions).
 * @param {Record<string, DayEntry>} logs
 * @param {number} [limit]
 * @returns {string[]}
 */
export function getRecentExerciseNames(logs, limit = 40) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const day of Object.values(logs)) {
    for (const w of day?.workouts || []) {
      for (const ex of w.exercises || []) {
        const name = (ex.name || '').trim();
        if (name) counts.set(name, (counts.get(name) || 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name]) => name);
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
