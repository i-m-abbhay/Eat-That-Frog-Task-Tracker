import React, { useState, useEffect } from 'react';
import { CheckCircle2, Flame, TrendingUp, Trash2, Plus, BarChart3, Filter, GripVertical, Layout, Calendar, ChevronLeft, ChevronRight, ChevronDown, Settings, Search, Download, Upload, RotateCcw, Sun, Moon, Monitor, FileText, ListTodo, Undo2, HelpCircle, Repeat, Menu, X, ArrowRightLeft, Pencil, Timer, Play, Pause, SkipForward } from 'lucide-react';
import { storage } from './storage';
import {
  toDateKey,
  getTodayKey,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  addDays,
  addWeeks,
  addMonths,
  isInWeek,
  isInMonth,
  formatDay,
  formatWeekRange,
  formatMonth,
  getDaysInWeek,
  getWeekNumbersInMonth,
  getCutoffForPreset,
  formatCutoffLabel,
  getNextRecurrenceDate,
} from './dateUtils';

function ScheduleTaskCard({
  task,
  getPriorityBadgeColor,
  getStatusLabel,
  setFrog,
  deleteTask,
  editingTaskId,
  editingText,
  setEditingText,
  startEditing,
  saveEditing,
  cancelEditing,
  compact = false,
}) {
  const isEditing = editingTaskId === task.id;
  return (
    <div className={`task-card bg-white rounded-lg p-3 shadow-md ${task.isFrog ? 'ring-2 ring-orange-500' : ''} ${compact ? 'p-2' : ''}`}>
      <div className={`flex items-start gap-2 ${compact ? 'flex-wrap' : ''}`}>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onBlur={saveEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing();
                if (e.key === 'Escape') cancelEditing();
              }}
              className="w-full text-sm text-gray-800 font-medium border border-orange-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p
              className={`text-gray-800 font-medium break-words cursor-text hover:text-orange-600 transition-colors ${compact ? 'text-xs' : 'text-sm'}`}
              onClick={() => startEditing(task)}
              title="Click to edit"
            >
              {task.text}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`${getPriorityBadgeColor(task.priority)} rounded px-1.5 py-0.5 font-bold text-xs`}>
            {task.priority}
          </span>
          {!compact && <span className="text-gray-400 text-xs hidden sm:inline">{getStatusLabel(task.status)}</span>}
          <button
            onClick={() => setFrog(task.id)}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1 rounded-lg sm:rounded transition-all touch-manipulation flex items-center justify-center ${
              task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500 active:bg-orange-200'
            }`}
            title="Mark as frog"
          >
            <Flame className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1 rounded-lg sm:rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 active:bg-red-200 transition-all touch-manipulation flex items-center justify-center"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ['#f97316','#fbbf24','#34d399','#60a5fa','#f472b6','#a78bfa','#fb7185','#4ade80'];

function Confetti({ active, confettiKey }) {
  const particles = React.useMemo(() =>
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x: 2 + Math.random() * 96,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 7,
      delay: Math.random() * 0.9,
      dur: 1.3 + Math.random() * 0.9,
      dir: Math.random() > 0.5 ? 'l' : 'r',
      round: Math.random() > 0.45,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [confettiKey]);

  if (!active) return null;
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-14px',
            width: p.w,
            height: p.round ? p.w : p.h,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationName: `confetti-fall-${p.dir}`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: 'ease-in',
            animationFillMode: 'forwards',
          }}
        />
      ))}
    </div>
  );
}

function HelpTip({ text, className = '', id, activeId, onToggle }) {
  const showByTap = id != null && activeId === id;
  const tipRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  // Stable ref to the reposition function so event listeners always call the latest version
  const repositionRef = React.useRef(null);

  // Build the reposition function once and keep it in a ref
  React.useEffect(() => {
    repositionRef.current = () => {
      const tip = tipRef.current;
      const anchor = anchorRef.current;
      if (!tip || !anchor) return;

      tip.style.left = '';
      tip.style.right = '';
      tip.style.transform = '';
      tip.style.top = '';
      tip.style.bottom = '';

      const tipRect = tip.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const margin = 8;

      let left = anchorRect.left + anchorRect.width / 2 - tipRect.width / 2;
      if (left < margin) left = margin;
      if (left + tipRect.width > vw - margin) left = vw - margin - tipRect.width;

      tip.style.position = 'fixed';
      tip.style.left = `${left}px`;
      tip.style.transform = 'none';

      const spaceAbove = anchorRect.top;
      const tipHeight = tipRect.height;
      if (spaceAbove < tipHeight + margin + 6) {
        tip.style.bottom = '';
        tip.style.top = `${anchorRect.bottom + 6}px`;
      } else {
        tip.style.top = '';
        tip.style.bottom = `${window.innerHeight - anchorRect.top + 6}px`;
      }
    };
  });

  // Attach event-driven listeners once on mount — covers hover (desktop) and resize
  React.useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const onEnter = () => repositionRef.current?.();
    const onResize = () => repositionRef.current?.();
    anchor.addEventListener('mouseenter', onEnter);
    window.addEventListener('resize', onResize);
    return () => {
      anchor.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('resize', onResize);
    };
  }, []); // run once on mount

  // Reposition when mobile tap-to-show activates (after paint, so tip is measurable)
  React.useEffect(() => {
    if (!showByTap) return;
    const raf = requestAnimationFrame(() => repositionRef.current?.());
    return () => cancelAnimationFrame(raf);
  }, [showByTap]);

  return (
    <span
      data-help-tip
      className={`inline-flex items-center justify-center cursor-help align-middle ${className}`}
      title={text}
      aria-label={text}
    >
      <span
        ref={anchorRef}
        className="relative group inline-flex touch-manipulation min-w-[28px] min-h-[28px] sm:min-w-0 sm:min-h-0 items-center justify-center rounded-full sm:rounded-none hover:bg-slate-700/50 sm:hover:bg-transparent"
        onClick={(e) => {
          if (id != null && onToggle) {
            e.preventDefault();
            e.stopPropagation();
            onToggle(showByTap ? null : id);
          }
        }}
        role={id != null ? 'button' : undefined}
        aria-expanded={showByTap}
      >
        <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-300 flex-shrink-0 transition-colors" />
        {/* Tooltip rendered in a portal-like fixed span — positioned via useEffect above */}
        <span
          ref={tipRef}
          className={`fixed px-2.5 py-1.5 text-xs font-medium text-white bg-slate-900 border border-slate-600 rounded-lg shadow-xl whitespace-normal w-max max-w-[min(260px,90vw)] z-[200] pointer-events-none transition-opacity ${
            showByTap ? 'opacity-100 visible' : 'opacity-0 invisible sm:group-hover:opacity-100 sm:group-hover:visible'
          }`}
        >
          {text}
        </span>
      </span>
    </span>
  );
}

/* ─── Fly Bug SVG ───────────────────────────────────────────── */
function FlyBug({ baseStyle = {}, pathAnim = '', onClick, falling = false }) {
  return (
    <div
      style={{
        position: 'absolute',
        cursor: falling ? 'default' : 'pointer',
        userSelect: 'none',
        ...baseStyle,
        animation: falling ? 'bee-fall 0.88s ease-in forwards' : pathAnim,
        pointerEvents: falling ? 'none' : 'auto',
      }}
      onClick={!falling ? onClick : undefined}
      title={!falling ? 'Click to catch!' : undefined}
    >
      <svg width="20" height="18" viewBox="0 0 20 18" style={{ overflow: 'visible', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}>
        {/* Left wing */}
        <ellipse cx="6" cy="7" rx="6.5" ry="3" fill="rgba(186,230,253,0.72)" transform="rotate(-20,6,7)"
          style={{ animation: 'fly-wing-flap 0.08s linear infinite', transformOrigin: '9.5px 8px' }} />
        {/* Right wing */}
        <ellipse cx="14" cy="7" rx="6.5" ry="3" fill="rgba(186,230,253,0.72)" transform="rotate(20,14,7)"
          style={{ animation: 'fly-wing-flap 0.08s linear infinite 0.04s', transformOrigin: '10.5px 8px' }} />
        {/* Body */}
        <ellipse cx="10" cy="13.5" rx="3" ry="4" fill="#1c1917" />
        {/* Body stripes */}
        <ellipse cx="10" cy="12.5" rx="3" ry="0.9" fill="#292524" opacity="0.65" />
        <ellipse cx="10" cy="14.8" rx="3" ry="0.9" fill="#292524" opacity="0.65" />
        {/* Head */}
        <circle cx="10" cy="7" r="3.8" fill="#1c1917" />
        {/* Red compound eyes */}
        <ellipse cx="7.2" cy="5.8" rx="2" ry="1.6" fill="#dc2626" />
        <ellipse cx="12.8" cy="5.8" rx="2" ry="1.6" fill="#dc2626" />
        {/* Eye shine */}
        <circle cx="7.8"  cy="5.2" r="0.55" fill="rgba(255,255,255,0.55)" />
        <circle cx="13.4" cy="5.2" r="0.55" fill="rgba(255,255,255,0.55)" />
        {/* Left antenna */}
        <line x1="8" y1="3.3" x2="5" y2="0.5" stroke="#292524" strokeWidth="0.9" />
        <circle cx="4.8" cy="0.4" r="0.9" fill="#44403c" />
        {/* Right antenna */}
        <line x1="12" y1="3.3" x2="15" y2="0.5" stroke="#292524" strokeWidth="0.9" />
        <circle cx="15.2" cy="0.4" r="0.9" fill="#44403c" />
      </svg>
    </div>
  );
}

/* ─── Pet Frog SVG ──────────────────────────────────────────── */
function PetFrog({ state = 'idle', tongueTarget = 'none', eatTarget = 'none' }) {
  const isWorking = state === 'working';
  const isBreak   = state === 'break';
  const isDone    = state === 'done';
  const isWave    = state === 'wave';

  const bodyAnim = isDone
    ? 'frog-done-jump 0.75s ease-in-out infinite'
    : isWorking
    ? 'frog-working-hop 2.2s ease-in-out infinite'
    : isBreak
    ? 'frog-break-sway 3s ease-in-out infinite'
    : isWave
    ? 'frog-idle-bob 1.1s ease-in-out infinite'
    : 'frog-idle-bob 2.6s ease-in-out infinite';

  return (
    <svg viewBox="0 0 120 112" className="w-full h-full select-none" style={{ overflow: 'visible' }}>
      {/* Whole-frog animation wrapper */}
      <g style={{ animation: bodyAnim, transformOrigin: '60px 100px' }}>

        {/* Shadow */}
        <ellipse cx="60" cy="108" rx="28" ry="4" fill="rgba(0,0,0,0.18)" />

        {/* Left arm */}
        <path d="M 32 74 Q 18 84 22 95" stroke="#4ade80" strokeWidth="9" fill="none" strokeLinecap="round" />
        {/* Right arm — raised and waving on hover */}
        {isWave ? (
          <g style={{ transformOrigin: '88px 74px', animation: 'frog-wave-arm 0.55s ease-in-out infinite' }}>
            <path d="M 88 74 Q 102 56 106 42" stroke="#4ade80" strokeWidth="9" fill="none" strokeLinecap="round" />
            <circle cx="106" cy="42" r="7" fill="#4ade80" />
          </g>
        ) : (
          <path d="M 88 74 Q 102 84 98 95" stroke="#4ade80" strokeWidth="9" fill="none" strokeLinecap="round" />
        )}

        {/* Left foot */}
        <ellipse cx="20" cy="97" rx="11" ry="6" fill="#22c55e" transform="rotate(-18,20,97)" />
        <ellipse cx="12" cy="100" rx="5.5" ry="3.5" fill="#22c55e" />
        {/* Right foot — hidden when waving (arm is raised) */}
        {!isWave && (
          <>
            <ellipse cx="100" cy="97" rx="11" ry="6" fill="#22c55e" transform="rotate(18,100,97)" />
            <ellipse cx="108" cy="100" rx="5.5" ry="3.5" fill="#22c55e" />
          </>
        )}

        {/* Body */}
        <ellipse cx="60" cy="76" rx="36" ry="28" fill="#4ade80" />
        {/* Tummy */}
        <ellipse cx="60" cy="81" rx="21" ry="16" fill="#bbf7d0" />

        {/* Left eye bulge */}
        <ellipse cx="41" cy="50" rx="15" ry="14" fill="#4ade80" />
        {/* Right eye bulge */}
        <ellipse cx="79" cy="50" rx="15" ry="14" fill="#4ade80" />

        {/* Left eye white */}
        <circle cx="41" cy="50" r="10.5" fill="white" />
        {/* Right eye white */}
        <circle cx="79" cy="50" r="10.5" fill="white" />

        {/* Pupils + highlights — eat direction takes priority over tongue cycle */}
        {(() => {
          const eyeDir = eatTarget !== 'none' ? eatTarget : tongueTarget;
          return [
            [isWorking ? 43 : 42, isBreak ? 52 : 50, isWorking ? 6.5 : 5.5, '#0f172a'],
            [isWorking ? 81 : 80, isBreak ? 52 : 50, isWorking ? 6.5 : 5.5, '#0f172a'],
            [isWorking ? 46 : 45, isBreak ? 48 : 46, 2.5, 'white'],
            [isWorking ? 84 : 83, isBreak ? 48 : 46, 2.5, 'white'],
          ].map(([bx, by, r, fill], i) => (
            <circle key={i} cx={bx} cy={by} r={r} fill={fill}
              style={{
                transform: `translate(${eyeDir === 'left' ? -4 : eyeDir === 'right' ? 4 : 0}px, ${eyeDir !== 'none' ? -4 : 0}px)`,
                transition: 'transform 0.18s ease',
              }}
            />
          ));
        })()}

        {/* Sleepy eyelids (break) */}
        {isBreak && (
          <>
            <path d="M 31 47 Q 41 40 51 47" fill="#4ade80" />
            <path d="M 69 47 Q 79 40 89 47" fill="#4ade80" />
          </>
        )}

        {/* Nostrils */}
        <circle cx="55" cy="43" r="2.5" fill="#22c55e" />
        <circle cx="65" cy="43" r="2.5" fill="#22c55e" />

        {/* Mouth expression */}
        {(isDone || isWave) ? (
          <path d="M 43 70 Q 60 82 77 70" stroke="#15803d" strokeWidth="2.5" fill="#bbf7d0" strokeLinecap="round" />
        ) : isBreak ? (
          <path d="M 50 69 Q 60 74 70 69" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : isWorking ? (
          <path d="M 50 69 L 70 69" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M 47 69 Q 60 76 73 69" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* Working: cycling tongues — hidden while eat tongue is active */}
        {isWorking && eatTarget === 'none' && (
          <>
            {/* LEFT tongue: fires first in each 5 s cycle */}
            <g style={{ transformOrigin: '60px 67px', animation: 'frog-tongue-roll 5s ease-in-out 0s infinite backwards' }}>
              <path d="M 60 67 Q 36 46 16 26" stroke="#fb7185" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle cx="16" cy="26" r="5.5" fill="#fb7185" />
              <circle cx="14" cy="23" r="1.5" fill="rgba(255,255,255,0.55)" />
            </g>
            {/* RIGHT tongue: fires 2.5 s later — 'backwards' keeps it hidden (scale 0) during the delay */}
            <g style={{ transformOrigin: '60px 67px', animation: 'frog-tongue-roll 5s ease-in-out 2.5s infinite backwards' }}>
              <path d="M 60 67 Q 86 46 106 26" stroke="#fb7185" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle cx="106" cy="26" r="5.5" fill="#fb7185" />
              <circle cx="108" cy="23" r="1.5" fill="rgba(255,255,255,0.55)" />
            </g>
          </>
        )}

        {/* Eat tongue: one-shot snap toward clicked bee */}
        {isWorking && eatTarget !== 'none' && (
          <g style={{ transformOrigin: '60px 67px', animation: 'frog-tongue-eat 0.72s ease-in-out forwards' }}>
            <path
              d={eatTarget === 'left' ? 'M 60 67 Q 36 46 16 26' : 'M 60 67 Q 86 46 106 26'}
              stroke="#f43f5e" strokeWidth="6" fill="none" strokeLinecap="round"
            />
            <circle cx={eatTarget === 'left' ? 16 : 106} cy="26" r="6.5" fill="#f43f5e" />
            <circle cx={eatTarget === 'left' ? 14 : 108} cy="23" r="2" fill="rgba(255,255,255,0.7)" />
          </g>
        )}

        {/* Working: sweat drop */}
        {isWorking && (
          <g style={{ animation: 'frog-sweat-fall 1.4s ease-in infinite' }}>
            <path d="M 94 24 Q 96.5 30 94 36 Q 91.5 30 94 24" fill="#93c5fd" opacity="0.85" />
          </g>
        )}

        {/* Done: floating stars */}
        {isDone && (
          <>
            <text x="4"  y="34" fontSize="15" style={{ animation: 'frog-star-float 0.9s ease-in-out infinite' }}>⭐</text>
            <text x="97" y="34" fontSize="15" style={{ animation: 'frog-star-float 0.9s ease-in-out infinite 0.3s' }}>⭐</text>
            <text x="50" y="16" fontSize="12" style={{ animation: 'frog-star-float 0.7s ease-in-out infinite 0.15s' }}>✨</text>
          </>
        )}
      </g>
    </svg>
  );
}

/* ─── Header Frog (waves + speech bubble on hover) ─────────── */
function HeaderFrog() {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      className="relative flex-shrink-0 cursor-pointer w-9 h-9 sm:w-12 sm:h-12"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Speech bubble */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            background: '#22c55e',
            color: 'white',
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '20px',
            boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
            animation: 'frog-speech-pop 0.22s ease-out forwards',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          Eat me! 🐸
          {/* Tail */}
          <span style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #22c55e',
          }} />
        </div>
      )}
      <PetFrog state={hovered ? 'wave' : 'idle'} />
    </div>
  );
}

/* ─── Pomodoro Timer ────────────────────────────────────────── */
const POMO_MODES = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };

// Pool of spawn positions above the frog's head (left: <150 = left-side, ≥150 = right-side)
const BEE_SPAWNS = [
  { left: '100px', top: '10px', pathAnim: 'fly-path-1 2.4s ease-in-out infinite' },
  { left: '165px', top: '5px',  pathAnim: 'fly-path-2 3.1s ease-in-out infinite 0.9s' },
  { left: '118px', top: '7px',  pathAnim: 'fly-path-2 2.7s ease-in-out infinite 0.3s' },
  { left: '148px', top: '12px', pathAnim: 'fly-path-1 2.9s ease-in-out infinite 1.2s' },
  { left: '90px',  top: '14px', pathAnim: 'fly-path-1 2.6s ease-in-out infinite 1.6s' },
  { left: '172px', top: '9px',  pathAnim: 'fly-path-2 2.5s ease-in-out infinite 0.5s' },
  { left: '132px', top: '3px',  pathAnim: 'fly-path-1 3.0s ease-in-out infinite 0.7s' },
];
const RING_R = 54;
const RING_CIRC = 2 * Math.PI * RING_R;

function playDoneChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch (_) { /* AudioContext unavailable */ }
}

function PomodoroTimer({ onClose, frogTask }) {
  const [mode, setMode]               = React.useState('work');
  const [timeLeft, setTimeLeft]       = React.useState(POMO_MODES.work);
  const [running, setRunning]         = React.useState(false);
  const [phase, setPhase]             = React.useState('idle'); // 'idle' | 'running' | 'done'
  const [sessions, setSessions]       = React.useState(0);
  const [tongueTarget, setTongueTarget] = React.useState('none'); // 'none'|'left'|'right'
  const [bees, setBees]               = React.useState([]);
  const [eatTarget, setEatTarget]     = React.useState('none'); // 'none'|'left'|'right'
  const [frogOverride, setFrogOverride] = React.useState(null); // null|'happy'
  const intervalRef                   = React.useRef(null);
  const totalRef                      = React.useRef(POMO_MODES.work);
  const nextBeeIdRef                  = React.useRef(0);
  const eatTimerRef                   = React.useRef(null);

  // Cycle tongue direction to drive eye tracking — synced with CSS frog-tongue-roll (5 s cycle)
  React.useEffect(() => {
    const isWorkMode = running && mode === 'work';
    if (!isWorkMode) { setTongueTarget('none'); return; }

    let alive = true;
    let step = 0;
    const timers = [];

    // Recursive schedule: fires every 2.5 s matching the 2.5 s CSS delay offset
    const schedule = (delay) => {
      const t = setTimeout(() => {
        if (!alive) return;
        setTongueTarget(step % 2 === 0 ? 'left' : 'right');
        step++;
        schedule(2500);
      }, delay);
      timers.push(t);
    };

    // First fire at 650 ms = CSS 13 % lead-in of 5 s cycle
    schedule(650);

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      setTongueTarget('none');
    };
  }, [running, mode]);

  // Spawn / clear bees when entering / leaving work mode
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

  // Click a bee: it falls, frog snaps tongue, celebrates, then spawns replacements
  const handleBeeClick = (bee) => {
    if (!bee.alive || frogOverride === 'happy') return;

    setBees(prev => prev.map(b => b.id === bee.id ? { ...b, alive: false } : b));

    const dir = parseInt(bee.left) < 150 ? 'left' : 'right';
    setEatTarget(dir);

    clearTimeout(eatTimerRef.current);
    eatTimerRef.current = setTimeout(() => {
      setEatTarget('none');
      setFrogOverride('happy');

      // Remove dead bee + top up to 2 alive
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

      // Back to working after celebration
      setTimeout(() => setFrogOverride(null), 1600);
    }, 700);
  };

  // Switch mode (resets timer)
  const switchMode = (m) => {
    clearInterval(intervalRef.current);
    setMode(m);
    setTimeLeft(POMO_MODES[m]);
    totalRef.current = POMO_MODES[m];
    setRunning(false);
    setPhase('idle');
  };

  // Start / pause
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

  // Reset
  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setPhase('idle');
    setTimeLeft(POMO_MODES[mode]);
    totalRef.current = POMO_MODES[mode];
  };

  // Countdown effect
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

  // Ring progress
  const progress   = timeLeft / POMO_MODES[mode];
  const dashOffset = RING_CIRC * (1 - progress);

  // Ring color per mode
  const ringColor = mode === 'work'
    ? (phase === 'done' ? '#f97316' : '#f97316')
    : mode === 'short' ? '#34d399' : '#60a5fa';

  // Frog state (base — used for bees/container sizing)
  const frogState = phase === 'done'
    ? 'done'
    : running
    ? (mode === 'work' ? 'working' : 'break')
    : 'idle';

  // Effective frog state — happy override after eating a bee
  const effectiveFrogState = frogOverride === 'happy' ? 'done' : frogState;

  // Format time
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  // Mode labels
  const modeLabel = mode === 'work' ? 'Focus' : mode === 'short' ? 'Short Break' : 'Long Break';
  const modeEmoji = mode === 'work' ? '🍅' : mode === 'short' ? '☕' : '🌿';

  // Tomato session dots
  const tomatoCount = Math.min(sessions, 8);

  return (
    <>
      {/* Backdrop (close on click-outside) */}
      <div
        className="fixed inset-0 z-[90] md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Timer panel */}
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
            {/* Session dots */}
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
          {/* Clickable flies — only during focus work, not during happy override */}
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
              {/* Background track */}
              <circle
                cx="68" cy="68" r={RING_R}
                fill="none"
                stroke="#334155"
                strokeWidth="8"
              />
              {/* Progress arc */}
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
            {/* Time text overlay */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ pointerEvents: 'none' }}
            >
              <span
                className="font-mono font-bold text-white"
                style={{ fontSize: '2rem', lineHeight: 1, letterSpacing: '-1px' }}
              >
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

export default function EatThatFrog() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('kanban');
  const [stats, setStats] = useState({ today: 0, week: 0, frogStreak: 0 });
  const [filterFrog, setFilterFrog] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [draggedTask, setDraggedTask] = useState(null);
  const [quickAddColumn, setQuickAddColumn] = useState('todo');
  const [quickAddPriority, setQuickAddPriority] = useState('A');
  const [quickAddText, setQuickAddText] = useState('');
  const [dragOverCell, setDragOverCell] = useState(null); // { status, priority, insertBeforeTaskId?: number }
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const quickAddInputRef = React.useRef(null);
  const initialLoadDone = React.useRef(false);
  // Schedule view: 'daily' | 'weekly' | 'monthly', and the focus date (YYYY-MM-DD)
  const [scheduleRange, setScheduleRange] = useState('daily');
  const [focusDate, setFocusDate] = useState(getTodayKey());
  const [quickAddDate, setQuickAddDate] = useState(''); // YYYY-MM-DD or ''
  const [editingDateTaskId, setEditingDateTaskId] = useState(null);
  const [addTaskCell, setAddTaskCell] = useState(null); // { status, priority } when double-click add is active
  const [addTaskCellText, setAddTaskCellText] = useState('');
  const addTaskCellInputRef = React.useRef(null);
  const [settingsClearBeforeDate, setSettingsClearBeforeDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      return localStorage.getItem('frog-theme') || 'dark';
    } catch { return 'dark'; }
  });
  const importInputRef = React.useRef(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [undoState, setUndoState] = useState(null); // { tasks, stats, task, previousStatus, previousPriority, indexInCell }
  const undoTimeoutRef = React.useRef(null);
  const confettiTimerRef = React.useRef(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // show in-task confirmation instead of window.confirm
  const [expandedNotesTaskId, setExpandedNotesTaskId] = useState(null);
  const [expandedSubtasksTaskId, setExpandedSubtasksTaskId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  const [moveMenuTaskId, setMoveMenuTaskId] = useState(null);
  const [addSheetCell, setAddSheetCell] = useState(null);
  const [addSheetForm, setAddSheetForm] = useState({ text: '', status: 'todo', priority: 'A', date: '' });
  const [editSheetTaskId, setEditSheetTaskId] = useState(null);
  const [editSheetForm, setEditSheetForm] = useState({ text: '', status: 'todo', priority: 'A', scheduledDate: '', notes: '', recurrence: 'none' });
  const [mobileSelectedTaskId, setMobileSelectedTaskId] = useState(null);
  const [showGuideSection, setShowGuideSection] = useState(true);
  const [helpTooltipId, setHelpTooltipId] = useState(null);
  const [showPomodoro, setShowPomodoro] = useState(false);

  useEffect(() => {
    if (addSheetCell) setAddSheetForm({ text: '', status: addSheetCell.status, priority: addSheetCell.priority, date: '' });
  }, [addSheetCell]);

  useEffect(() => {
    if (editSheetTaskId) {
      const t = tasks.find((x) => x.id === editSheetTaskId);
      if (t) setEditSheetForm({ text: t.text, status: t.status, priority: t.priority, scheduledDate: t.scheduledDate || '', notes: t.notes || '', recurrence: t.recurrence || 'none' });
    }
  }, [editSheetTaskId]);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = () => setIsMobileView(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const statuses = ['todo', 'progress', 'done'];
  const priorities = ['A', 'B', 'C', 'D', 'E'];

  const DEFAULT_ROW_HEIGHT = 160;
  const MIN_ROW_HEIGHT = 80;
  const MAX_ROW_HEIGHT = 480;
  const [rowHeights, setRowHeights] = useState(() => {
    const defaults = { A: DEFAULT_ROW_HEIGHT, B: DEFAULT_ROW_HEIGHT, C: DEFAULT_ROW_HEIGHT, D: DEFAULT_ROW_HEIGHT, E: DEFAULT_ROW_HEIGHT };
    try {
      const raw = localStorage.getItem('frog-kanban-rowHeights');
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaults, ...parsed };
      }
    } catch (_) {}
    return defaults;
  });
  const [resizingPriority, setResizingPriority] = useState(null);
  const resizeStartYRef = React.useRef(0);
  const resizeStartHeightRef = React.useRef(0);

  // Load tasks from storage on mount (only load runs first; save is skipped until this completes)
  useEffect(() => {
    const loadData = async () => {
      try {
        const tasksResult = await storage.get('frog-tasks-kanban');
        const statsResult = await storage.get('frog-stats-kanban');

        if (tasksResult && tasksResult.value) {
          setTasks(JSON.parse(tasksResult.value));
        }
        if (statsResult && statsResult.value) {
          setStats(JSON.parse(statsResult.value));
        }
      } catch (error) {
        console.log('No saved data found, starting fresh');
      } finally {
        initialLoadDone.current = true;
      }
    };
    loadData();
  }, []);

  // Save tasks whenever they change (skip initial mount so we don't overwrite before load completes)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-tasks-kanban', JSON.stringify(tasks));
  }, [tasks]);

  // Save stats whenever they change (skip initial mount)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-stats-kanban', JSON.stringify(stats));
  }, [stats]);

  // Persist row heights (layout)
  useEffect(() => {
    try {
      localStorage.setItem('frog-kanban-rowHeights', JSON.stringify(rowHeights));
    } catch (_) {}
  }, [rowHeights]);

  // Row resize: global mouse move/up when dragging
  useEffect(() => {
    if (!resizingPriority) return;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
    const onMove = (e) => {
      const delta = e.clientY - resizeStartYRef.current;
      let next = resizeStartHeightRef.current + delta;
      next = Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, next));
      setRowHeights((prev) => ({ ...prev, [resizingPriority]: next }));
    };
    const onUp = () => {
      setResizingPriority(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [resizingPriority]);

  const handleResizeStart = (priority, e) => {
    e.preventDefault();
    setResizingPriority(priority);
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = rowHeights[priority];
  };

  // Persist theme and apply to document
  const effectiveTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;
  useEffect(() => {
    try {
      localStorage.setItem('frog-theme', theme);
    } catch (_) {}
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [theme, effectiveTheme]);

  const addTask = (text, priority, status = 'todo', scheduledDate = null) => {
    if (!text.trim()) return;

    const task = {
      id: Date.now(),
      text: text,
      priority: priority,
      status: status,
      createdAt: new Date().toISOString(),
      isFrog: false,
      scheduledDate: scheduledDate || undefined,
      notes: '',
      subtasks: [],
      recurrence: 'none',
      collapsed: false,
    };

    setTasks([task, ...tasks]);
  };

  const quickAdd = () => {
    if (!quickAddText.trim()) return;
    const date = quickAddDate && quickAddDate.trim() ? quickAddDate.trim() : null;
    addTask(quickAddText, quickAddPriority || 'A', quickAddColumn || 'todo', date);
    setQuickAddText('');
    setQuickAddDate('');
  };

  const pushUndo = (tasksSnapshot, statsSnapshot, affectedTask, previousStatus, previousPriority, indexInCell) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoState({
      tasks: JSON.parse(JSON.stringify(tasksSnapshot)),
      stats: { ...statsSnapshot },
      task: affectedTask ? { ...affectedTask } : null,
      previousStatus: previousStatus ?? null,
      previousPriority: previousPriority ?? null,
      indexInCell: indexInCell ?? 0,
    });
    undoTimeoutRef.current = setTimeout(() => { setUndoState(null); undoTimeoutRef.current = null; }, 5000);
  };

  const handleUndo = () => {
    if (!undoState) return;
    setTasks(undoState.tasks);
    setStats(undoState.stats);
    setUndoState(null);
    if (undoTimeoutRef.current) { clearTimeout(undoTimeoutRef.current); undoTimeoutRef.current = null; }
  };

  const deleteTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const cellTasks = getFilteredTasks(task.status, task.priority);
    const indexInCell = Math.max(0, cellTasks.findIndex((t) => t.id === id));
    pushUndo(tasks, stats, task, task.status, task.priority, indexInCell);
    setTasks(tasks.filter((t) => t.id !== id));
    setConfirmDeleteId(null);
    if (editingTaskId === id) {
      setEditingTaskId(null);
      setEditingText('');
    }
    if (editSheetTaskId === id) setEditSheetTaskId(null);
    if (mobileSelectedTaskId === id) setMobileSelectedTaskId(null);
  };

  const updateTask = (id, updates) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const toggleTaskCollapsed = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    updateTask(id, { collapsed: !(task.collapsed === true) });
  };

  const addSubtask = (taskId, text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const task = tasks.find((t) => t.id === taskId);
    const subtasks = Array.isArray(task.subtasks) ? [...task.subtasks] : [];
    subtasks.push({ id: Date.now(), text: trimmed, done: false });
    updateTask(taskId, { subtasks });
  };

  const toggleSubtask = (taskId, subtaskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const subtasks = (task.subtasks || []).map((s) => s.id === subtaskId ? { ...s, done: !s.done } : s);
    updateTask(taskId, { subtasks });
  };

  const removeSubtask = (taskId, subtaskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const subtasks = (task.subtasks || []).filter((s) => s.id !== subtaskId);
    updateTask(taskId, { subtasks });
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const saveEditing = () => {
    if (editingTaskId == null) return;
    const trimmed = editingText.trim();
    if (trimmed) updateTask(editingTaskId, { text: trimmed });
    setEditingTaskId(null);
    setEditingText('');
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  /** Remove tasks created before this date (YYYY-MM-DD). Keeps tasks on or after cutoff. */
  const clearTasksBeforeDate = (cutoffDate) => {
    const kept = tasks.filter((t) => (t.createdAt || '').slice(0, 10) >= cutoffDate);
    const removed = tasks.length - kept.length;
    setTasks(kept);
    return removed;
  };

  const handleClearWithConfirm = (label, cutoffDate) => {
    const toRemove = tasks.filter((t) => (t.createdAt || '').slice(0, 10) < cutoffDate).length;
    if (toRemove === 0) {
      window.alert('No tasks found before that date.');
      return;
    }
    if (!window.confirm(`Remove ${toRemove} task(s) created before ${label}? This cannot be undone.`)) return;
    clearTasksBeforeDate(cutoffDate);
    window.alert(`Removed ${toRemove} task(s).`);
  };

  const handleExport = () => {
    const data = { tasks, stats, exportedAt: new Date().toISOString(), app: 'EatThatFrog' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eat-that-frog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (replace, data) => {
    try {
      const importedTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const importedStats = data.stats && typeof data.stats === 'object'
        ? { today: Number(data.stats.today) || 0, week: Number(data.stats.week) || 0, frogStreak: Number(data.stats.frogStreak) || 0 }
        : { today: 0, week: 0, frogStreak: 0 };
      if (replace) {
        setTasks(importedTasks);
        setStats(importedStats);
        window.alert(`Imported ${importedTasks.length} task(s). Replaced all data.`);
      } else {
        setTasks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const merged = [...prev];
          importedTasks.forEach((t) => {
            if (!existingIds.has(t.id)) {
              existingIds.add(t.id);
              merged.push(t);
            } else {
              merged.push({ ...t, id: Date.now() + Math.random() });
            }
          });
          return merged;
        });
        setStats((prev) => ({
          today: prev.today + importedStats.today,
          week: prev.week + importedStats.week,
          frogStreak: prev.frogStreak + importedStats.frogStreak,
        }));
        window.alert(`Merged ${importedTasks.length} task(s). Stats added together.`);
      }
    } catch (e) {
      window.alert('Invalid file. Use a JSON backup from this app.');
    }
  };

  const handleResetStats = () => {
    if (!window.confirm('Reset all stats (Completed Today, This Week, Frogs Eaten) to zero? Tasks are not affected.')) return;
    setStats({ today: 0, week: 0, frogStreak: 0 });
    window.alert('Stats reset.');
  };

  const setFrog = (id) => {
    setTasks(
      tasks.map((t) => ({
        ...t,
        isFrog: t.id === id ? !t.isFrog : false,
      }))
    );
  };

  const moveTask = (taskId, newStatus, newPriority) => {
    const task = tasks.find((t) => t.id === taskId);
    const wasNotDone = task.status !== 'done';
    const cellTasks = getFilteredTasks(task.status, task.priority);
    const indexInCell = Math.max(0, cellTasks.findIndex((t) => t.id === taskId));
    pushUndo(tasks, stats, task, task.status, task.priority, indexInCell);

    setTasks((prev) => {
      let next = prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus !== undefined ? newStatus : t.status,
              priority: newPriority !== undefined ? newPriority : t.priority,
              completedAt: newStatus === 'done' && wasNotDone ? new Date().toISOString() : t.completedAt,
            }
          : t
      );
      if (newStatus === 'done' && wasNotDone && task.recurrence && task.recurrence !== 'none') {
        const from = (task.scheduledDate || (task.createdAt || '').slice(0, 10));
        const nextDate = getNextRecurrenceDate(task.recurrence, from);
        if (nextDate) {
          const copy = {
            ...task,
            id: Date.now(),
            status: 'todo',
            createdAt: new Date().toISOString(),
            completedAt: undefined,
            scheduledDate: nextDate,
            isFrog: false,
          };
          next = [copy, ...next];
        }
      }
      return next;
    });

    if (newStatus === 'done' && wasNotDone) {
      const today = new Date().toDateString();
      const taskDate = new Date(task.createdAt).toDateString();
      setStats((prev) => ({
        ...prev,
        today: taskDate === today ? prev.today + 1 : prev.today,
        week: prev.week + 1,
        frogStreak: task.isFrog ? prev.frogStreak + 1 : prev.frogStreak,
      }));
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    setConfettiKey((k) => k + 1);
    setConfettiActive(true);
    confettiTimerRef.current = setTimeout(() => {
      setConfettiActive(false);
      confettiTimerRef.current = null;
    }, 2600);
  };

  const getDateStatus = (task) => {
    if (!task.scheduledDate || task.status === 'done') return null;
    // Use new Date(year, month, day) for both sides — always local-timezone midnight,
    // immune to the UTC-vs-local ambiguity of ISO date-string and toDateString() parsing.
    const now = new Date();
    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const [y, m, d] = task.scheduledDate.split('-').map(Number);
    const scheduledMs = new Date(y, m - 1, d).getTime();
    if (scheduledMs < todayMs) return 'overdue';
    if (scheduledMs === todayMs) return 'today';
    return null;
  };

  const getRowProgress = (priority) => {
    const all = tasks.filter((t) => t.priority === priority);
    if (all.length === 0) return null;
    const done = all.filter((t) => t.status === 'done').length;
    return { done, total: all.length, pct: Math.round((done / all.length) * 100) };
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e, status, priority) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Derive insert position from cursor's vertical position relative to each card
    const cards = Array.from(e.currentTarget.querySelectorAll('[data-task-id]'))
      .filter((el) => Number(el.dataset.taskId) !== draggedTask?.id);
    let insertBeforeTaskId = null; // null → append at end
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        insertBeforeTaskId = Number(card.dataset.taskId);
        break;
      }
    }
    setDragOverCell({ status, priority, insertBeforeTaskId });
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.relatedTarget && e.currentTarget?.contains(e.relatedTarget)) return;
    setDragOverCell(null);
  };

  const reorderTaskInCell = (taskId, status, priority, insertBeforeTaskId) => {
    // Always operate on ALL tasks in the cell so filters never corrupt hidden tasks.
    // insertBeforeTaskId = number → insert before that task
    // insertBeforeTaskId = null  → append at end
    setTasks((prev) => {
      const cellTasks = prev.filter((t) => t.status === status && t.priority === priority);
      const fromIdx = cellTasks.findIndex((t) => t.id === taskId);
      if (fromIdx === -1) return prev;
      const newCellOrder = [...cellTasks];
      const [removed] = newCellOrder.splice(fromIdx, 1);
      if (insertBeforeTaskId == null) {
        newCellOrder.push(removed);
      } else {
        const toIdx = newCellOrder.findIndex((t) => t.id === insertBeforeTaskId);
        if (toIdx === -1) newCellOrder.push(removed);
        else newCellOrder.splice(toIdx, 0, removed);
      }
      let j = 0;
      return prev.map((t) => {
        if (t.status !== status || t.priority !== priority) return t;
        return newCellOrder[j++];
      });
    });
  };

  const handleDrop = (e, status, priority) => {
    e.preventDefault();
    e.stopPropagation();
    const cell = dragOverCell;
    setDragOverCell(null);
    if (draggedTask) {
      const sameCell = draggedTask.status === status && draggedTask.priority === priority;
      if (sameCell) {
        const insertBeforeTaskId = cell?.insertBeforeTaskId ?? null;
        // Skip no-op: dropping immediately before itself leaves order unchanged
        if (insertBeforeTaskId !== draggedTask.id) {
          reorderTaskInCell(draggedTask.id, status, priority, insertBeforeTaskId);
        }
      } else {
        moveTask(draggedTask.id, status, priority);
      }
      setDraggedTask(null);
    }
  };

  // Focus quick-add when pressing "n" or "/" (unless typing in an input)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '?') {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowShortcuts((s) => !s);
        }
        return;
      }
      if (e.key !== 'n' && e.key !== '/') return;
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      quickAddInputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus inline add-task input when a cell is selected for add
  useEffect(() => {
    if (addTaskCell) {
      setAddTaskCellText('');
      addTaskCellInputRef.current?.focus();
    }
  }, [addTaskCell]);

  const handleAddTaskInCell = (status, priority) => {
    const text = addTaskCellText.trim();
    if (text) {
      addTask(text, priority, status);
    }
    setAddTaskCellText('');
    setAddTaskCell((prev) => (prev?.status === status && prev?.priority === priority ? null : prev));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      A: 'bg-red-50 border-red-300',
      B: 'bg-orange-50 border-orange-300',
      C: 'bg-yellow-50 border-yellow-300',
      D: 'bg-blue-50 border-blue-300',
      E: 'bg-gray-50 border-gray-300',
    };
    return colors[priority] || colors['C'];
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      A: 'bg-red-500 text-white',
      B: 'bg-orange-500 text-white',
      C: 'bg-yellow-500 text-white',
      D: 'bg-blue-500 text-white',
      E: 'bg-gray-500 text-white',
    };
    return colors[priority] || colors['C'];
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      A: 'Must Do',
      B: 'Should Do',
      C: 'Nice to Do',
      D: 'Delegate',
      E: 'Eliminate',
    };
    return labels[priority];
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: 'To Do',
      progress: 'In Progress',
      done: 'Done',
    };
    return labels[status];
  };

  const searchLower = searchQuery.trim().toLowerCase();
  const taskMatchesSearch = (t) => !searchLower || (t.text && t.text.toLowerCase().includes(searchLower));

  const getFilteredTasks = (status, priority) => {
    return tasks.filter((t) => {
      const statusMatch = t.status === status;
      const priorityMatch = t.priority === priority;
      const frogMatch = !filterFrog || t.isFrog;
      const priorityFilterMatch = filterPriority === 'all' || t.priority === filterPriority;
      const searchMatch = taskMatchesSearch(t);

      return statusMatch && priorityMatch && frogMatch && priorityFilterMatch && searchMatch;
    });
  };

  const todaysFrog = tasks.find((t) => t.isFrog && t.status !== 'done');

  const todayKey = getTodayKey();

  // Tasks with a scheduled date (for schedule views); respect search when set
  const tasksWithDate = tasks.filter((t) => t.scheduledDate && taskMatchesSearch(t));
  const getTasksForDate = (dateKey) =>
    tasksWithDate.filter((t) => t.scheduledDate === dateKey);
  const getOverdueTasks = () =>
    tasksWithDate.filter(
      (t) => t.scheduledDate < todayKey && t.status !== 'done'
    );
  const getTasksForWeek = (weekStartKey) =>
    tasksWithDate.filter((t) => isInWeek(t.scheduledDate, weekStartKey));
  const getTasksForMonth = (monthStartKey) =>
    tasksWithDate.filter((t) => isInMonth(t.scheduledDate, monthStartKey));

  const goToToday = () => setFocusDate(getTodayKey());
  const isViewingToday = focusDate === todayKey;
  const isViewingThisWeek = scheduleRange === 'weekly' && getWeekStart(focusDate) === getWeekStart(todayKey);
  const isViewingThisMonth = scheduleRange === 'monthly' && getMonthStart(focusDate) === getMonthStart(todayKey);

  return (
    <>
    <Confetti active={confettiActive} confettiKey={confettiKey} />
    <div className={`min-h-screen font-sans theme-root pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:pt-[max(1.5rem,env(safe-area-inset-top))] md:pr-[max(1.5rem,env(safe-area-inset-right))] md:pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pl-[max(1.5rem,env(safe-area-inset-left))] ${effectiveTheme === 'light' ? 'theme-light bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .theme-root.theme-light .text-white { color: #1e293b; }
        .theme-root.theme-light .text-gray-400 { color: #64748b; }
        .theme-root.theme-light .text-gray-300 { color: #475569; }
        .theme-root.theme-light .text-gray-500 { color: #64748b; }
        .theme-root.theme-light .bg-slate-800 { background-color: #e2e8f0; }
        .theme-root.theme-light .bg-slate-700 { background-color: #cbd5e1; }
        .theme-root.theme-light .border-slate-600 { border-color: #94a3b8; }
        .theme-root.theme-light .text-gray-800 { color: #1e293b; }
        .theme-root.theme-light .text-red-400 { color: #dc2626; }
        .theme-root.theme-light .text-amber-200 { color: #b45309; }
        .theme-root.theme-light .bg-amber-900\\/30 { background-color: rgba(251 191 36 / 0.2); }
        .theme-root.theme-light .border-amber-600\\/50 { border-color: rgba(217 119 6 / 0.5); }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 146, 60, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(251, 146, 60, 0.6);
          }
        }

        .task-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }

        .task-card.dragging {
          opacity: 0.5;
        }

        .kanban-column {
          transition: background-color 0.2s ease;
        }

        .kanban-column.drag-over {
          background-color: rgba(251, 146, 60, 0.1);
        }

        .kanban-resize-handle {
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .kanban-resize-handle:hover {
          box-shadow: 0 0 0 1px rgba(251, 146, 60, 0.3);
        }
        .kanban-resize-handle.active {
          background-color: rgba(251, 146, 60, 0.9);
          box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.5);
        }
        .kanban-resize-handle .grip-line {
          width: 20px;
          height: 2px;
          border-radius: 1px;
          background-color: currentColor;
          opacity: 0.5;
        }
        .kanban-resize-handle:hover .grip-line,
        .kanban-resize-handle.active .grip-line {
          opacity: 0.9;
        }

        .frog-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6 animate-[slideIn_0.4s_ease-out]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <HeaderFrog />
              <div className="min-w-0">
                <h1
                  className="text-2xl sm:text-4xl md:text-5xl font-bold text-white truncate"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}
                >
                  EAT THAT FROG
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">ABCDE Priority Matrix • Kanban Board</p>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                  view === 'kanban' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Layout className="w-4 h-4 inline mr-1.5" />
                Board
              </button>
              <button
                onClick={() => { setView('schedule'); setFocusDate(getTodayKey()); }}
                className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                  view === 'schedule' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1.5" />
                Schedule
              </button>
              <button
                onClick={() => setView('analytics')}
                className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                  view === 'analytics' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1.5" />
                Analytics
              </button>
              <button
                onClick={() => setView('about')}
                className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                  view === 'about' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1.5" />
                About
              </button>
              <button
                onClick={() => setView('settings')}
                className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                  view === 'settings' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1.5" />
                Settings
              </button>
              <button
                onClick={() => setShowShortcuts((s) => !s)}
                className="p-2 rounded-lg transition-all bg-slate-700 text-gray-300 hover:bg-slate-600"
                title="Keyboard shortcuts (?)"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowPomodoro((s) => !s)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                  showPomodoro ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
                title="Pomodoro Timer"
              >
                <Timer className="w-4 h-4" />
                <span className="hidden lg:inline">Timer</span>
              </button>
            </div>

            {/* Mobile: hamburger (min 44px touch target) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500 transition-colors touch-manipulation"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm animate-[slideIn_0.2s_ease-out]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        <div
          className={`fixed top-0 right-0 z-40 w-full max-w-[280px] h-full bg-slate-800 border-l border-slate-600 shadow-2xl transform transition-transform duration-200 ease-out md:hidden pt-[calc(1rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-600">
            <span className="text-gray-400 font-medium text-sm">Menu</span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-3 space-y-1">
            {[
              { id: 'kanban', label: 'Board', icon: Layout },
              { id: 'schedule', label: 'Schedule', icon: Calendar, onSelect: () => setFocusDate(getTodayKey()) },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'about', label: 'About', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon, onSelect }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setView(id);
                  onSelect?.();
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium transition-colors touch-manipulation min-h-[44px] ${
                  view === id ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-slate-700 active:bg-slate-600'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setShowShortcuts(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium text-gray-300 hover:bg-slate-700 active:bg-slate-600 transition-colors touch-manipulation min-h-[44px]"
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              Shortcuts
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPomodoro((s) => !s);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium transition-colors touch-manipulation min-h-[44px] ${
                showPomodoro ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-slate-700 active:bg-slate-600'
              }`}
            >
              <Timer className="w-5 h-5 flex-shrink-0" />
              Focus Timer
            </button>
          </nav>
        </div>

        {/* Keyboard shortcuts modal */}
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={() => setShowShortcuts(false)}>
            <div className="bg-slate-800 rounded-t-2xl sm:rounded-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-600 sm:border-t" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Keyboard shortcuts</h3>
                <button onClick={() => setShowShortcuts(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation -mr-2" aria-label="Close">×</button>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">N</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">/</kbd> — Focus quick-add</li>
                <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">?</kbd> — This panel</li>
                <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Enter</kbd> — Save / add task</li>
                <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Escape</kbd> — Cancel edit / close</li>
              </ul>
            </div>
          </div>
        )}

        {/* Move task bottom sheet (mobile) */}
        {moveMenuTaskId && (() => {
          const moveTaskObj = tasks.find((t) => t.id === moveMenuTaskId);
          if (!moveTaskObj) return null;
          return (
            <>
              <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMoveMenuTaskId(null)} aria-hidden="true" />
              <div
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-800 rounded-t-2xl shadow-2xl border border-slate-600 border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto"
                role="dialog"
                aria-label="Move task to column"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Move task</p>
                    <p className="text-white font-medium truncate">{moveTaskObj.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMoveMenuTaskId(null)}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            moveTask(moveTaskObj.id, s, moveTaskObj.priority);
                            setMoveMenuTaskId(null);
                          }}
                          className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${
                            moveTaskObj.status === s
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'
                          }`}
                        >
                          {getStatusLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2">Priority</p>
                    <div className="flex flex-wrap gap-2">
                      {priorities.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            moveTask(moveTaskObj.id, moveTaskObj.status, p);
                            setMoveMenuTaskId(null);
                          }}
                          className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold transition-colors touch-manipulation ${getPriorityBadgeColor(p)} ${
                            moveTaskObj.priority === p ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-90 hover:opacity-100 active:opacity-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-3">Tap a status or priority to move. Tap again to change the other.</p>
              </div>
            </>
          );
        })()}

        {/* Add Task bottom sheet (mobile) */}
        {addSheetCell && (
          <>
            <div className="fixed inset-0 z-40 md:hidden bg-black/50" onClick={() => setAddSheetCell(null)} aria-hidden="true" />
            <div
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-800 rounded-t-2xl shadow-2xl border border-slate-600 border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto"
              role="dialog"
              aria-label="Add task"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">New task</h2>
                <button type="button" onClick={() => setAddSheetCell(null)} className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-1.5">Task name</label>
                  <input
                    type="text"
                    value={addSheetForm.text}
                    onChange={(e) => setAddSheetForm((f) => ({ ...f, text: e.target.value }))}
                    placeholder="What do you need to do?"
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-base min-h-[48px] touch-manipulation"
                    autoFocus
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAddSheetForm((f) => ({ ...f, status: s }))}
                        className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${
                          addSheetForm.status === s ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'
                        }`}
                      >
                        {getStatusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-2">Priority</p>
                  <div className="flex flex-wrap gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAddSheetForm((f) => ({ ...f, priority: p }))}
                        className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold transition-colors touch-manipulation ${getPriorityBadgeColor(p)} ${
                          addSheetForm.priority === p ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-1.5">Schedule (optional)</label>
                  <input
                    type="date"
                    value={addSheetForm.date}
                    onChange={(e) => setAddSheetForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none min-h-[48px] touch-manipulation"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = addSheetForm.text.trim();
                    if (text) {
                      addTask(text, addSheetForm.priority, addSheetForm.status, addSheetForm.date || null);
                      setAddSheetCell(null);
                    }
                  }}
                  disabled={!addSheetForm.text.trim()}
                  className="w-full min-h-[52px] rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                >
                  Add task
                </button>
              </div>
            </div>
          </>
        )}

        {/* Edit Task bottom sheet (mobile) */}
        {editSheetTaskId && (() => {
          const editTask = tasks.find((t) => t.id === editSheetTaskId);
          if (!editTask) return null;
          return (
            <>
              <div className="fixed inset-0 z-40 md:hidden bg-black/50" onClick={() => setEditSheetTaskId(null)} aria-hidden="true" />
              <div
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-800 rounded-t-2xl shadow-2xl border border-slate-600 border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto"
                role="dialog"
                aria-label="Edit task"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Edit task</h2>
                  <button type="button" onClick={() => setEditSheetTaskId(null)} className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation" aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">Task name</label>
                    <input
                      type="text"
                      value={editSheetForm.text}
                      onChange={(e) => setEditSheetForm((f) => ({ ...f, text: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-base min-h-[48px] touch-manipulation"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditSheetForm((f) => ({ ...f, status: s }))}
                          className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${
                            editSheetForm.status === s ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'
                          }`}
                        >
                          {getStatusLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2">Priority</p>
                    <div className="flex flex-wrap gap-2">
                      {priorities.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditSheetForm((f) => ({ ...f, priority: p }))}
                          className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold transition-colors touch-manipulation ${getPriorityBadgeColor(p)} ${
                            editSheetForm.priority === p ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-90 hover:opacity-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">Schedule</label>
                    <input
                      type="date"
                      value={editSheetForm.scheduledDate}
                      onChange={(e) => setEditSheetForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none min-h-[48px] touch-manipulation"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">Notes</label>
                    <textarea
                      value={editSheetForm.notes}
                      onChange={(e) => setEditSheetForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Add notes..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none resize-y min-h-[80px] touch-manipulation"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">Checklist</label>
                    <div className="space-y-2">
                      {(editTask.subtasks || []).map((st) => (
                        <div key={st.id} className="flex items-center gap-2">
                          <input type="checkbox" checked={!!st.done} onChange={() => toggleSubtask(editSheetTaskId, st.id)} className="rounded w-5 h-5 touch-manipulation" />
                          <span className={`flex-1 text-sm ${st.done ? 'line-through text-gray-500' : 'text-white'}`}>{st.text}</span>
                          <button type="button" onClick={() => removeSubtask(editSheetTaskId, st.id)} className="p-2 text-red-400 hover:text-red-300 touch-manipulation" aria-label="Remove">×</button>
                        </div>
                      ))}
                      <form onSubmit={(e) => { e.preventDefault(); const input = e.target.querySelector('input'); if (input?.value.trim()) { addSubtask(editSheetTaskId, input.value); input.value = ''; } }} className="flex gap-2">
                        <input type="text" placeholder="Add step..." className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] touch-manipulation" />
                        <button type="submit" className="px-4 py-2 rounded-lg bg-slate-600 text-white text-sm font-medium touch-manipulation">Add</button>
                      </form>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">Repeat</label>
                    <select
                      value={editSheetForm.recurrence}
                      onChange={(e) => setEditSheetForm((f) => ({ ...f, recurrence: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none min-h-[48px] touch-manipulation"
                    >
                      <option value="none">No repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const wasNotDone = editTask.status !== 'done';
                        updateTask(editSheetTaskId, {
                          text: editSheetForm.text.trim() || editTask.text,
                          status: editSheetForm.status,
                          priority: editSheetForm.priority,
                          scheduledDate: editSheetForm.scheduledDate || undefined,
                          notes: editSheetForm.notes,
                          recurrence: editSheetForm.recurrence,
                          ...(editSheetForm.status === 'done' && wasNotDone ? { completedAt: new Date().toISOString() } : {}),
                        });
                        if (wasNotDone && editSheetForm.status === 'done') {
                          const taskDate = new Date(editTask.createdAt).toDateString();
                          const today = new Date().toDateString();
                          setStats((prev) => ({ ...prev, today: taskDate === today ? prev.today + 1 : prev.today, week: prev.week + 1, frogStreak: editTask.isFrog ? prev.frogStreak + 1 : prev.frogStreak }));
                          triggerConfetti();
                        }
                        setEditSheetTaskId(null);
                        if (editingTaskId === editSheetTaskId) { setEditingTaskId(null); setEditingText(''); }
                      }}
                      className="flex-1 min-h-[52px] rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { deleteTask(editSheetTaskId); setEditSheetTaskId(null); }}
                      className="min-h-[52px] px-4 rounded-xl bg-red-900/50 text-red-200 font-semibold hover:bg-red-800/50 active:bg-red-700/50 transition-colors touch-manipulation"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {view === 'kanban' ? (
          <div
            onClick={(e) => {
              if (helpTooltipId != null && !e.target.closest('[data-help-tip]')) setHelpTooltipId(null);
            }}
          >
            {/* Quick guide section */}
            {showGuideSection && (
              <div className="mb-4 md:mb-5 rounded-xl bg-slate-800/90 border border-slate-600/80 p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-gray-300 text-sm font-medium shrink-0 flex items-center gap-1.5">
                    Quick guide
                    <HelpTip id="guide" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="This short guide explains how to use the board. Dismiss with Got it when you're familiar." />
                  </span>
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Add tasks with the bar below. Rows = priority (A→E), columns = status. Drag to move; mark one task with the flame as your frog for the day.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuideSection(false)}
                  className="shrink-0 text-xs font-semibold text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors touch-manipulation min-h-[36px]"
                  aria-label="Dismiss guide"
                >
                  Got it
                </button>
              </div>
            )}

            {/* Today's Frog Banner */}
            {todaysFrog && (
              <div className="mb-4 md:mb-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 sm:p-6 text-white shadow-2xl frog-glow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <Flame className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold opacity-90 uppercase tracking-wider">
                        Today&apos;s Frog
                      </div>
                      <div className="text-lg sm:text-2xl font-bold break-words">{todaysFrog.text}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 rounded-lg text-xs sm:text-sm font-bold">
                      Priority {todaysFrog.priority}
                    </span>
                    <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 rounded-lg text-xs sm:text-sm font-bold">
                      {getStatusLabel(todaysFrog.status)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Filters + Search */}
            <div className="mb-4 md:mb-6 bg-slate-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 order-2 sm:order-1">
                <Filter className="w-5 h-5 text-gray-400 flex-shrink-0 hidden sm:block" />
                <HelpTip id="filters" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="Filter by Frogs only (today's priority task) or by priority (A–E). Search matches task text." />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterFrog(!filterFrog)}
                    className={`min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:py-1 rounded-xl sm:rounded-lg text-sm font-semibold transition-all touch-manipulation ${
                      filterFrog ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'
                    }`}
                  >
                    <Flame className="w-4 h-4 inline mr-1.5" />
                    Frogs
                  </button>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:py-1 bg-slate-700 text-gray-300 rounded-xl sm:rounded-lg text-sm font-semibold border-none focus:outline-none focus:ring-2 focus:ring-orange-500 touch-manipulation"
                  >
                    <option value="all">All</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
              </div>
              <div className="relative flex-1 min-w-0 order-1 sm:order-2 sm:min-w-[200px] sm:max-w-sm sm:ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-10 py-2.5 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg touch-manipulation"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            {searchQuery && (
              <p className="text-gray-400 text-xs mb-4 -mt-2">Showing tasks matching &quot;{searchQuery}&quot;</p>
            )}

            {/* Quick Add Bar */}
            <div className="mb-4 md:mb-6 bg-slate-800 rounded-xl p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <input
                    ref={quickAddInputRef}
                    type="text"
                    value={quickAddText}
                    onChange={(e) => setQuickAddText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
                    placeholder="Quick add task..."
                    className="flex-1 min-w-0 px-4 py-3 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-base sm:text-sm min-h-[48px] sm:min-h-0 touch-manipulation"
                  />
                  <HelpTip id="quickadd" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="Type a task name, set priority and status, then press Enter or click + to add. Optional date schedules the task for a specific day." className="shrink-0" />
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                  <select
                    value={quickAddPriority || ''}
                    onChange={(e) => setQuickAddPriority(e.target.value)}
                    className="flex-1 sm:flex-none min-w-0 px-3 py-2.5 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
                  >
                    <option value="">Priority</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                  <select
                    value={quickAddColumn || ''}
                    onChange={(e) => setQuickAddColumn(e.target.value)}
                    className="flex-1 sm:flex-none min-w-0 px-3 py-2.5 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
                  >
                    <option value="">Status</option>
                    <option value="todo">To Do</option>
                    <option value="progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <input
                    type="date"
                    value={quickAddDate}
                    onChange={(e) => setQuickAddDate(e.target.value)}
                    className="flex-1 sm:flex-none min-w-0 px-3 py-2.5 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] sm:min-h-0 touch-manipulation sm:min-w-[140px]"
                    title="Optional: schedule for a specific day"
                  />
                  <button
                    onClick={quickAdd}
                    className="flex items-center justify-center min-h-[48px] sm:min-h-0 px-5 py-2.5 sm:py-2 bg-orange-500 text-white rounded-xl sm:rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-semibold touch-manipulation shrink-0"
                  >
                    <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Empty state */}
            {tasks.length === 0 && (
              <div className="mb-6 bg-slate-800/80 rounded-xl p-12 text-center border-2 border-dashed border-slate-600">
                <p className="text-gray-400 text-lg mb-2">No tasks yet</p>
                <p className="text-gray-500 text-sm mb-4">Add one above with priority and status, or press <kbd className="px-2 py-0.5 bg-slate-700 rounded text-gray-300">N</kbd> or <kbd className="px-2 py-0.5 bg-slate-700 rounded text-gray-300">/</kbd> to focus the quick-add field.</p>
                <p className="text-gray-500 text-sm">Mark your most important task with the flame icon — that&apos;s your frog for the day.</p>
              </div>
            )}

            {/* Kanban Matrix */}
            <div
              className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 overflow-y-visible touch-pan-x"
              onClick={(e) => {
                if (isMobileView && mobileSelectedTaskId && !e.target.closest('.task-card')) setMobileSelectedTaskId(null);
              }}
            >
              <div className="inline-flex gap-1 min-w-full">
                {/* Header Column for Priority Labels */}
                <div className="w-20 sm:w-28 md:w-32 flex-shrink-0">
                  <div className="h-12 sm:h-14 bg-slate-800 rounded-t-lg mb-1 flex items-center justify-center gap-1">
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Priority</span>
                    <HelpTip id="priority" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="Rows are priority: A = Must do, B = Should do, C = Nice to do, D = Delegate, E = Eliminate. Put your most important tasks in row A." />
                  </div>
                  {priorities.map((priority) => (
                    <React.Fragment key={priority}>
                      <div
                        style={{ height: rowHeights[priority] }}
                        className="bg-slate-800 rounded-lg mb-0 flex items-center justify-center flex-shrink-0"
                      >
                        <div className="text-center px-0.5 w-full">
                          <div
                            className={`text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 ${getPriorityBadgeColor(priority)} w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mx-auto`}
                          >
                            {priority}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-400 font-semibold leading-tight">{getPriorityLabel(priority)}</div>
                          {(() => {
                            const prog = getRowProgress(priority);
                            if (!prog) return null;
                            return (
                              <div className="mt-1.5 px-1" title={`${prog.done} / ${prog.total} done`}>
                                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${prog.pct}%`,
                                      background: prog.pct === 100 ? '#34d399' : prog.pct >= 50 ? '#f97316' : '#64748b',
                                    }}
                                  />
                                </div>
                                <div className="text-[9px] text-gray-500 mt-0.5">{prog.done}/{prog.total}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div
                        role="separator"
                        aria-label={`Resize row ${priority}`}
                        onMouseDown={(e) => handleResizeStart(priority, e)}
                        className={`kanban-resize-handle hidden md:flex flex-shrink-0 cursor-ns-resize flex-col items-center justify-center gap-0.5 py-1.5 mb-1 rounded-md select-none ${resizingPriority === priority ? 'active bg-orange-500 text-white' : 'bg-slate-700/80 hover:bg-slate-600 text-slate-400'}`}
                        title="Drag to resize row"
                      >
                        <span className="grip-line" />
                        <span className="grip-line" />
                        <span className="grip-line" />
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {/* Status Columns */}
                {statuses.map((status, idx) => (
                  <div key={status} className="flex-1 min-w-[200px] sm:min-w-[240px] md:min-w-[280px]">
                    <div className="h-14 bg-slate-800 rounded-t-lg mb-1 flex items-center justify-center gap-1">
                      <div className="text-center">
                        <div className="text-white font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-1">
                          {getStatusLabel(status)}
                          {idx === 0 && (
                            <HelpTip id="status" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="Columns are status: To Do → In Progress → Done. Drag tasks between columns to update their status." />
                          )}
                        </div>
                      </div>
                    </div>

                    {priorities.map((priority) => {
                      const cellTasks = getFilteredTasks(status, priority);
                      const count = cellTasks.length;

                      return (
                        <React.Fragment key={`${status}-${priority}`}>
                        <div
                          style={{ height: rowHeights[priority] }}
                          className={`kanban-column group ${getPriorityColor(priority)} border-2 rounded-lg mb-0 p-2 overflow-y-auto flex-shrink-0 ${
                            dragOverCell?.status === status && dragOverCell?.priority === priority ? 'drag-over' : ''
                          } ${addTaskCell?.status === status && addTaskCell?.priority === priority ? 'ring-2 ring-orange-500 ring-inset' : ''}`}
                          onDragOver={(e) => handleDragOver(e, status, priority)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, status, priority)}
                          onDoubleClick={(e) => {
                            if (!e.target.closest('.task-card') && !e.target.closest('.cell-add-btn')) {
                              if (isMobileView) setAddSheetCell({ status, priority });
                              else setAddTaskCell({ status, priority });
                            }
                          }}
                          title="Double-click to add a task here"
                        >
                          {/* Visible "Add task" button for mobile (single-tap); double-click still works on desktop */}
                          {addTaskCell?.status !== status || addTaskCell?.priority !== priority ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isMobileView) setAddSheetCell({ status, priority });
                                else setAddTaskCell({ status, priority });
                              }}
                              className="cell-add-btn w-full flex items-center justify-center gap-1.5 py-2.5 px-2 mb-2 rounded-lg border-2 border-dashed border-slate-400 text-slate-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-500/10 active:bg-orange-500/20 transition-colors text-sm font-medium min-h-[44px] md:min-h-0 md:py-1.5 touch-manipulation"
                              title="Add task in this cell (or double-tap empty area)"
                            >
                              <Plus className="w-4 h-4 flex-shrink-0" />
                              <span>Add task</span>
                            </button>
                          ) : null}
                          {addTaskCell?.status === status && addTaskCell?.priority === priority && (
                            <div className="mb-2">
                              <input
                                ref={addTaskCellInputRef}
                                type="text"
                                value={addTaskCellText}
                                onChange={(e) => setAddTaskCellText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddTaskInCell(status, priority);
                                  if (e.key === 'Escape') { setAddTaskCell(null); setAddTaskCellText(''); }
                                }}
                                onBlur={() => handleAddTaskInCell(status, priority)}
                                placeholder={`New task (${getStatusLabel(status)}, ${priority})`}
                                className="w-full text-sm px-3 py-2 bg-white border-2 border-orange-500 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                            </div>
                          )}
                          {count > 0 && (
                            <div className="flex justify-end mb-1">
                              <span className="text-xs px-2 py-0.5 bg-slate-800 text-white rounded-full font-bold">
                                {count}
                              </span>
                            </div>
                          )}

                          <div className="space-y-2">
                            {(() => {
                              const showGhost = undoState?.task && undoState.previousStatus === status && undoState.previousPriority === priority;
                              const ghostIndex = showGhost ? (undoState.indexInCell ?? 0) : -1;
                              const itemsToRender = showGhost
                                ? [...cellTasks.slice(0, ghostIndex), { __ghost: true, key: `ghost-${undoState.task.id}` }, ...cellTasks.slice(ghostIndex)]
                                : cellTasks.map((t) => ({ ...t, __ghost: false, key: t.id }));
                              return itemsToRender.map((item) => {
                                if (item.__ghost) {
                                  return (
                                    <div
                                      key={item.key}
                                      className="task-card bg-white rounded-lg shadow-md p-3 opacity-50 hover:opacity-90 transition-opacity group border border-dashed border-gray-400 pointer-events-auto cursor-default"
                                      style={{ minHeight: '52px' }}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm text-gray-700 font-medium truncate flex-1">{undoState.task.text}</p>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-opacity"
                                        >
                                          <Undo2 className="w-3.5 h-3.5" /> Undo
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                                const task = item;
                                const inSameCell = dragOverCell?.status === status && dragOverCell?.priority === priority;
                                const showDropBefore = !isMobileView && inSameCell && dragOverCell?.insertBeforeTaskId === task.id;
                                return (
                              <React.Fragment key={task.id}>
                                {showDropBefore && (
                                  <div className="h-1 rounded-full bg-orange-500 opacity-90 flex-shrink-0 min-h-[8px]" aria-hidden />
                                )}
                              <div
                                data-task-id={task.id}
                                draggable={!isMobileView}
                                onDragStart={isMobileView ? undefined : (e) => handleDragStart(e, task)}
                                onDragEnd={!isMobileView ? handleDragEnd : undefined}
                                className={`task-card bg-white rounded-lg shadow-md ${
                                  draggedTask?.id === task.id && (!dragOverCell || dragOverCell.status !== task.status || dragOverCell.priority !== task.priority) ? 'dragging' : ''
                                } ${task.isFrog ? 'ring-2 ring-orange-500' : ''} ${task.collapsed ? 'p-2 cursor-pointer' : `p-3 ${isMobileView ? 'cursor-default' : 'cursor-move'}`}`}
                              >
                                {confirmDeleteId === task.id ? (
                                  <div className="flex items-center justify-between gap-2 py-1" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-sm text-gray-700">Delete this task?</span>
                                    <div className="flex gap-1">
                                      <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs font-medium rounded bg-slate-200 text-gray-700 hover:bg-slate-300">Cancel</button>
                                      <button type="button" onClick={() => deleteTask(task.id)} className="px-2 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600">Delete</button>
                                    </div>
                                  </div>
                                ) : task.collapsed ? (
                                  <div className="min-w-0">
                                    <div
                                      className="flex items-start sm:items-center gap-2 min-w-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isMobileView) setMobileSelectedTaskId((prev) => (prev === task.id ? null : task.id));
                                        else toggleTaskCollapsed(task.id);
                                      }}
                                      title={isMobileView ? 'Tap to show actions' : 'Click to expand'}
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleTaskCollapsed(task.id); }}
                                        className="flex-shrink-0 p-0.5 -m-0.5 rounded hover:bg-gray-100 text-gray-400 touch-manipulation"
                                        aria-label="Expand"
                                      >
                                        <ChevronRight className="w-4 h-4 mt-0.5 sm:mt-0" />
                                      </button>
                                      {!isMobileView && <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" title="Drag to move" />}
                                      <p className="text-base sm:text-sm text-gray-800 font-medium flex-1 min-w-0 break-words line-clamp-2 sm:line-clamp-none sm:truncate leading-snug">{task.text}</p>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {task.scheduledDate && (() => {
                                          const ds = getDateStatus(task);
                                          if (ds === 'overdue') return (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 whitespace-nowrap" title={`Overdue — was due ${formatDay(task.scheduledDate)}`}>Overdue</span>
                                          );
                                          if (ds === 'today') return (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 whitespace-nowrap" title="Due today">Today</span>
                                          );
                                          return (
                                            <span className="text-[10px] text-gray-500 whitespace-nowrap flex items-center" title={`Scheduled: ${formatDay(task.scheduledDate)}`}>
                                              <Calendar className="w-3 h-3 mr-0.5 flex-shrink-0" />
                                              {new Date(task.scheduledDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                          );
                                        })()}
                                        {(task.subtasks || []).length > 0 && (
                                          <span className="text-[10px] text-gray-500" title="Checklist">
                                            {(task.subtasks || []).filter(s => s.done).length}/{(task.subtasks || []).length}
                                          </span>
                                        )}
                                        {task.notes && task.notes.trim() && (
                                          <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" title="Has note" />
                                        )}
                                        {task.recurrence && task.recurrence !== 'none' && (
                                          <Repeat className="w-3 h-3 text-gray-400 flex-shrink-0" title={`Repeats ${task.recurrence}`} />
                                        )}
                                      </div>
                                      {!isMobileView && (
                                        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            onClick={() => setFrog(task.id)}
                                            className={`p-1 rounded flex items-center justify-center touch-manipulation ${task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'}`}
                                            title="Mark as frog"
                                          >
                                            <Flame className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => setConfirmDeleteId(task.id)}
                                            className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 touch-manipulation"
                                            title="Delete"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    {/* Mobile: action buttons on second row when selected */}
                                    {isMobileView && mobileSelectedTaskId === task.id && (
                                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          onClick={() => setEditSheetTaskId(task.id)}
                                          className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-500 hover:bg-slate-200 active:bg-slate-300"
                                          title="Edit task"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setMoveMenuTaskId(task.id)}
                                          className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-500 hover:bg-slate-200 active:bg-slate-300"
                                          title="Move to another column"
                                        >
                                          <ArrowRightLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setFrog(task.id)}
                                          className={`min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation ${task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500 active:bg-orange-200'}`}
                                          title="Mark as frog"
                                        >
                                          <Flame className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeleteId(task.id)}
                                          className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 active:bg-red-200"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                <div className="flex items-start gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleTaskCollapsed(task.id); }}
                                    className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                    title="Collapse"
                                  >
                                    <ChevronDown className="w-4 h-4 mt-0.5" />
                                  </button>
                                  {!isMobileView && <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                                  <div className="flex-1 min-w-0">
                                    {editingTaskId === task.id ? (
                                      <input
                                        type="text"
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        onBlur={saveEditing}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveEditing();
                                          if (e.key === 'Escape') {
                                            setEditingTaskId(null);
                                            setEditingText('');
                                          }
                                        }}
                                        className="w-full text-sm text-gray-800 font-medium border border-orange-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <p
                                        className="text-base sm:text-sm text-gray-800 font-medium break-words cursor-text hover:text-orange-600 transition-colors"
                                        onClick={() => {
                                          if (isMobileView) setMobileSelectedTaskId((prev) => (prev === task.id ? null : task.id));
                                          else startEditing(task);
                                        }}
                                        title={isMobileView ? 'Tap to show actions' : 'Click to edit'}
                                      >
                                        {task.text}
                                      </p>
                                    )}
                                  </div>
                                  {!isMobileView && (
                                    <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => setFrog(task.id)}
                                        className={`p-1 rounded flex items-center justify-center transition-all ${task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'}`}
                                        title="Mark as frog"
                                      >
                                        <Flame className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(task.id)}
                                        className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {/* Mobile: action buttons on own row when selected */}
                                {isMobileView && mobileSelectedTaskId === task.id && (
                                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setEditSheetTaskId(task.id); }}
                                      className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-500 hover:bg-slate-200 active:bg-slate-300"
                                      title="Edit task"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setMoveMenuTaskId(task.id); }}
                                      className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-500 hover:bg-slate-200 active:bg-slate-300"
                                      title="Move to another column"
                                    >
                                      <ArrowRightLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setFrog(task.id)}
                                      className={`min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation ${task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500 active:bg-orange-200'}`}
                                      title="Mark as frog"
                                    >
                                      <Flame className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(task.id)}
                                      className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 active:bg-red-200"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                {/* Optional scheduled date */}
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  {editingDateTaskId === task.id ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="date"
                                        value={task.scheduledDate || ''}
                                        onChange={(e) => { updateTask(task.id, { scheduledDate: e.target.value || undefined }); if (!e.target.value) setEditingDateTaskId(null); }}
                                        onBlur={() => setEditingDateTaskId(null)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1 w-full max-w-[140px]"
                                        autoFocus
                                      />
                                      <button type="button" onClick={() => setEditingDateTaskId(null)} className="text-xs text-gray-500 hover:text-gray-700">Done</button>
                                    </div>
                                  ) : task.scheduledDate ? (
                                    <button type="button" onClick={() => setEditingDateTaskId(task.id)} className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity" title="Change scheduled date">
                                      {(() => {
                                        const ds = getDateStatus(task);
                                        if (ds === 'overdue') return <span className="font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Overdue · {formatDay(task.scheduledDate)}</span>;
                                        if (ds === 'today') return <span className="font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">Due today</span>;
                                        return <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDay(task.scheduledDate)}</span>;
                                      })()}
                                    </button>
                                  ) : (
                                    <button type="button" onClick={() => setEditingDateTaskId(task.id)} className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1" title="Schedule for a day">
                                      <Calendar className="w-3 h-3" /> Add date
                                    </button>
                                  )}
                                </div>
                                {/* Notes */}
                                <div className="mt-1 pt-1 border-t border-gray-100">
                                  {expandedNotesTaskId === task.id ? (
                                    <div>
                                      <textarea
                                        value={task.notes || ''}
                                        onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                                        onBlur={() => setExpandedNotesTaskId(null)}
                                        placeholder="Notes..."
                                        className="text-xs w-full border border-gray-300 rounded px-2 py-1 min-h-[60px] resize-y"
                                      />
                                    </div>
                                  ) : (
                                    <button type="button" onClick={() => setExpandedNotesTaskId(task.id)} className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1">
                                      <FileText className="w-3 h-3" /> {task.notes ? `${task.notes.slice(0, 30)}${task.notes.length > 30 ? '…' : ''}` : 'Add note'}
                                    </button>
                                  )}
                                </div>
                                {/* Subtasks */}
                                <div className="mt-1 pt-1 border-t border-gray-100">
                                  {expandedSubtasksTaskId === task.id ? (
                                    <div className="space-y-1">
                                      {(task.subtasks || []).map((st) => (
                                        <div key={st.id} className="flex items-center gap-2 text-xs">
                                          <input type="checkbox" checked={!!st.done} onChange={() => toggleSubtask(task.id, st.id)} className="rounded" />
                                          <span className={st.done ? 'line-through text-gray-500' : 'text-gray-800'}>{st.text}</span>
                                          <button type="button" onClick={() => removeSubtask(task.id, st.id)} className="text-red-500 hover:text-red-700 ml-auto">×</button>
                                        </div>
                                      ))}
                                      <form onSubmit={(e) => { e.preventDefault(); const input = e.target.querySelector('input'); if (input?.value.trim()) { addSubtask(task.id, input.value); input.value = ''; } }} className="flex gap-1">
                                        <input type="text" placeholder="Add step..." className="flex-1 text-xs border border-gray-300 rounded px-2 py-0.5" />
                                        <button type="submit" className="text-xs text-orange-600 font-medium">Add</button>
                                      </form>
                                      <button type="button" onClick={() => setExpandedSubtasksTaskId(null)} className="text-xs text-gray-500">Close</button>
                                    </div>
                                  ) : (
                                    <button type="button" onClick={() => setExpandedSubtasksTaskId(task.id)} className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1">
                                      <ListTodo className="w-3 h-3" /> {(task.subtasks || []).length ? `${(task.subtasks || []).filter(s => s.done).length}/${(task.subtasks || []).length} steps` : 'Checklist'}
                                    </button>
                                  )}
                                </div>
                                {/* Recurrence */}
                                <div className="mt-1 pt-1 border-t border-gray-100 flex items-center gap-2">
                                  <Repeat className="w-3 h-3 text-gray-400" />
                                  <select
                                    value={task.recurrence || 'none'}
                                    onChange={(e) => updateTask(task.id, { recurrence: e.target.value })}
                                    className="text-xs border border-gray-300 rounded px-1 py-0.5"
                                  >
                                    <option value="none">No repeat</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                  </select>
                                </div>
                                  </> 
                                )}
                              </div>
                              </React.Fragment>
                                );
                              });
                            })()}
                            {/* End-of-list drop indicator: shown when dragging and cursor is below all cards */}
                            {!isMobileView && dragOverCell?.status === status && dragOverCell?.priority === priority && dragOverCell?.insertBeforeTaskId == null && (
                              <div className="h-1 rounded-full bg-orange-500 opacity-90 flex-shrink-0 min-h-[8px]" aria-hidden />
                            )}
                          </div>
                        </div>
                        <div
                          role="separator"
                          aria-label={`Resize row ${priority}`}
                          onMouseDown={(e) => handleResizeStart(priority, e)}
                          className={`kanban-resize-handle hidden md:flex flex-shrink-0 cursor-ns-resize flex-col items-center justify-center gap-0.5 py-1.5 mb-1 rounded-md select-none ${resizingPriority === priority ? 'active bg-orange-500 text-white' : 'bg-slate-700/80 hover:bg-slate-600 text-slate-400'}`}
                          title="Drag to resize row"
                        >
                          <span className="grip-line" />
                          <span className="grip-line" />
                          <span className="grip-line" />
                        </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* No tasks match filters or search */}
            {tasks.length > 0 && searchQuery.trim() && !tasks.some(taskMatchesSearch) && (
              <div className="mt-4 bg-amber-900/30 border border-amber-600/50 rounded-lg px-4 py-2 text-amber-200 text-sm">
                No tasks match &quot;{searchQuery}&quot;. Clear search or try different keywords.
              </div>
            )}
            {tasks.length > 0 && !searchQuery.trim() && (filterFrog || filterPriority !== 'all') && tasks.filter(t => (!filterFrog || t.isFrog) && (filterPriority === 'all' || t.priority === filterPriority)).length === 0 && (
              <div className="mt-4 bg-amber-900/30 border border-amber-600/50 rounded-lg px-4 py-2 text-amber-200 text-sm">
                No tasks match the current filters. Try &quot;All&quot; or turn off &quot;Frogs Only&quot;.
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 bg-slate-800 rounded-xl p-4">
              <div className="text-sm text-gray-400">
                <strong className="text-white">How to use:</strong> Double-click a cell to add a task. Drag to change status/priority. Click text to edit. Flame = today&apos;s frog. Add note, checklist, or repeat (daily/weekly/monthly) on each card. After delete or move, the task fades in place — hover it and click <strong>Undo</strong> within 5s. Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-gray-300">?</kbd> for shortcuts.
              </div>
            </div>
          </div>
        ) : view === 'schedule' ? (
          /* Schedule View: Daily | Weekly | Monthly */
          <div className="space-y-6">
            {/* Search in Schedule */}
            <div className="bg-slate-800 rounded-xl p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search scheduled tasks..."
                  className="w-full max-w-xs pl-9 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
            </div>
            {/* Quick-add for Schedule: task + date defaulting to focus date */}
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && quickAddText.trim()) { const d = quickAddDate || (scheduleRange === 'daily' ? focusDate : todayKey); addTask(quickAddText, quickAddPriority || 'A', quickAddColumn || 'todo', d); setQuickAddText(''); setQuickAddDate(''); } }}
                  placeholder="Add task for this day/week/month..."
                  className="flex-1 min-w-[200px] px-4 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none"
                />
                <input
                  type="date"
                  value={quickAddDate || (scheduleRange === 'daily' ? focusDate : todayKey)}
                  onChange={(e) => setQuickAddDate(e.target.value)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none"
                  title="Scheduled date"
                />
                <select
                  value={quickAddPriority || 'A'}
                  onChange={(e) => setQuickAddPriority(e.target.value)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
                <button
                  onClick={() => { if (quickAddText.trim()) { const d = quickAddDate || (scheduleRange === 'daily' ? focusDate : todayKey); addTask(quickAddText, quickAddPriority || 'A', quickAddColumn || 'todo', d); setQuickAddText(''); setQuickAddDate(''); } }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  <Plus className="w-5 h-5 inline" />
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">Date defaults to the day/week/month you’re viewing. Tasks appear here and on the Board.</p>
            </div>

            {/* Schedule sub-tabs + date navigation */}
            <div className="bg-slate-800 rounded-xl p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly']).map((range) => (
                    <button
                      key={range}
                      onClick={() => setScheduleRange(range)}
                      className={`flex-1 sm:flex-none min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg font-semibold capitalize transition-all touch-manipulation ${
                        scheduleRange === range ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'
                      }`}
                    >
                      {range === 'daily' ? 'Day' : range === 'weekly' ? 'Week' : 'Month'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFocusDate(scheduleRange === 'daily' ? addDays(focusDate, -1) : scheduleRange === 'weekly' ? addWeeks(focusDate, -1) : addMonths(focusDate, -1))}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl sm:rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500 transition-colors touch-manipulation"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToToday}
                    className={`flex-1 min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-lg font-semibold transition-all touch-manipulation ${
                      (scheduleRange === 'daily' && isViewingToday) || (scheduleRange === 'weekly' && isViewingThisWeek) || (scheduleRange === 'monthly' && isViewingThisMonth)
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'
                    }`}
                  >
                    {scheduleRange === 'daily' ? 'Today' : scheduleRange === 'weekly' ? 'This week' : 'This month'}
                  </button>
                  <button
                    onClick={() => setFocusDate(scheduleRange === 'daily' ? addDays(focusDate, 1) : scheduleRange === 'weekly' ? addWeeks(focusDate, 1) : addMonths(focusDate, 1))}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl sm:rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500 transition-colors touch-manipulation"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 text-gray-400 text-sm font-medium">
                {scheduleRange === 'daily' && formatDay(focusDate)}
                {scheduleRange === 'weekly' && formatWeekRange(getWeekStart(focusDate)).long}
                {scheduleRange === 'monthly' && formatMonth(getMonthStart(focusDate))}
              </div>
            </div>

            {/* Schedule content */}
            {scheduleRange === 'daily' && (
              <div className="space-y-6">
                {getOverdueTasks().length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                      <span>Overdue</span>
                      <span className="text-sm font-normal text-gray-500">({getOverdueTasks().length})</span>
                    </h3>
                    <div className="space-y-2">
                      {getOverdueTasks().map((task) => (
                        <ScheduleTaskCard key={task.id} task={task} getPriorityBadgeColor={getPriorityBadgeColor} getStatusLabel={getStatusLabel} setFrog={setFrog} deleteTask={deleteTask} editingTaskId={editingTaskId} editingText={editingText} setEditingText={setEditingText} startEditing={startEditing} saveEditing={saveEditing} cancelEditing={cancelEditing} />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">{formatDay(focusDate)}</h3>
                  {getTasksForDate(focusDate).length === 0 ? (
                    <p className="text-gray-500 py-6 bg-slate-800 rounded-xl text-center">No tasks scheduled for this day. Add a date when creating a task on the Board.</p>
                  ) : (
                    <div className="space-y-2">
                      {getTasksForDate(focusDate).map((task) => (
                        <ScheduleTaskCard key={task.id} task={task} getPriorityBadgeColor={getPriorityBadgeColor} getStatusLabel={getStatusLabel} setFrog={setFrog} deleteTask={deleteTask} editingTaskId={editingTaskId} editingText={editingText} setEditingText={setEditingText} startEditing={startEditing} saveEditing={saveEditing} cancelEditing={cancelEditing} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {scheduleRange === 'weekly' && (() => {
              const weekStart = getWeekStart(focusDate);
              const days = getDaysInWeek(weekStart);
              const weekTasks = getTasksForWeek(weekStart);
              return (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {days.map((dayKey) => {
                    const dayTasks = weekTasks.filter((t) => t.scheduledDate === dayKey);
                    const isToday = dayKey === todayKey;
                    return (
                      <div key={dayKey} className={`rounded-xl p-4 min-h-[200px] ${isToday ? 'bg-orange-500/10 border-2 border-orange-500/50' : 'bg-slate-800'}`}>
                        <div className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                          {formatDay(dayKey)}
                          {isToday && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">Today</span>}
                        </div>
                        <div className="space-y-2">
                          {dayTasks.length === 0 ? (
                            <p className="text-gray-500 text-xs">No tasks</p>
                          ) : (
                            dayTasks.map((task) => (
                              <ScheduleTaskCard key={task.id} task={task} getPriorityBadgeColor={getPriorityBadgeColor} getStatusLabel={getStatusLabel} setFrog={setFrog} deleteTask={deleteTask} editingTaskId={editingTaskId} editingText={editingText} setEditingText={setEditingText} startEditing={startEditing} saveEditing={saveEditing} cancelEditing={cancelEditing} compact />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {scheduleRange === 'monthly' && (() => {
              const monthStart = getMonthStart(focusDate);
              const weeks = getWeekNumbersInMonth(monthStart);
              const monthTasks = getTasksForMonth(monthStart);
              return (
                <div className="space-y-6">
                  {weeks.map((weekStartKey) => {
                    const days = getDaysInWeek(weekStartKey);
                    const weekTasks = monthTasks.filter((t) => days.includes(t.scheduledDate));
                    if (weekTasks.length === 0) return null;
                    return (
                      <div key={weekStartKey} className="bg-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-gray-400 mb-3">{formatWeekRange(weekStartKey).short}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                          {days.map((dayKey) => {
                            const dayTasks = weekTasks.filter((t) => t.scheduledDate === dayKey);
                            if (dayTasks.length === 0) return null;
                            return (
                              <div key={dayKey}>
                                <div className="text-xs font-semibold text-gray-500 mb-1">{formatDay(dayKey)}</div>
                                <div className="space-y-1">
                                  {dayTasks.map((task) => (
                                    <ScheduleTaskCard key={task.id} task={task} getPriorityBadgeColor={getPriorityBadgeColor} getStatusLabel={getStatusLabel} setFrog={setFrog} deleteTask={deleteTask} editingTaskId={editingTaskId} editingText={editingText} setEditingText={setEditingText} startEditing={startEditing} saveEditing={saveEditing} cancelEditing={cancelEditing} compact />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {monthTasks.length === 0 && (
                    <p className="text-gray-500 py-12 bg-slate-800 rounded-xl text-center">No tasks scheduled this month. Add a date when creating tasks on the Board.</p>
                  )}
                </div>
              );
            })()}
          </div>
        ) : view === 'about' ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>SUMMARY OF BRIAN TRACY&apos;S BOOK</h2>
              <p className="text-xl font-semibold text-orange-200">Eat That Frog!</p>
              <p className="text-gray-400 text-sm mt-1">21 Great Ways to Stop Procrastinating and Get More Done in Less Time</p>
            </div>
            <div className="space-y-6 text-gray-300">
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Why &quot;Eat That Frog&quot;?</h3>
                <p className="leading-relaxed mb-2">If you have to eat a frog, do it first thing in the morning. If you have to eat two frogs, eat the biggest one first.</p>
                <p className="leading-relaxed">The <strong className="text-white">frog</strong> is your <strong className="text-white">most important task</strong> — the one that will bring you the most success. These tasks often deliver five or ten times the value of others. They&apos;re also usually the hardest. You can&apos;t eat every tadpole in the pond, but eating the <strong className="text-white">biggest and ugliest frog</strong> first sets you up for consistent success.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Three Questions to Ask Yourself</h3>
                <p className="text-sm text-gray-400 mb-2">To maximize productivity and eat your frog first:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2"><span className="text-orange-400">1.</span> What are my highest-value activities?</li>
                  <li className="flex gap-2"><span className="text-orange-400">2.</span> What can I, and only I, do that, if done well, will make a genuine difference?</li>
                  <li className="flex gap-2"><span className="text-orange-400">3.</span> What is the most valuable use of my time right now?</li>
                </ul>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Planning: Think on Paper</h3>
                <p className="leading-relaxed mb-2">Decide what you want and <strong className="text-white">write it down</strong>. Set a deadline and sub-deadlines — without them, goals lack urgency. Create a list of sub-tasks, organise them into a plan, visualise it, then take action. Build in daily activities that move you toward your goals.</p>
                <p className="text-orange-200 font-medium italic">Proper Prior Planning Prevents Poor Performance.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">A Step-by-Step Approach to Planning</h3>
                <ul className="space-y-2">
                  <li><strong className="text-white">Write a list</strong> — everything you have to do before you work through the plan.</li>
                  <li><strong className="text-white">Work from the list</strong> — treat it as your reference. Add new things to the list first, even if urgent.</li>
                  <li><strong className="text-white">Plan ahead</strong> — e.g. the night before; let your subconscious work on it overnight.</li>
                  <li><strong className="text-white">Update the list</strong> — move unfinished items to the next day and tick off completed ones.</li>
                </ul>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Focus on the Top 20 Percent</h3>
                <p className="leading-relaxed">Refuse to work on the bottom 80 percent while you still have tasks in the top 20 percent. Practising this consistently builds the habit of tackling the most critical tasks first.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Key Result Areas</h3>
                <p className="leading-relaxed">Key result areas are areas of work for which <strong className="text-white">you</strong> are entirely responsible. If you don&apos;t do this work, it won&apos;t get done — and the output is often crucial for others. Find them by listing your most important output responsibilities and asking what others need from you to start their work.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Why We Procrastinate — and How to Get Better</h3>
                <p className="leading-relaxed mb-2">A major cause of procrastination is feeling weak or deficient in one part of a task. The more you practise, the better you get at eating that kind of frog.</p>
                <p className="leading-relaxed text-orange-200 font-medium">Everything is learnable.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">The ABCDE Method (Priority System)</h3>
                <p className="leading-relaxed mb-3">Tracy recommends labelling tasks by impact. This app uses the same A–E priorities:</p>
                <ul className="space-y-1.5 text-sm">
                  <li><strong className="text-white">A</strong> — Must do; serious consequences if you don&apos;t.</li>
                  <li><strong className="text-white">B</strong> — Should do; mild consequences.</li>
                  <li><strong className="text-white">C</strong> — Nice to do; no consequences.</li>
                  <li><strong className="text-white">D</strong> — Delegate; someone else can do it.</li>
                  <li><strong className="text-white">E</strong> — Eliminate; drop it if it no longer matters.</li>
                </ul>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">You Are Unique</h3>
                <p className="leading-relaxed">You have talents and abilities that nobody else has. The goal of this method — and this app — is to help you use your time and focus where they matter most: on your frog first.</p>
              </section>
              <section className="bg-gradient-to-r from-orange-600/20 to-slate-800 rounded-xl p-6 border border-orange-500/30 text-center">
                <p className="text-gray-300 text-sm italic">Brian Tracy, <em>Eat That Frog!</em> — 21 Great Ways to Stop Procrastinating and Get More Done in Less Time.</p>
              </section>
            </div>
          </div>
        ) : view === 'settings' ? (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="hidden">
              <h2 className="text-xl font-bold text-white mb-2">About (moved to About tab)</h2>
              <p className="text-gray-300 text-sm mb-4">
                This app is inspired by <strong className="text-white">Brian Tracy&apos;s <em>Eat That Frog!</em></strong> — a method for doing your most important work first. Here&apos;s the thinking behind it.
              </p>
              <div className="space-y-4 text-sm text-gray-300 max-h-[320px] overflow-y-auto pr-2">
                <div>
                  <h3 className="font-semibold text-orange-200 mb-1">Why “eat that frog”?</h3>
                  <p>The <strong>frog</strong> is your most important task — often worth 5–10× the others. It&apos;s usually the hardest. Eat the biggest, ugliest frog first; you can&apos;t eat every tadpole in the pond, but that one sets you up for success.</p>
                </div>
              </div>
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
              <h2 className="text-xl font-bold text-white mb-1">Backup & restore</h2>
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
                      } catch (err) {
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

            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">Clear old data</h2>
              <p className="text-gray-400 text-sm mb-6">
                Remove tasks created before a chosen date. Tasks on or after the cutoff are kept. Stats are not changed.
              </p>

              <div className="space-y-4">
                <p className="text-gray-300 text-sm font-medium">Quick options</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleClearWithConfirm(formatCutoffLabel('lastMonth'), getCutoffForPreset('lastMonth'))}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
                  >
                    Till last month (keep from {formatCutoffLabel('lastMonth')})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearWithConfirm(formatCutoffLabel('last6Months'), getCutoffForPreset('last6Months'))}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
                  >
                    Till last 6 months (keep from {formatCutoffLabel('last6Months')})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearWithConfirm(formatCutoffLabel('lastYear'), getCutoffForPreset('lastYear'))}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
                  >
                    Till last year (keep from {formatCutoffLabel('lastYear')})
                  </button>
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
        ) : (
          /* Analytics View */
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
              <h3 className="text-2xl font-bold mb-6 text-white">Task Distribution by Priority</h3>

              {priorities.map((priority) => {
                const count = tasks.filter((t) => t.priority === priority && t.status !== 'done').length;
                const total = tasks.filter((t) => t.status !== 'done').length;
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={priority} className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-white">
                        Priority {priority} - {getPriorityLabel(priority)}
                      </span>
                      <span className="text-gray-400">
                        {count} tasks ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          priority === 'A'
                            ? 'bg-red-500'
                            : priority === 'B'
                              ? 'bg-orange-500'
                              : priority === 'C'
                                ? 'bg-yellow-500'
                                : priority === 'D'
                                  ? 'bg-blue-500'
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

            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-8 text-white">
              <h3
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}
              >
                EAT THAT FROG PRINCIPLES
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🐸</span>
                  <div>
                    <strong>Eat the ugliest frog first:</strong> Start with your most important, challenging task
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <strong>Do it first thing:</strong> Tackle your A tasks in the morning when your energy is highest
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <strong>Focus ruthlessly:</strong> Work on one task at a time until completion
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✂️</span>
                  <div>
                    <strong>Eliminate & delegate:</strong> Use D and E priorities to free up time for what matters
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Pomodoro Timer */}
    {showPomodoro && (
      <PomodoroTimer
        onClose={() => setShowPomodoro(false)}
        frogTask={tasks.find((t) => t.isFrog && t.status !== 'done') || null}
      />
    )}
    </>
  );
}
