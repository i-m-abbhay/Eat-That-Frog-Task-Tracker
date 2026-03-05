import React from 'react';
import PetFrog from './PetFrog';

export default function HeaderFrog() {
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
