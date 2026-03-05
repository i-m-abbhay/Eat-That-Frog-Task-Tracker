import React from 'react';
import { CONFETTI_COLORS } from '../constants';

export default function Confetti({ active, confettiKey }) {
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
