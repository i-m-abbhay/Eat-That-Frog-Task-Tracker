import React from 'react';
import {
  Dumbbell, Settings, ChevronDown, ChevronUp, Plus, Trash2, BarChart3, ClipboardList,
  Pencil, Save, RotateCcw,
} from 'lucide-react';
import { getTodayKey } from '../dateUtils';
import { getWeightSeries, getWeightRange, getFrequencyPairs } from '../utils/fitnessUtils';

const DEFAULT_BODY_PARTS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyDay() {
  return { weight: null, workouts: [] };
}

function ensureDay(entry) {
  if (!entry || typeof entry !== 'object') return emptyDay();
  return {
    weight: entry.weight ?? null,
    workouts: Array.isArray(entry.workouts) ? entry.workouts : [],
  };
}

/** Responsive weight trend: grid, gradient area, line, points */
function WeightTrendChart({ series, unitLabel }) {
  const hasData = series.some((p) => p.weight != null);
  if (!hasData) {
    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 py-14 px-4 text-center">
        <p className="text-sm text-gray-500">Log weight on the Log tab to see your 30-day trend.</p>
      </div>
    );
  }

  const VB = { w: 640, h: 248 };
  const pad = { l: 54, r: 18, t: 20, b: 42 };
  const innerW = VB.w - pad.l - pad.r;
  const innerH = VB.h - pad.t - pad.b;
  const yBottom = pad.t + innerH;
  const { min, max } = getWeightRange(series);
  const n = series.length;
  const xAt = (i) => pad.l + (n <= 1 ? innerW / 2 : (i / Math.max(1, n - 1)) * innerW);
  const yAt = (w) => {
    if (max === min) return pad.t + innerH / 2;
    return pad.t + innerH - ((w - min) / (max - min)) * innerH;
  };

  const tickLevels = 4;
  const yTicks = [];
  for (let g = 0; g <= tickLevels; g += 1) {
    const val = min + ((max - min) * g) / tickLevels;
    const y = yAt(val);
    yTicks.push({ val, y });
  }

  const lineSegs = [];
  for (let i = 0; i < n - 1; i += 1) {
    const a = series[i];
    const b = series[i + 1];
    if (a.weight != null && b.weight != null) {
      lineSegs.push({
        key: `${i}-${i + 1}`,
        x1: xAt(i),
        y1: yAt(a.weight),
        x2: xAt(i + 1),
        y2: yAt(b.weight),
      });
    }
  }

  const xLabelIdx = [...new Set([0, 7, 14, 21, 28, n - 1].filter((i) => i >= 0 && i < n))].sort((a, b) => a - b);

  return (
    <div className="w-full rounded-xl border border-slate-700/80 bg-slate-900/40 p-3 sm:p-4">
      <svg
        className="w-full h-[220px] sm:h-[248px] block"
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Weight trend last 30 days"
      >
        <defs>
          <linearGradient id="weightLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="weightAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <rect
          x={pad.l}
          y={pad.t}
          width={innerW}
          height={innerH}
          rx="8"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="1"
        />

        {yTicks.map(({ val, y }) => (
          <g key={val}>
            <line
              x1={pad.l}
              y1={y}
              x2={pad.l + innerW}
              y2={y}
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 6"
              opacity={0.45}
            />
            <text
              x={pad.l - 8}
              y={y + 4}
              fill="#94a3b8"
              fontSize="11"
              textAnchor="end"
              className="tabular-nums"
            >
              {val.toFixed(1)}
            </text>
          </g>
        ))}

        {lineSegs.map((s) => (
          <path
            key={`area-${s.key}`}
            d={`M ${s.x1} ${yBottom} L ${s.x1} ${s.y1} L ${s.x2} ${s.y2} L ${s.x2} ${yBottom} Z`}
            fill="url(#weightAreaGrad)"
          />
        ))}

        {lineSegs.map((s) => (
          <line
            key={s.key}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="url(#weightLineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {series.map((p, i) => {
          if (p.weight == null) return null;
          const cx = xAt(i);
          const cy = yAt(p.weight);
          return (
            <g key={p.dateKey}>
              <circle cx={cx} cy={cy} r="6" fill="#0f172a" stroke="#fdba74" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="3" fill="#fff7ed" />
            </g>
          );
        })}

        <text x={pad.l} y={14} fill="#cbd5e1" fontSize="12" fontWeight="600">
          Weight ({unitLabel})
        </text>

        {xLabelIdx.map((i) => {
          const dk = series[i]?.dateKey;
          if (!dk) return null;
          const label = dk.slice(5);
          return (
            <text
              key={dk}
              x={xAt(i)}
              y={VB.h - 12}
              fill="#64748b"
              fontSize="10"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function FrequencyBars({ pairs, maxItems = 8 }) {
  const top = pairs.slice(0, maxItems);
  const maxC = Math.max(1, ...top.map((p) => p.count));
  return (
    <ul className="space-y-1.5">
      {top.length === 0 && (
        <li className="text-xs text-gray-500 text-center py-2">No exercises logged in this period.</li>
      )}
      {top.map(({ label, count }) => (
        <li key={label} className="flex items-center gap-2 text-xs">
          <span className="text-gray-300 truncate flex-1 min-w-0" title={label}>{label}</span>
          <span className="text-gray-500 tabular-nums w-6 text-right">{count}</span>
          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-orange-500/90 rounded-full transition-all"
              style={{ width: `${(count / maxC) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function FitnessView({
  fitnessLogs,
  fitnessSettings,
  onUpdateDay,
  onUpdateSettings,
}) {
  const [panelTab, setPanelTab] = React.useState('log');
  const [showSettings, setShowSettings] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(getTodayKey);
  const [freqPeriod, setFreqPeriod] = React.useState('week');
  const [freqGroup, setFreqGroup] = React.useState('exercise');
  const [expandedWorkoutId, setExpandedWorkoutId] = React.useState(null);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(null);

  React.useEffect(() => {
    setEditing(false);
    setDraft(null);
  }, [selectedDate]);

  const unit = fitnessSettings.weightUnit === 'lb' ? 'lb' : 'kg';
  const savedDay = ensureDay(fitnessLogs[selectedDate]);
  const day = editing && draft != null ? ensureDay(draft) : savedDay;

  const applyDay = (updater) => {
    setDraft((prev) => {
      const cur = ensureDay(prev);
      return typeof updater === 'function' ? updater(cur) : updater;
    });
  };

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(savedDay)));
    setEditing(true);
    setExpandedWorkoutId(null);
  };

  const saveDay = () => {
    if (draft == null) return;
    onUpdateDay(selectedDate, () => JSON.parse(JSON.stringify(ensureDay(draft))));
    setEditing(false);
    setDraft(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
  };

  React.useEffect(() => {
    if (showSettings) {
      setEditing(false);
      setDraft(null);
    }
  }, [showSettings]);

  const weightSeries = React.useMemo(() => getWeightSeries(fitnessLogs, 30), [fitnessLogs]);
  const freqPairs = React.useMemo(
    () => getFrequencyPairs(fitnessLogs, freqPeriod, freqGroup === 'exercise' ? 'exercise' : 'bodyPart'),
    [fitnessLogs, freqPeriod, freqGroup]
  );

  const setWeight = (raw) => {
    const v = raw === '' || raw == null ? null : parseFloat(String(raw).replace(',', '.'));
    applyDay((d) => ({
      ...ensureDay(d),
      weight: v != null && !Number.isNaN(v) ? v : null,
    }));
  };

  const addWorkout = () => {
    const id = newId();
    applyDay((d) => {
      const cur = ensureDay(d);
      return {
        ...cur,
        workouts: [...cur.workouts, { id, exercises: [] }],
      };
    });
    setExpandedWorkoutId(id);
  };

  const removeWorkout = (wid) => {
    applyDay((d) => {
      const cur = ensureDay(d);
      return { ...cur, workouts: cur.workouts.filter((w) => w.id !== wid) };
    });
  };

  const addExercise = (wid) => {
    applyDay((d) => {
      const cur = ensureDay(d);
      return {
        ...cur,
        workouts: cur.workouts.map((w) =>
          w.id === wid
            ? {
                ...w,
                exercises: [
                  ...w.exercises,
                  { id: newId(), name: '', bodyPart: '', sets: [{ weight: '', reps: '' }] },
                ],
              }
            : w
        ),
      };
    });
  };

  const patchExercise = (wid, eid, patch) => {
    applyDay((d) => {
      const cur = ensureDay(d);
      return {
        ...cur,
        workouts: cur.workouts.map((w) =>
          w.id !== wid
            ? w
            : {
                ...w,
                exercises: w.exercises.map((ex) => (ex.id === eid ? { ...ex, ...patch } : ex)),
              }
        ),
      };
    });
  };

  const removeExercise = (wid, eid) => {
    applyDay((d) => {
      const cur = ensureDay(d);
      return {
        ...cur,
        workouts: cur.workouts.map((w) =>
          w.id === wid ? { ...w, exercises: w.exercises.filter((ex) => ex.id !== eid) } : w
        ),
      };
    });
  };

  const addSet = (wid, eid) => {
    applyDay((d) => {
      const cur = ensureDay(d);
      return {
        ...cur,
        workouts: cur.workouts.map((w) =>
          w.id !== wid
            ? w
            : {
                ...w,
                exercises: w.exercises.map((ex) =>
                  ex.id === eid
                    ? { ...ex, sets: [...(ex.sets || []), { weight: '', reps: '' }] }
                    : ex
                ),
              }
        ),
      };
    });
  };

  const patchSet = (wid, eid, si, field, val) => {
    applyDay((d) => {
      const cur = ensureDay(d);
      return {
        ...cur,
        workouts: cur.workouts.map((w) =>
          w.id !== wid
            ? w
            : {
                ...w,
                exercises: w.exercises.map((ex) => {
                  if (ex.id !== eid) return ex;
                  const sets = [...(ex.sets || [])];
                  const row = { ...sets[si], [field]: val };
                  sets[si] = row;
                  return { ...ex, sets };
                }),
              }
        ),
      };
    });
  };

  const removeSet = (wid, eid, si) => {
    applyDay((d) => {
      const cur = ensureDay(d);
      return {
        ...cur,
        workouts: cur.workouts.map((w) =>
          w.id !== wid
            ? w
            : {
                ...w,
                exercises: w.exercises.map((ex) => {
                  if (ex.id !== eid) return ex;
                  const sets = (ex.sets || []).filter((_, j) => j !== si);
                  return { ...ex, sets };
                }),
              }
        ),
      };
    });
  };

  const weightVal =
    day.weight != null && !Number.isNaN(Number(day.weight)) ? String(day.weight) : '';

  return (
    <div className="max-w-4xl mx-auto w-full pb-10 px-3 sm:px-4">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Dumbbell className="w-9 h-9 sm:w-10 sm:h-10 text-orange-400 shrink-0" aria-hidden />
          <div className="min-w-0">
            <h2
              className="text-2xl sm:text-3xl font-bold text-white tracking-wide leading-tight"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em' }}
            >
              FITNESS
            </h2>
            <p className="text-sm text-gray-400">Daily weight, workouts, and trends</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className={`self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showSettings ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          Units
        </button>
      </header>

      <div
        className="rounded-2xl border border-slate-600 shadow-xl overflow-hidden flex flex-col"
        style={{ background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)' }}
        role="region"
        aria-label="Fitness log and charts"
      >
        {showSettings ? (
          <div className="px-4 sm:px-6 py-5 space-y-3">
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">Weight unit</label>
              <div className="flex gap-2">
                {['kg', 'lb'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onUpdateSettings({ ...fitnessSettings, weightUnit: u })}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      (fitnessSettings.weightUnit || 'kg') === u
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 text-sm font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-1 px-4 sm:px-6 pt-4 pb-2 flex-shrink-0 border-b border-slate-700/60">
              <button
                type="button"
                onClick={() => setPanelTab('log')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  panelTab === 'log' ? 'bg-orange-500 text-white' : 'bg-slate-700/80 text-gray-400 hover:text-white'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Log
              </button>
              <button
                type="button"
                onClick={() => setPanelTab('charts')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  panelTab === 'charts' ? 'bg-orange-500 text-white' : 'bg-slate-700/80 text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Charts
              </button>
            </div>

            <div className="px-4 sm:px-6 pb-8 pt-4">
              {panelTab === 'log' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-gray-400 font-semibold mb-1">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        max={getTodayKey()}
                        onChange={(e) => setSelectedDate(e.target.value || getTodayKey())}
                        disabled={editing}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    {!editing ? (
                      <button
                        type="button"
                        onClick={startEdit}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shrink-0"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit day
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={saveDay}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-200 text-sm font-semibold transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {!editing && (
                    <div className="rounded-xl border border-slate-600 bg-slate-800/40 p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Weight</p>
                        <p className="text-lg text-white font-semibold tabular-nums">
                          {savedDay.weight != null && !Number.isNaN(Number(savedDay.weight))
                            ? `${savedDay.weight} ${unit}`
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-2">Workouts</p>
                        {savedDay.workouts.length === 0 ? (
                          <p className="text-sm text-gray-500">No workouts logged for this day.</p>
                        ) : (
                          <ul className="space-y-2">
                            {savedDay.workouts.map((w, wi) => (
                              <li
                                key={w.id}
                                className="text-sm text-gray-300 border-l-2 border-orange-500/50 pl-3"
                              >
                                <span className="text-white font-medium">Workout {wi + 1}</span>
                                {(w.exercises || []).length === 0 ? (
                                  <span className="text-gray-500"> — no exercises</span>
                                ) : (
                                  <ul className="mt-1 text-gray-400 text-xs space-y-0.5">
                                    {(w.exercises || []).map((ex) => (
                                      <li key={ex.id}>
                                        {ex.name?.trim() || '(unnamed)'}
                                        {ex.bodyPart?.trim() ? ` · ${ex.bodyPart}` : ''}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {editing && (
                    <>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1">
                      Weight ({unit})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={`e.g. 72.5`}
                      value={weightVal}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Workouts</span>
                    <button
                      type="button"
                      onClick={addWorkout}
                      className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add workout
                    </button>
                  </div>

                  {day.workouts.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">No workouts for this day.</p>
                  )}

                  {day.workouts.map((w, wi) => {
                    const open = expandedWorkoutId === w.id;
                    return (
                      <div key={w.id} className="rounded-xl border border-slate-600 bg-slate-800/50 overflow-hidden">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-3 py-2 text-left"
                          onClick={() => setExpandedWorkoutId(open ? null : w.id)}
                        >
                          <span className="text-sm text-white font-medium">
                            Workout {wi + 1}
                            <span className="text-gray-500 font-normal ml-2">
                              ({w.exercises?.length || 0} exercise{(w.exercises?.length || 0) !== 1 ? 's' : ''})
                            </span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeWorkout(w.id);
                              }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-slate-700"
                              aria-label="Remove workout"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                          </div>
                        </button>
                        {open && (
                          <div className="px-3 pb-3 space-y-3 border-t border-slate-700/80">
                            <button
                              type="button"
                              onClick={() => addExercise(w.id)}
                              className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-orange-300 text-xs font-semibold flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add exercise
                            </button>
                            {(w.exercises || []).map((ex, ei) => (
                              <div
                                key={ex.id}
                                className="rounded-lg bg-slate-900/60 p-2.5 space-y-2 border border-slate-700/80"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-[10px] text-gray-500 uppercase font-semibold pt-1">
                                    Exercise {ei + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeExercise(w.id, ex.id)}
                                    className="p-1 rounded text-gray-500 hover:text-red-400"
                                    aria-label="Remove exercise"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Exercise name"
                                  value={ex.name || ''}
                                  onChange={(e) => patchExercise(w.id, ex.id, { name: e.target.value })}
                                  className="w-full px-2 py-1.5 bg-slate-700 text-white rounded text-xs border border-slate-600 focus:border-orange-500 focus:outline-none"
                                />
                                <div>
                                  <label className="text-[10px] text-gray-500 font-semibold">Body part</label>
                                  <input
                                    type="text"
                                    list={`frog-bp-${ex.id}`}
                                    placeholder="e.g. Chest"
                                    value={ex.bodyPart || ''}
                                    onChange={(e) => patchExercise(w.id, ex.id, { bodyPart: e.target.value })}
                                    className="w-full mt-0.5 px-2 py-1.5 bg-slate-700 text-white rounded text-xs border border-slate-600 focus:border-orange-500 focus:outline-none"
                                  />
                                  <datalist id={`frog-bp-${ex.id}`}>
                                    {DEFAULT_BODY_PARTS.map((bp) => (
                                      <option key={bp} value={bp} />
                                    ))}
                                  </datalist>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex text-[10px] text-gray-500 gap-2">
                                    <span className="w-14">Wt ({unit})</span>
                                    <span className="w-12">Reps</span>
                                  </div>
                                  {(ex.sets || []).map((row, si) => (
                                    <div key={si} className="flex gap-2 items-center">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        className="w-14 px-1.5 py-1 bg-slate-700 text-white rounded text-xs border border-slate-600"
                                        value={row.weight ?? ''}
                                        onChange={(e) => patchSet(w.id, ex.id, si, 'weight', e.target.value)}
                                      />
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        className="w-12 px-1.5 py-1 bg-slate-700 text-white rounded text-xs border border-slate-600"
                                        value={row.reps ?? ''}
                                        onChange={(e) => patchSet(w.id, ex.id, si, 'reps', e.target.value)}
                                      />
                                      {(ex.sets || []).length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeSet(w.id, ex.id, si)}
                                          className="p-1 text-gray-500 hover:text-red-400"
                                          aria-label="Remove set"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => addSet(w.id, ex.id)}
                                    className="text-[10px] font-semibold text-orange-400/90 hover:text-orange-300"
                                  >
                                    + Add set
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                    </>
                  )}
                </div>
              )}

              {panelTab === 'charts' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2">Weight (last 30 days)</p>
                    <WeightTrendChart series={weightSeries} unitLabel={unit} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2">Frequency</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[
                        { id: 'week', label: 'This week' },
                        { id: 'month', label: 'This month' },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setFreqPeriod(id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                            freqPeriod === id ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[
                        { id: 'exercise', label: 'By exercise' },
                        { id: 'bodyPart', label: 'By body part' },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setFreqGroup(id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                            freqGroup === id ? 'bg-slate-600 text-white' : 'bg-slate-800 text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <FrequencyBars pairs={freqPairs} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
