import LineSelect from './LineSelect.jsx';
import StrokeOrderKana from './StrokeOrderKana.jsx';
import { STROKES } from '../data/strokes.js';
import { questionCount } from '../lib/quiz.js';

export default function WriteStudyScreen({ lines, line, onLineChange, onStart }) {
  const previous = line.index;
  return (
    <div className="card study">
      <div className="study-toolbar">
        <div>
          <p className="eyebrow">
            Writing · Line {line.index + 1} / {lines.length} · {line.group}
          </p>
          <h2>
            <span lang="ja">{line.label}</span> line <small>({line.id})</small>
          </h2>
        </div>
        <LineSelect lines={lines} value={line.index} onChange={onLineChange} />
      </div>

      <p className="hint">Watch the stroke order (click a kana to replay). Numbers show where each stroke starts.</p>

      <div className="kana-grid wide">
        {line.kana.map((k) => (
          <div key={k.char} className="kana-card write">
            <StrokeOrderKana char={k.char} />
            <span className="kana-romaji">{k.romaji}</span>
            <span className="kana-alt">{STROKES[k.char]?.length} stroke{STROKES[k.char]?.length > 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>

      <p className="hint">
        The quiz has <strong>{questionCount(line.index)} kana to draw</strong>
        {previous > 0 ? ` from this line and the ${previous} previous line${previous > 1 ? 's' : ''}` : ''}. You are
        judged on stroke shape, count, order and direction.
      </p>
      <button className="btn primary big" onClick={onStart} autoFocus>
        I've memorized it, start drawing →
      </button>
    </div>
  );
}
