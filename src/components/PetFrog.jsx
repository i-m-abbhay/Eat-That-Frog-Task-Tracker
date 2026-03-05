export default function PetFrog({ state = 'idle', tongueTarget = 'none', eatTarget = 'none' }) {
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
        {/* Right foot — hidden when waving */}
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

        {/* Pupils + highlights */}
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

        {/* Working: cycling tongues */}
        {isWorking && eatTarget === 'none' && (
          <>
            <g style={{ transformOrigin: '60px 67px', animation: 'frog-tongue-roll 5s ease-in-out 0s infinite backwards' }}>
              <path d="M 60 67 Q 36 46 16 26" stroke="#fb7185" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle cx="16" cy="26" r="5.5" fill="#fb7185" />
              <circle cx="14" cy="23" r="1.5" fill="rgba(255,255,255,0.55)" />
            </g>
            <g style={{ transformOrigin: '60px 67px', animation: 'frog-tongue-roll 5s ease-in-out 2.5s infinite backwards' }}>
              <path d="M 60 67 Q 86 46 106 26" stroke="#fb7185" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle cx="106" cy="26" r="5.5" fill="#fb7185" />
              <circle cx="108" cy="23" r="1.5" fill="rgba(255,255,255,0.55)" />
            </g>
          </>
        )}

        {/* Eat tongue: snap toward clicked bee */}
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
