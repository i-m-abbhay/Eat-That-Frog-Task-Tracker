import React from 'react';
import { X, Timer, Flame, SkipForward, Pause, Play, RotateCcw } from 'lucide-react';
import { POMO_MODES, BEE_SPAWNS, RING_R, RING_CIRC } from '../constants';
import { playDoneChime } from '../utils/taskUtils';
import FlyBug from './FlyBug';
import PetFrog from './PetFrog';

export default function PomodoroTimer({ onClose, frogTask }) {
  const [mode, setMode]               = React.useState('work');
  const [timeLeft, setTimeLeft]       = React.useState(POMO_MODES.work);
  const [running, setRunning]         = React.useState(false);
  const [phase, setPhase]             = React.useState('idle');
  const [sessions, setSessions]       = React.useState(0);
  const [tongueTarget, setTongueTarget] = React.useState('none');
  const [bees, setBees]               = React.useState([]);
  const [eatTarget, setEatTarget]     = React.useState('none');
  const [frogOverride, setFrogOverride] = React.useState(null);
  const intervalRef                   = React.useRef(null);
  const totalRef                      = React.useRef(POMO_MODES.work);
  const nextBeeIdRef                  = React.useRef(0);
  const eatTimerRef                   = React.useRef(null);

  React.useEffect(() => {
    const isWorkMode = running && mode === 'work';
    if (!isWorkMode) { setTongueTarget('none'); return; }

    let alive = true;
    let step = 0;
    const timers = [];

    const schedule = (delay) => {
      const t = setTimeout(() => {
        if (!alive) return;
        setTongueTarget(step % 2 === 0 ? 'left' : 'right');
        step++;
        schedule(2500);
      }, delay);
      timers.push(t);
    };

    schedule(650);

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      setTongueTarget('none');
    };
  }, [running, mode]);

  React.useEffect(() => {
    if (running && mode === 'work') {
      setBees(prev => {
        const aliveCount = prev.filter(b => b.alive).length;
        if (aliveCount >= 2) return prev;
        const needed = 2 - aliveCount;
        const next = [...prev];
        for (let i = 0; i < needed; i++) {
          const pos = BEE_SPAWNS[nextBeeIdRef.current % BEE_SPAWNS.length];
          next.push({ id: nextBeeIdRef.current++, ...pos, alive: true });
        }
        return next;
      });
    } else {
      setBees([]);
    }
  }, [running, mode]);

  const handleBeeClick = (bee) => {
    if (!bee.alive || frogOverride === 'happy') return;

    setBees(prev => prev.map(b => b.id === bee.id ? { ...b, alive: false } : b));

    const dir = parseInt(bee.left) < 150 ? 'left' : 'right';
    setEatTarget(dir);

    clearTimeout(eatTimerRef.current);
    eatTimerRef.current = setTimeout(() => {
      setEatTarget('none');
      setFrogOverride('happy');

      setBees(prev => {
        const remaining = prev.filter(b => b.id !== bee.id);
        const aliveCount = remaining.filter(b => b.alive).length;
        const toSpawn = Math.max(0, 2 - aliveCount);
        const next = [...remaining];
        for (let i = 0; i < toSpawn; i++) {
          const pos = BEE_SPAWNS[nextBeeIdRef.current % BEE_SPAWNS.length];
          next.push({ id: nextBeeIdRef.current++, ...pos, alive: true });
        }
        return next;
      });

      setTimeout(() => setFrogOverride(null), 1600);
    }, 700);
  };

  const switchMode = (m) => {
    clearInterval(intervalRef.current);
    setMode(m);
    setTimeLeft(POMO_MODES[m]);
    totalRef.current = POMO_MODES[m];
    setRunning(false);
    setPhase('idle');
  };

  const toggleRunning = () => {
    if (phase === 'done') {
      switchMode(mode);
      return;
    }
    setRunning((r) => {
      const next = !r;
      if (next) setPhase('running');
      return next;
    });
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setPhase('idle');
    setTimeLeft(POMO_MODES[mode]);
    totalRef.current = POMO_MODES[mode];
  };

  React.useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setPhase('done');
          if (mode === 'work') setSessions((s) => s + 1);
          playDoneChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const progress   = timeLeft / POMO_MODES[mode];
  const dashOffset = RING_CIRC * (1 - progress);

  const ringColor = mode === 'work'
    ? '#f97316'
    : mode === 'short' ? '#34d399' : '#60a5fa';

  const frogState = phase === 'done'
    ? 'done'
    : running
    ? (mode === 'work' ? 'working' : 'break')
    : 'idle';

  const effectiveFrogState = frogOverride === 'happy' ? 'done' : frogState;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const modeLabel = mode === 'work' ? 'Focus' : mode === 'short' ? 'Short Break' : 'Long Break';
  const modeEmoji = mode === 'work' ? '🍅' : mode === 'short' ? '☕' : '🌿';

  const tomatoCount = Math.min(sessions, 8);

  return (
    <>
      <div
        className="fixed inset-0 z-[90] md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="fixed bottom-4 right-4 z-[100] w-[300px] rounded-2xl shadow-2xl border border-slate-600 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          animation: 'pomodoro-slide-in 0.3s ease-out forwards',
          ...(phase === 'done' ? { animation: 'pomodoro-done-glow 1.5s ease-in-out infinite, pomodoro-slide-in 0.3s ease-out' } : {}),
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Pomodoro Timer"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-orange-400" />
            <span className="text-white font-bold text-sm tracking-wide">Focus Timer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: Math.max(tomatoCount, 1) }).map((_, i) => (
                <span key={i} className={`text-xs ${i < tomatoCount ? 'opacity-100' : 'opacity-20'}`}>🍅</span>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Close timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pet frog + flies */}
        <div
          className="relative flex justify-center items-end px-4 pt-1 pb-0"
          style={{
            height: frogState === 'working' ? '124px' : '92px',
            transition: 'height 0.4s ease',
          }}
        >
          {frogState === 'working' && bees.map(bee => (
            <FlyBug
              key={bee.id}
              baseStyle={{ left: bee.left, top: bee.top }}
              pathAnim={bee.pathAnim}
              falling={!bee.alive}
              onClick={frogOverride === null ? () => handleBeeClick(bee) : undefined}
            />
          ))}
          <div style={{
            width: frogState === 'working' ? '104px' : '90px',
            height: frogState === 'working' ? '104px' : '90px',
            transition: 'all 0.4s ease',
          }}>
            <PetFrog state={effectiveFrogState} tongueTarget={tongueTarget} eatTarget={eatTarget} />
          </div>
        </div>

        {/* Circular progress ring + time */}
        <div className="flex justify-center py-2">
          <div className="relative" style={{ width: 136, height: 136 }}>
            <svg width="136" height="136" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="68" cy="68" r={RING_R} fill="none" stroke="#334155" strokeWidth="8" />
              <circle
                cx="68" cy="68" r={RING_R}
                fill="none"
                stroke={ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={dashOffset}
                style={{
                  transition: running ? 'stroke-dashoffset 0.95s linear' : 'none',
                  ...(running ? { animation: 'pomodoro-pulse-ring 2s ease-in-out infinite' } : {}),
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: 'none' }}>
              <span className="font-mono font-bold text-white" style={{ fontSize: '2rem', lineHeight: 1, letterSpacing: '-1px' }}>
                {mm}:{ss}
              </span>
              <span className="text-xs text-gray-400 mt-1 font-medium">
                {modeEmoji} {modeLabel}
              </span>
              {phase === 'done' && (
                <span className="text-xs text-orange-400 font-bold mt-0.5 animate-pulse">Done!</span>
              )}
            </div>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1.5 px-4 pb-2">
          {[
            { key: 'work',  label: '25m Focus' },
            { key: 'short', label: '5m Break'  },
            { key: 'long',  label: '15m Break' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation ${
                mode === key
                  ? key === 'work'
                    ? 'bg-orange-500 text-white'
                    : key === 'short'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-gray-400 hover:bg-slate-600 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <button
            onClick={toggleRunning}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all touch-manipulation ${
              phase === 'done'
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : running
                ? 'bg-slate-600 hover:bg-slate-500 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {phase === 'done' ? (
              <><SkipForward className="w-4 h-4" /> Next</>
            ) : running ? (
              <><Pause className="w-4 h-4" /> Pause</>
            ) : (
              <><Play className="w-4 h-4" /> {phase === 'idle' ? 'Start' : 'Resume'}</>
            )}
          </button>
          <button
            onClick={reset}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white transition-all touch-manipulation"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Linked frog task */}
        {frogTask && (
          <div className="mx-4 mb-4 px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span className="text-orange-200 text-xs font-medium truncate">{frogTask.text}</span>
          </div>
        )}
      </div>
    </>
  );
}
