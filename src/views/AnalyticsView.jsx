import { useState } from 'react';
import { CheckCircle2, TrendingUp, Flame, Clock, Droplets, Activity, X } from 'lucide-react';
import { getPriorityLabel, getStatusLabel, formatDuration } from '../utils/taskUtils';
import { getTodayKey, addDays } from '../dateUtils';

function getLastNDays(n) {
  const today = getTodayKey();
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(today, -i));
  }
  return days;
}

function formatDayLabel(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
}

function formatShortDay(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  if (dateKey === getTodayKey()) return 'Today';
  return d.toLocaleDateString([], { weekday: 'short' });
}

// ─── Heatmap helpers ──────────────────────────────────────────────────────────

function isoToLocalDateKey(isoStr) {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildHeatmapWeeks(numWeeks) {
  const today = new Date();
  const todayKey = getTodayKey();
  const dow = today.getDay(); // 0 = Sunday
  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() - dow - (numWeeks - 1) * 7);

  const weeks = [];
  for (let w = 0; w < numWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      week.push(key > todayKey ? null : key);
    }
    weeks.push(week);
  }
  return weeks;
}

function getMonthLabel(week, wi) {
  for (const key of week) {
    if (key && key.slice(8) === '01') {
      return new Date(key + 'T12:00:00').toLocaleDateString([], { month: 'short' });
    }
  }
  if (wi === 0) {
    const first = week.find((k) => k);
    if (first) return new Date(first + 'T12:00:00').toLocaleDateString([], { month: 'short' });
  }
  return '';
}

const CELL = 13;
const GAP  = 3;
const STEP = CELL + GAP;
const DAY_LABEL_W = 26;

function cellBg(count) {
  if (!count) return '#334155';
  if (count === 1) return '#431407';
  if (count <= 3) return '#9a3412';
  if (count <= 5) return '#ea580c';
  if (count <= 8) return '#f97316';
  return '#fdba74';
}

