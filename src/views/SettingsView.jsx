import { Sun, Moon, Monitor, Download, Upload, Layout, RotateCcw } from 'lucide-react';
import { getCutoffForPreset, formatCutoffLabel } from '../dateUtils';
import { DEFAULT_ROW_HEIGHT } from '../constants';

export default function SettingsView({
  theme, setTheme,
  handleExport, handleImport, importInputRef,
  rowHeights, setRowHeights,
  handleResetStats,
  settingsClearBeforeDate, setSettingsClearBeforeDate,
  handleClearWithConfirm,
}) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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
