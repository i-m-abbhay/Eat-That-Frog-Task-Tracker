import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function HelpTip({ text, className = '', id, activeId, onToggle }) {
  const showByTap = id != null && activeId === id;
  const tipRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  const repositionRef = React.useRef(null);

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
  }, []);

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
