import LineSelect from './LineSelect.jsx';
import { questionCount } from '../lib/quiz.js';

export default function StudyScreen({ lines, line, onLineChange, onStart }) {
  const previous = line.index;
  return (
    <div className="card study">
      <div className="study-toolbar">
        <div>
          <p className="eyebrow">
            Line {line.index + 1} / {lines.length} · {line.group}
          </p>
          <h2>
            <span lang="ja">{line.label}</span> line <small>({line.id})</small>
          </h2>
        </div>
        <LineSelect lines={lines} value={line.index} onChange={onLineChange} />
      </div>

      <div className={`kana-grid ${line.kana[0].char.length > 1 ? 'wide' : ''}`}>
        {line.kana.map((k) => (
          <div key={k.char} className="kana-card">
            <span className="kana-char" lang="ja">{k.char}</span>
            <span className="kana-romaji">{k.romaji}</span>
            {k.accepted.length > 1 && <span className="kana-alt">also: {k.accepted.slice(1).join(', ')}</span>}
          </div>
        ))}
      </div>

      <p className="hint">
        The quiz has <strong>{questionCount(line.index)} questions</strong>
        {previous > 0 ? ` covering this line and the ${previous} previous line${previous > 1 ? 's' : ''}` : ''}.
      </p>
      <button className="btn primary big" onClick={onStart} autoFocus>
        I've memorized it, start the quiz →
      </button>
    </div>
  );
}
