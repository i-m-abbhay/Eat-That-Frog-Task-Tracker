import { Sun, Moon, Monitor, Download, Upload, Layout, RotateCcw, Cloud, Copy, RefreshCw, ExternalLink } from 'lucide-react';
import { getCutoffForPreset, formatCutoffLabel } from '../dateUtils';
import { DEFAULT_ROW_HEIGHT } from '../constants';

const FIREBASE_CONFIG_KEYS = ['apiKey', 'databaseURL', 'projectId', 'appId'];

export default function SettingsView({
  theme, setTheme,
  handleExport, handleImport, importInputRef,
  rowHeights, setRowHeights,
  handleResetStats,
  settingsClearBeforeDate, setSettingsClearBeforeDate,
  handleClearWithConfirm,
  syncEnabled, setSyncEnabled,
  syncConfig, setSyncConfig,
  syncCode, setSyncCode,
  syncStatus,
}) {
  const updateSyncConfig = (key, value) => {
    setSyncConfig((prev) => ({ ...(prev || {}), [key]: value }));
  };
  const copySyncCode = () => {
    if (syncCode) {
      navigator.clipboard?.writeText(syncCode);
      window.alert('Sync code copied to clipboard.');
    }
  };
  const generateSyncCode = () => {
    setSyncCode('frog-' + Math.random().toString(36).slice(2, 9));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Sync */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Cloud className="w-5 h-5" /> Sync across devices
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Use the same sync code on your phone and desktop to keep tasks in sync. One-time Firebase setup required.
        </p>
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSyncEnabled(!syncEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
              syncEnabled ? 'bg-orange-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-1 ${
                syncEnabled ? 'translate-x-6 ml-0.5' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-gray-300 text-sm font-medium">{syncEnabled ? 'Sync on' : 'Sync off'}</span>
          {syncStatus && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              syncStatus === 'connected' ? 'bg-green-900/50 text-green-200' :
              syncStatus === 'offline' ? 'bg-amber-900/50 text-amber-200' :
              'bg-slate-600 text-gray-300'
            }`}>
              {syncStatus === 'connected' ? 'Connected' : syncStatus === 'offline' ? 'Offline' : 'Not configured'}
            </span>
          )}
        </div>
        {syncEnabled && (
          <div className="space-y-4 pt-2 border-t border-slate-600">
            <p className="text-gray-300 text-sm font-medium">Firebase config (one-time)</p>
            <p className="text-gray-500 text-xs">
              Create a project at{' '}
              <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-1">
                console.firebase.google.com <ExternalLink className="w-3 h-3" />
              </a>
              , add a Web app, then enable Realtime Database (test mode). Paste the 4 values below.
            </p>
            <div className="grid gap-2">
              {FIREBASE_CONFIG_KEYS.map((key) => (
                <input
                  key={key}
                  type="text"
                  placeholder={key}
                  value={syncConfig?.[key] ?? ''}
                  onChange={(e) => updateSyncConfig(key, e.target.value)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm font-mono"
                />
              ))}
            </div>
            <p className="text-gray-300 text-sm font-medium">Sync code — use the same on all devices</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="e.g. frog-4f2a9c or paste from another device"
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                className="flex-1 min-w-[180px] px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm font-mono"
              />
              <button
                type="button"
                onClick={copySyncCode}
                disabled={!syncCode}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-600 text-gray-200 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
              <button
                type="button"
                onClick={generateSyncCode}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-600 text-gray-200 hover:bg-slate-500 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Theme */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">Theme</h2>
        <p className="text-gray-400 text-sm mb-4">Choose light, dark, or follow your system.</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
            { value: 'system', icon: Monitor, label: 'System' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                theme === value ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Export / Import */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">Backup &amp; restore</h2>
        <p className="text-gray-400 text-sm mb-4">Export all tasks and stats as JSON. Import to restore or merge with current data.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export backup
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const input = e.target;
              if (!input.files?.length) return;
              const file = input.files[0];
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const data = JSON.parse(reader.result);
                  const replace = window.confirm('Replace all data with the file? (Cancel = merge with current data)');
                  handleImport(replace, data);
                } catch {
                  window.alert('Invalid file. Use a JSON backup from this app.');
                }
                input.value = '';
              };
              reader.readAsText(file);
            }}
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
          >
            <Upload className="w-4 h-4" /> Import backup
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">Import will ask: Replace all data or Merge (add tasks, add stats).</p>
      </div>

      {/* Board layout */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">Board layout</h2>
        <p className="text-gray-400 text-sm mb-4">Kanban row heights are saved automatically. Reset to default heights.</p>
        <button
          type="button"
          onClick={() => setRowHeights({ A: DEFAULT_ROW_HEIGHT, B: DEFAULT_ROW_HEIGHT, C: DEFAULT_ROW_HEIGHT, D: DEFAULT_ROW_HEIGHT, E: DEFAULT_ROW_HEIGHT })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
        >
          <Layout className="w-4 h-4" /> Reset row heights
        </button>
      </div>

      {/* Reset stats */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">Reset stats</h2>
        <p className="text-gray-400 text-sm mb-4">Set Completed Today, This Week, and Frogs Eaten back to zero. Your tasks are not changed.</p>
        <button
          type="button"
          onClick={handleResetStats}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/50 text-red-200 hover:bg-red-800/50 font-medium text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset stats
        </button>
      </div>

      {/* Clear old data */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">Clear old data</h2>
        <p className="text-gray-400 text-sm mb-6">
          Remove tasks created before a chosen date. Tasks on or after the cutoff are kept. Stats are not changed.
        </p>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm font-medium">Quick options</p>
          <div className="flex flex-wrap gap-3">
            {['lastMonth', 'last6Months', 'lastYear'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleClearWithConfirm(formatCutoffLabel(preset), getCutoffForPreset(preset))}
                className="px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
              >
                {preset === 'lastMonth' && `Till last month (keep from ${formatCutoffLabel(preset)})`}
                {preset === 'last6Months' && `Till last 6 months (keep from ${formatCutoffLabel(preset)})`}
                {preset === 'lastYear' && `Till last year (keep from ${formatCutoffLabel(preset)})`}
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-600">
            <p className="text-gray-300 text-sm font-medium mb-2">Custom date</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                id="settings-clear-date"
                value={settingsClearBeforeDate}
                onChange={(e) => setSettingsClearBeforeDate(e.target.value)}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={!settingsClearBeforeDate}
                onClick={() => {
                  if (settingsClearBeforeDate) {
                    const label = new Date(settingsClearBeforeDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    handleClearWithConfirm(label, settingsClearBeforeDate);
                    setSettingsClearBeforeDate('');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-900/50 text-red-200 hover:bg-red-800/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
              >
                Clear before this date
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">Tasks created on or after the chosen date are kept.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
