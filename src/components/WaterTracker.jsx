import React from 'react';
import { X, Droplets, Plus, Minus, Bell, BellOff, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { getTodayKey } from '../dateUtils';

const WATER_RING_R = 54;
const WATER_RING_CIRC = 2 * Math.PI * WATER_RING_R;

export default function WaterTracker({ onClose, waterLogs, waterSettings, onLog, onRemoveLog, onUpdateSettings }) {
  const [showSettings, setShowSettings] = React.useState(false);
  const [settingsGoal, setSettingsGoal] = React.useState(waterSettings.dailyGoalGlasses);
  const [settingsInterval, setSettingsInterval] = React.useState(waterSettings.reminderIntervalMinutes);
  const [showLog, setShowLog] = React.useState(false);
  const [justLogged, setJustLogged] = React.useState(false);
  const justLoggedRef = React.useRef(null);

  const todayKey = getTodayKey();
  const todayLogs = waterLogs[todayKey] || [];
  const glassCount = todayLogs.reduce((s, e) => s + e.amount, 0);
  const goal = waterSettings.dailyGoalGlasses;
  const progress = Math.min(1, glassCount / goal);
  const dashOffset = WATER_RING_CIRC * (1 - progress);

  const ringColor = progress >= 1
    ? '#34d399'
    : progress >= 0.6
    ? '#60a5fa'
    : '#38bdf8';

  React.useEffect(() => {
    setSettingsGoal(waterSettings.dailyGoalGlasses);
    setSettingsInterval(waterSettings.reminderIntervalMinutes);
  }, [waterSettings]);

  const handleLog = () => {
    onLog(1);
    setJustLogged(true);
    clearTimeout(justLoggedRef.current);
    justLoggedRef.current = setTimeout(() => setJustLogged(false), 800);
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  };

  const toggleReminder = async () => {
    if (!waterSettings.reminderEnabled) {
      const granted = await requestNotifPermission();
      if (!granted) {
        alert('Please allow notifications in your browser to use reminders.');
        return;
      }
    }
    onUpdateSettings({ ...waterSettings, reminderEnabled: !waterSettings.reminderEnabled });
  };

  const saveSettings = () => {
    const newGoal = Math.max(1, Math.min(20, parseInt(settingsGoal) || 8));
    const newInterval = Math.max(15, Math.min(240, parseInt(settingsInterval) || 60));
    onUpdateSettings({ ...waterSettings, dailyGoalGlasses: newGoal, reminderIntervalMinutes: newInterval });
    setShowSettings(false);
  };

  const formatTime = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEncouragementMsg = () => {
    if (glassCount === 0) return 'Start hydrating! 💧';
    if (progress >= 1) return 'Daily goal reached! 🎉';
    if (progress >= 0.75) return 'Almost there, keep going!';
    if (progress >= 0.5) return 'Halfway there, great work!';
    if (progress >= 0.25) return 'Good start, keep sipping!';
    return 'Stay hydrated today!';
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[90] md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="fixed bottom-4 left-4 z-[100] w-[300px] rounded-2xl shadow-2xl border border-slate-600 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          animation: 'water-slide-in 0.3s ease-out forwards',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Water Tracker"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-white font-bold text-sm tracking-wide">Hydration Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleReminder}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                waterSettings.reminderEnabled
                  ? 'text-blue-400 bg-blue-500/20 hover:bg-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
              title={waterSettings.reminderEnabled ? `Reminders on (every ${waterSettings.reminderIntervalMinutes}m)` : 'Enable reminders'}
              aria-label={waterSettings.reminderEnabled ? 'Disable reminders' : 'Enable reminders'}
            >
              {waterSettings.reminderEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                showSettings ? 'text-blue-400 bg-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Close water tracker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showSettings ? (
          <div className="px-4 py-3 space-y-3">
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">Daily goal (glasses)</label>
              <input
                type="number" min="1" max="20"
                value={settingsGoal}
                onChange={(e) => setSettingsGoal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">Reminder interval (minutes)</label>
              <input
                type="number" min="15" max="240"
                value={settingsInterval}
                onChange={(e) => setSettingsInterval(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
              />
              <p className="text-gray-500 text-xs mt-1">Min 15m · Max 240m</p>
            </div>
            <div className="flex gap-2 pb-1">
              <button
                onClick={saveSettings}
                className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress ring */}
            <div className="flex justify-center py-3">
              <div className="relative" style={{ width: 136, height: 136 }}>
                <svg width="136" height="136" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="68" cy="68" r={WATER_RING_R} fill="none" stroke="#334155" strokeWidth="8" />
                  <circle
                    cx="68" cy="68" r={WATER_RING_R}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={WATER_RING_CIRC}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
                  />
                </svg>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ pointerEvents: 'none' }}
                >
                  <span
                    className="text-3xl"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: justLogged ? 'scale(1.3)' : 'scale(1)',
                    }}
                  >
                    💧
                  </span>
                  <span className="font-bold text-white text-xl leading-tight mt-0.5">
                    {glassCount}
                    <span className="text-gray-400 text-sm font-normal">/{goal}</span>
                  </span>
                  <span className="text-xs text-gray-400">glasses</span>
                </div>
              </div>
            </div>

            {/* Encouragement */}
            <p className="text-center text-xs font-medium text-blue-300 -mt-1 mb-3 px-4">
              {getEncouragementMsg()}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-2 px-4 pb-3">
              <button
                onClick={handleLog}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm transition-all touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                Log a glass
              </button>
              {glassCount > 0 && (
                <button
                  onClick={onRemoveLog}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white transition-all touch-manipulation"
                  title="Undo last entry"
                  aria-label="Undo last entry"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Today's log collapsible */}
            {todayLogs.length > 0 && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowLog((s) => !s)}
                  className="flex items-center justify-between w-full text-xs text-gray-400 font-semibold mb-1.5 hover:text-gray-300 transition-colors"
                >
                  <span>Today's log ({todayLogs.length} entr{todayLogs.length > 1 ? 'ies' : 'y'})</span>
                  {showLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showLog && (
                  <div className="space-y-1 max-h-[110px] overflow-y-auto pr-0.5">
                    {[...todayLogs].reverse().map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-700/60 rounded-lg"
                      >
                        <span className="text-blue-300">
                          💧 {entry.amount} glass{entry.amount > 1 ? 'es' : ''}
                        </span>
                        <span className="text-gray-500">{formatTime(entry.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes water-slide-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </>
  );
}
