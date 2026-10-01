import { useState } from 'react';
import { STROKES, STROKE_BOX } from '../data/strokes.js';
import { pathStart } from '../lib/strokes.js';

/**
 * Animated stroke-order diagram. Strokes draw themselves one after another;
 * numbered dots mark where each stroke starts. Click to replay.
 */
export default function StrokeOrderKana({ char, size = 140, speed = 0.7, numbers = true, animate = true }) {
  const [play, setPlay] = useState(0);
  const paths = STROKES[char] || [];
  const half = STROKE_BOX / 2;

  return (
    <button type="button" className="stroke-btn" onClick={() => setPlay((n) => n + 1)} title="Replay stroke order" aria-label={`Stroke order for ${char}, click to replay`}>
      <svg key={play} viewBox={`0 0 ${STROKE_BOX} ${STROKE_BOX}`} width={size} height={size} className="stroke-svg">
        <line x1={half} y1="0" x2={half} y2={STROKE_BOX} className="guide" />
        <line x1="0" y1={half} x2={STROKE_BOX} y2={half} className="guide" />
        {paths.map((d, i) => (
          <path key={`g${i}`} d={d} className="ghost" />
        ))}
        {paths.map((d, i) => (
          <path
            key={`s${i}`}
            d={d}
            pathLength="1"
            className={animate ? 'ink draw' : 'ink'}
            style={animate ? { animationDelay: `${0.3 + i * speed}s`, animationDuration: `${speed}s` } : undefined}
          />
        ))}
        {numbers &&
          paths.map((d, i) => {
            const [x, y] = pathStart(d);
            return (
              <g key={`n${i}`} className="num" style={animate ? { animationDelay: `${0.3 + i * speed}s` } : undefined}>
                <circle cx={x} cy={y} r="6.5" />
                <text x={x} y={y + 2.6}>{i + 1}</text>
              </g>
            );
          })}
      </svg>
    </button>
  );
}
