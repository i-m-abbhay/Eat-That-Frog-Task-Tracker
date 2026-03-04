/**
 * Date helpers for schedule views. All dates in local time, stored as YYYY-MM-DD.
 */

export function toDateKey(d) {
  const date = typeof d === 'string' ? new Date(d + 'T12:00:00') : d;
  return date.toISOString().slice(0, 10);
}

export function getTodayKey() {
  return toDateKey(new Date());
}

export function getWeekStart(d) {
  const date = typeof d === 'string' ? new Date(d + 'T12:00:00') : new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday = 1
  const monday = new Date(date);
  monday.setDate(diff);
  return toDateKey(monday);
}

export function getWeekEnd(d) {
  const start = getWeekStart(d);
  const end = new Date(start + 'T12:00:00');
  end.setDate(end.getDate() + 6);
  return toDateKey(end);
}

export function getMonthStart(d) {
  const date = typeof d === 'string' ? new Date(d + 'T12:00:00') : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function getMonthEnd(d) {
  const date = typeof d === 'string' ? new Date(d + 'T12:00:00') : new Date(d);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return toDateKey(last);
}

export function isSameDay(key1, key2) {
  return key1 === key2;
}

export function isInWeek(dateKey, weekStartKey) {
  const start = new Date(weekStartKey + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const d = new Date(dateKey + 'T12:00:00');
  return d >= start && d <= end;
}

export function isInMonth(dateKey, monthStartKey) {
  const start = new Date(monthStartKey + 'T12:00:00');
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const d = new Date(dateKey + 'T12:00:00');
  return d >= start && d <= end;
}

export function addDays(dateKey, n) {
  const d = new Date(dateKey + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

export function addWeeks(dateKey, n) {
  return addDays(dateKey, n * 7);
}

export function addMonths(dateKey, n) {
  const d = new Date(dateKey + 'T12:00:00');
  d.setMonth(d.getMonth() + n);
  return toDateKey(d);
}

export function formatDay(dateKey) {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatWeekRange(weekStartKey) {
  const start = new Date(weekStartKey + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    short: `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
    long: `${start.toLocaleDateString(undefined, { month: 'long' })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`,
  };
}

export function formatMonth(dateKey) {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function getDaysInWeek(weekStartKey) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartKey, i));
}

export function getWeekNumbersInMonth(monthStartKey) {
  const first = new Date(monthStartKey + 'T12:00:00');
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const weeks = [];
  let current = getWeekStart(monthStartKey);
  const lastKey = toDateKey(last);
  while (current <= lastKey) {
    const weekEnd = addDays(current, 6);
    if (new Date(current + 'T12:00:00') <= last && new Date(weekEnd + 'T12:00:00') >= first) {
      weeks.push(current);
    }
    current = addWeeks(current, 1);
  }
  return weeks;
}

/** Cutoff date (YYYY-MM-DD) for "clear data before" presets. Tasks created on or after this date are kept. */
export function getCutoffForPreset(preset) {
  const today = getTodayKey();
  switch (preset) {
    case 'lastMonth':
      return getMonthStart(today); // first day of current month = keep only this month
    case 'last6Months':
      return addMonths(today, -6);
    case 'lastYear':
      return addMonths(today, -12);
    default:
      return today;
  }
}

export function formatCutoffLabel(preset) {
  const key = getCutoffForPreset(preset);
  const d = new Date(key + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Next occurrence date (YYYY-MM-DD) for recurrence: daily = +1 day, weekly = +7, monthly = +1 month. */
export function getNextRecurrenceDate(recurrence, fromDateKey) {
  if (!recurrence || recurrence === 'none') return null;
  const from = fromDateKey || getTodayKey();
  switch (recurrence) {
    case 'daily':
      return addDays(from, 1);
    case 'weekly':
      return addDays(from, 7);
    case 'monthly':
      return addMonths(from, 1);
    default:
      return null;
  }
}
