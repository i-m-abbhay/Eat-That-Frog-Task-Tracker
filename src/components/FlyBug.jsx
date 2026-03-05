export default function FlyBug({ baseStyle = {}, pathAnim = '', onClick, falling = false }) {
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
