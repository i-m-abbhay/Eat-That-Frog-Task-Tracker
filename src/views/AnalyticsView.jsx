import { CheckCircle2, TrendingUp, Flame, Clock, Droplets } from 'lucide-react';
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

  // ─── Hydration analytics ─────────────────────────────────────────────────────
  const todayKey = getTodayKey();
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
          <div className="text-4xl font-bold text-white mb-2">{stats.today}</div>
          <div className="text-gray-400">Completed Today</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{stats.week}</div>
          <div className="text-gray-400">This Week</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-orange-400" />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{stats.frogStreak}</div>
          <div className="text-gray-400">Frogs Eaten</div>
        </div>
      </div>

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
