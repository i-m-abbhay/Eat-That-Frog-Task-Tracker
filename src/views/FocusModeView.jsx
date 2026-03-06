import React, { useState, useEffect } from 'react';
import { Flame, Play, Pause, Timer, X } from 'lucide-react';

export default function FocusModeView({
  todaysFrogs,
  setShowFocusMode,
  startTimer,
  stopTimer,
  formatDuration,
  getStatusLabel,
  getPriorityBadgeColor,
  setShowPomodoro,
}) {
  const hasAnyRunning = todaysFrogs?.some((f) => f.timerStartedAt) ?? false;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!hasAnyRunning) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [hasAnyRunning]);

  const getDisplayMs = (frog) =>
    (frog?.totalTimeMs ?? 0) +
    (frog?.timerStartedAt ? Date.now() - new Date(frog.timerStartedAt).getTime() : 0);

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

      {todaysFrogs?.length > 0 ? (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
            Today&apos;s Frog{todaysFrogs.length > 1 ? 's' : ''} ({todaysFrogs.length})
          </p>
          {todaysFrogs.map((frog) => {
            const isRunning = !!frog.timerStartedAt;
            const displayMs = getDisplayMs(frog);
            return (
              <div
                key={frog.id}
                className="bg-slate-800 rounded-2xl p-6 sm:p-8 border-2 border-orange-500/50 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-white break-words">{frog.text}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`${getPriorityBadgeColor(frog.priority)} rounded-lg px-2.5 py-0.5 text-sm font-bold`}>
                        Priority {frog.priority}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-700 text-gray-300 text-sm font-medium">
                        {getStatusLabel(frog.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <button
                      type="button"
                      onClick={() => (isRunning ? stopTimer(frog.id) : startTimer(frog.id))}
                      className={`flex items-center gap-3 rounded-xl px-5 py-3 font-semibold transition-all touch-manipulation ${
                        isRunning
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                          : 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                      }`}
                    >
                      {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      <span className="text-lg tabular-nums">{formatDuration(displayMs)}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setShowPomodoro(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 text-sm font-medium"
          >
            <Timer className="w-4 h-4" />
            Pomodoro timer
          </button>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl p-12 text-center border-2 border-dashed border-slate-600">
          <Flame className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No frogs set</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Mark one or more tasks with the flame icon on the board to set your frogs for today. Then come back here to focus.
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