export default function AnalyticsView({ tasks, stats, priorities, statuses, waterLogs = {}, waterSettings = { dailyGoalGlasses: 8, reminderIntervalMinutes: 60, reminderEnabled: false } }) {
  const getTaskTimeMs = (t) => {
    const base = t.totalTimeMs ?? 0;
    if (!t.timerStartedAt) return base;
    return base + (Date.now() - new Date(t.timerStartedAt).getTime());
  };
  const totalTimeMs = tasks.reduce((sum, t) => sum + getTaskTimeMs(t), 0);
  const timeByPriority = priorities.map((p) => ({
    priority: p,
    ms: tasks.filter((t) => t.priority === p).reduce((s, t) => s + getTaskTimeMs(t), 0),
  }));
  const maxTimeByPriority = Math.max(1, ...timeByPriority.map((x) => x.ms));
  const topTasksByTime = [...tasks]
    .map((t) => ({ ...t, _timeMs: getTaskTimeMs(t) }))
    .filter((t) => t._timeMs > 0)
    .sort((a, b) => b._timeMs - a._timeMs)
    .slice(0, 5);

  // ─── Heatmap data ─────────────────────────────────────────────────────────────
  const todayKey = getTodayKey();
  const heatmapWeeks = buildHeatmapWeeks(26);

  const completionsByDay = {};
  const frogsByDay = {};
  const tasksByDay = {};
  tasks.forEach((t) => {
    if (t.status === 'done' && t.completedAt) {
      const key = isoToLocalDateKey(t.completedAt);
      completionsByDay[key] = (completionsByDay[key] || 0) + 1;
      if (t.isFrog) frogsByDay[key] = (frogsByDay[key] || 0) + 1;
      if (!tasksByDay[key]) tasksByDay[key] = [];
      tasksByDay[key].push(t);
    }
  });

  const heatmapAllKeys = heatmapWeeks.flat().filter(Boolean);
  const activeDays     = heatmapAllKeys.filter((k) => completionsByDay[k]).length;
  const bestDayCount   = Math.max(0, ...heatmapAllKeys.map((k) => completionsByDay[k] || 0));
  const periodTotal    = heatmapAllKeys.reduce((s, k) => s + (completionsByDay[k] || 0), 0);

  let currentStreak = 0;
  let streakCheck = todayKey;
  while (completionsByDay[streakCheck]) {
    currentStreak++;
    streakCheck = addDays(streakCheck, -1);
  }

  const [selectedDay, setSelectedDay] = useState(null);

  // ─── Summary card values (real-time from task data) ──────────────────────────
  const completedToday    = completionsByDay[todayKey] || 0;
  const completedThisWeek = getLastNDays(7).reduce((s, d) => s + (completionsByDay[d] || 0), 0);
  const frogsEaten        = tasks.filter((t) => t.status === 'done' && t.isFrog).length;

  // ─── Hydration analytics ─────────────────────────────────────────────────────
  const last7Days = getLastNDays(7);
  const goal = waterSettings.dailyGoalGlasses;

  const dailyTotals = last7Days.map((day) => {
    const entries = waterLogs[day] || [];
    return { day, count: entries.reduce((s, e) => s + e.amount, 0) };
  });

  const todayCount = (waterLogs[todayKey] || []).reduce((s, e) => s + e.amount, 0);
  const todayProgress = Math.min(1, todayCount / goal);

  const streakDays = [...getLastNDays(30)].reverse();
  let streak = 0;
  for (const day of streakDays) {
    const count = (waterLogs[day] || []).reduce((s, e) => s + e.amount, 0);
    if (count >= goal) streak++;
    else break;
  }

  const daysWithData = last7Days.filter((d) => (waterLogs[d] || []).length > 0);
  const weeklyAvg = daysWithData.length > 0
    ? (daysWithData.reduce((s, d) => s + (waterLogs[d] || []).reduce((ss, e) => ss + e.amount, 0), 0) / daysWithData.length).toFixed(1)
    : 0;

  const maxBarCount = Math.max(goal, ...dailyTotals.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{completedToday}</div>
          <div className="text-gray-400">Completed Today</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{completedThisWeek}</div>
          <div className="text-gray-400">Last 7 Days</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-orange-400" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{frogsEaten}</div>
          <div className="text-gray-400">Frogs Eaten</div>
        </div>
      </div>

      {/* ─── Productivity Heatmap ──────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-7 h-7 text-orange-400" />
              Productivity Heatmap
            </h3>
            <p className="text-gray-400 text-sm mt-1">Task completions over the last 6 months</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{periodTotal}</div>
              <div className="text-gray-500 text-xs">tasks done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{activeDays}</div>
              <div className="text-gray-500 text-xs">active days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{bestDayCount}</div>
              <div className="text-gray-500 text-xs">best day</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${currentStreak > 0 ? 'text-orange-400' : 'text-white'}`}>
                {currentStreak}{currentStreak > 0 ? '🔥' : ''}
              </div>
              <div className="text-gray-500 text-xs">day streak</div>
            </div>
          </div>
        </div>

        {/* Scrollable grid */}
        <div className="overflow-x-auto pb-1">
          <div style={{ minWidth: DAY_LABEL_W + 26 * STEP - GAP + 2 }}>

            {/* Month labels */}
            <div className="relative" style={{ height: 16, marginLeft: DAY_LABEL_W, marginBottom: 4 }}>
              {heatmapWeeks.map((week, wi) => {
                const label = getMonthLabel(week, wi);
                if (!label) return null;
                return (
                  <span
                    key={wi}
                    className="absolute text-xs text-gray-500 whitespace-nowrap"
                    style={{ left: wi * STEP }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>

            {/* Day labels + week columns */}
            <div style={{ display: 'flex', gap: GAP }}>
              {/* Day labels (Mon / Wed / Fri) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, width: DAY_LABEL_W, flexShrink: 0 }}>
                {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                  <div
                    key={i}
                    style={{ height: CELL, fontSize: 9, lineHeight: `${CELL}px` }}
                    className="text-gray-600 text-right pr-1"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                  {week.map((dateKey, di) => {
                    const count  = dateKey ? (completionsByDay[dateKey] || 0) : 0;
                    const frogs  = dateKey ? (frogsByDay[dateKey]      || 0) : 0;
                    const isToday = dateKey === todayKey;
                    return (
                      <div
                        key={di}
                        title={
                          dateKey
                            ? `${formatDayLabel(dateKey)}: ${count} task${count !== 1 ? 's' : ''} done${frogs ? ` · ${frogs} frog${frogs > 1 ? 's' : ''} 🐸` : ''}`
                            : ''
                        }
                        onClick={() => count > 0 && setSelectedDay(dateKey)}
                        style={{
                          width:  CELL,
                          height: CELL,
                          borderRadius: 3,
                          backgroundColor: dateKey ? cellBg(count) : 'transparent',
                          outline: isToday ? '2px solid #f97316' : frogs > 0 ? '1.5px solid #fb923c' : 'none',
                          outlineOffset: isToday ? '-2px' : '-1px',
                          cursor: count > 0 ? 'pointer' : 'default',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span>Less</span>
          {[0, 1, 2, 4, 6, 9].map((count) => (
            <div
              key={count}
              style={{ width: CELL, height: CELL, borderRadius: 3, backgroundColor: cellBg(count) }}
            />
          ))}
          <span>More</span>
          <span className="ml-4 flex items-center gap-1">
            <div style={{ width: CELL, height: CELL, borderRadius: 3, backgroundColor: cellBg(1), outline: '1.5px solid #fb923c', outlineOffset: '-1px' }} />
            Frog completed
          </span>
          <span className="flex items-center gap-1">
            <div style={{ width: CELL, height: CELL, borderRadius: 3, backgroundColor: cellBg(0), outline: '2px solid #f97316', outlineOffset: '-2px' }} />
            Today
          </span>
        </div>
      </div>

      {/* ─── Day detail popup ──────────────────────────────────────────────────── */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                <div className="text-lg font-bold text-white">{formatDayLabel(selectedDay)}</div>
                <div className="text-sm text-gray-400">
                  {(tasksByDay[selectedDay] || []).length} task{(tasksByDay[selectedDay] || []).length !== 1 ? 's' : ''} completed
                  {(frogsByDay[selectedDay] || 0) > 0 && (
                    <span className="ml-2 text-orange-400">· {frogsByDay[selectedDay]} frog{frogsByDay[selectedDay] > 1 ? 's' : ''} 🐸</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task list */}
            <div className="overflow-y-auto flex-1 px-6 py-3 space-y-2">
              {(tasksByDay[selectedDay] || [])
                .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
                .map((t) => {
                  const timeMs = t.totalTimeMs || 0;
                  const priorityColors = {
                    A: 'bg-red-500/20 text-red-400 border-red-500/30',
                    B: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                    C: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                    D: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    E: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                  };
                  return (
                    <div key={t.id} className="flex items-start gap-3 bg-slate-700/50 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {t.isFrog && <span className="text-base leading-none">🐸</span>}
                          <span className="text-white text-sm font-medium truncate">{t.text}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[t.priority] ?? priorityColors.E}`}>
                            {t.priority} · {getPriorityLabel(t.priority)}
                          </span>
                          {timeMs > 0 && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{formatDuration(timeMs)}
                            </span>
                          )}
                          <span className="text-xs text-gray-600">
                            {new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-8">
        <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <Clock className="w-7 h-7 text-amber-400" />
          Time Tracked
        </h3>
        <div className="mb-6">
          <div className="text-3xl font-bold text-white mb-1">{formatDuration(totalTimeMs)}</div>
          <div className="text-gray-400">Total time tracked across all tasks</div>
        </div>
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">Time by priority</h4>
          {timeByPriority.map(({ priority, ms }) => (
            <div key={priority} className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-white">Priority {priority} - {getPriorityLabel(priority)}</span>
                <span className="text-gray-400">{formatDuration(ms)}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    priority === 'A' ? 'bg-red-500'
                    : priority === 'B' ? 'bg-orange-500'
                    : priority === 'C' ? 'bg-yellow-500'
                    : priority === 'D' ? 'bg-blue-500'
                    : 'bg-gray-500'
                  }`}
                  style={{ width: `${maxTimeByPriority ? (ms / maxTimeByPriority) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {topTasksByTime.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Top 5 tasks by time spent</h4>
            <ul className="space-y-2">
              {topTasksByTime.map((t, i) => (
                <li key={t.id} className="flex items-center justify-between gap-4 py-2 px-3 bg-slate-700/50 rounded-lg">
                  <span className="text-white truncate flex-1 min-w-0" title={t.text}>{t.text}</span>
                  <span className="text-amber-400 font-mono text-sm whitespace-nowrap">{formatDuration(t._timeMs)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-xl p-8">
        <h3 className="text-2xl font-bold mb-6 text-white">Task Distribution by Priority</h3>
        {priorities.map((priority) => {
          const count = tasks.filter((t) => t.priority === priority && t.status !== 'done').length;
          const total = tasks.filter((t) => t.status !== 'done').length;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={priority} className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-white">Priority {priority} - {getPriorityLabel(priority)}</span>
                <span className="text-gray-400">{count} tasks ({percentage.toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    priority === 'A' ? 'bg-red-500'
                    : priority === 'B' ? 'bg-orange-500'
                    : priority === 'C' ? 'bg-yellow-500'
                    : priority === 'D' ? 'bg-blue-500'
                    : 'bg-gray-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800 rounded-xl p-8">
        <h3 className="text-2xl font-bold mb-6 text-white">Task Distribution by Status</h3>
        <div className="grid grid-cols-3 gap-4">
          {statuses.map((status) => {
            const count = tasks.filter((t) => t.status === status).length;
            return (
              <div key={status} className="bg-slate-700 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{count}</div>
                <div className="text-gray-400">{getStatusLabel(status)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Hydration Section ─────────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-xl p-6 md:p-8">
        <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <Droplets className="w-7 h-7 text-blue-400" />
          Hydration
        </h3>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Today's progress ring */}
          <div className="col-span-2 md:col-span-1 bg-slate-700/60 rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="relative" style={{ width: 88, height: 88 }}>
              <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="44" cy="44" r="36" fill="none" stroke="#334155" strokeWidth="7" />
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke={todayProgress >= 1 ? '#34d399' : '#38bdf8'}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - todayProgress)}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: 'none' }}>
                <span className="text-xl">💧</span>
                <span className="font-bold text-white text-sm leading-tight">
                  {todayCount}<span className="text-gray-400 text-xs">/{goal}</span>
                </span>
              </div>
            </div>
            <span className="text-gray-400 text-xs mt-2 text-center">Today</span>
          </div>

          <div className="bg-slate-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-white mb-1">{streak}</div>
            <div className="text-gray-400 text-xs">Day streak 🔥</div>
            <div className="text-gray-500 text-xs mt-0.5">(hit daily goal)</div>
          </div>

          <div className="bg-slate-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-white mb-1">{weeklyAvg}</div>
            <div className="text-gray-400 text-xs">Avg glasses/day</div>
            <div className="text-gray-500 text-xs mt-0.5">(past 7 days)</div>
          </div>

          <div className="bg-slate-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-white mb-1">{goal}</div>
            <div className="text-gray-400 text-xs">Daily goal</div>
            <div className="text-gray-500 text-xs mt-0.5">glasses</div>
          </div>
        </div>

        {/* 7-day bar chart */}
        <h4 className="text-lg font-semibold text-white mb-4">Last 7 days</h4>
        <div className="flex items-end gap-2 md:gap-3 h-40">
          {dailyTotals.map(({ day, count }) => {
            const barPct = (count / maxBarCount) * 100;
            const goalLinePct = (goal / maxBarCount) * 100;
            const hitGoal = count >= goal;
            const isToday = day === todayKey;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-xs font-semibold" style={{ color: hitGoal ? '#34d399' : '#60a5fa' }}>
                  {count > 0 ? count : ''}
                </span>
                <div className="relative w-full flex items-end" style={{ height: '120px' }}>
                  {/* Goal line */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-blue-500/40"
                    style={{ bottom: `${goalLinePct}%` }}
                  />
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      hitGoal ? 'bg-emerald-500' : isToday ? 'bg-blue-400' : 'bg-blue-600/60'
                    }`}
                    style={{ height: count > 0 ? `${barPct}%` : '3px', minHeight: '3px' }}
                    title={`${formatDayLabel(day)}: ${count} glasses`}
                  />
                </div>
                <span className={`text-xs truncate w-full text-center ${isToday ? 'text-blue-300 font-semibold' : 'text-gray-500'}`}>
                  {formatShortDay(day)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-emerald-500" /> Goal met
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 rounded-sm bg-blue-600/60" /> Below goal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t border-dashed border-blue-500/60" /> Daily goal
          </span>
        </div>

        {/* All-time total */}
        {Object.keys(waterLogs).length > 0 && (() => {
          const allTime = Object.values(waterLogs).flat().reduce((s, e) => s + e.amount, 0);
          const goalDays = Object.keys(waterLogs).filter((d) => {
            const cnt = (waterLogs[d] || []).reduce((s, e) => s + e.amount, 0);
            return cnt >= goal;
          }).length;
          return (
            <div className="mt-4 pt-4 border-t border-slate-700 flex gap-6 text-sm">
              <div>
                <span className="text-gray-400">Total logged: </span>
                <span className="text-white font-semibold">{allTime} glasses</span>
              </div>
              <div>
                <span className="text-gray-400">Goal days: </span>
                <span className="text-white font-semibold">{goalDays}</span>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
          EAT THAT FROG PRINCIPLES
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-2xl">🐸</span>
            <div><strong>Eat the ugliest frog first:</strong> Start with your most important, challenging task</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">⏰</span>
            <div><strong>Do it first thing:</strong> Tackle your A tasks in the morning when your energy is highest</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div><strong>Focus ruthlessly:</strong> Work on one task at a time until completion</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">✂️</span>
            <div><strong>Eliminate &amp; delegate:</strong> Use D and E priorities to free up time for what matters</div>
          </li>
        </ul>
      </div>
    </div>
  );
}
