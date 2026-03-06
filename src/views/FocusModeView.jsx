import React, { useState, useEffect } from 'react';
import { Flame, Play, Pause, Timer, X } from 'lucide-react';

export default function FocusModeView({
  todaysFrog,
  setShowFocusMode,
  startTimer,
  stopTimer,
  formatDuration,
  getStatusLabel,
  getPriorityBadgeColor,
  setShowPomodoro,
}) {
  const [tick, setTick] = useState(0);
  const isRunning = !!todaysFrog?.timerStartedAt;
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const displayMs = todaysFrog
    ? (todaysFrog.totalTimeMs ?? 0) + (todaysFrog.timerStartedAt ? Date.now() - new Date(todaysFrog.timerStartedAt).getTime() : 0)
    : 0;

  return (
    <div className="animate-[slideIn_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-400" />
          Focus mode
        </h2>
        <button
          type="button"
          onClick={() => setShowFocusMode(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-gray-300 hover:bg-slate-600 font-medium transition-colors"
        >
          <X className="w-4 h-4" />
          Exit focus mode
        </button>
      </div>

      {todaysFrog ? (
        <div className="bg-slate-800 rounded-2xl p-8 border-2 border-orange-500/50 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Today&apos;s frog</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white break-words">{todaysFrog.text}</h3>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`${getPriorityBadgeColor(todaysFrog.priority)} rounded-lg px-3 py-1 text-sm font-bold`}>
                  Priority {todaysFrog.priority}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-700 text-gray-300 text-sm font-medium">
                  {getStatusLabel(todaysFrog.status)}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-3">
              <button
                type="button"
                onClick={() => (isRunning ? stopTimer(todaysFrog.id) : startTimer(todaysFrog.id))}
                className={`flex items-center gap-3 rounded-xl px-6 py-4 font-semibold transition-all touch-manipulation ${
                  isRunning
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                    : 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                }`}
              >
                {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                <span className="text-xl tabular-nums">{formatDuration(displayMs)}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPomodoro(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 text-sm font-medium"
              >
                <Timer className="w-4 h-4" />
                Pomodoro timer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl p-12 text-center border-2 border-dashed border-slate-600">
          <Flame className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No frog set</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Mark a task with the flame icon on the board to set your frog for today. Then come back here to focus on it.
          </p>
          <button
            type="button"
            onClick={() => setShowFocusMode(false)}
            className="px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            Back to board
          </button>
        </div>
      )}
    </div>
  );
}
