import { useEffect, useState } from 'react';
import DrawCanvas from './DrawCanvas.jsx';
import StrokeOrderKana from './StrokeOrderKana.jsx';
import { STROKES } from '../data/strokes.js';
import { scoreDrawing } from '../lib/strokes.js';

export default function WriteQuizScreen({ script, line, questions, onFinish, onQuit, showModel = true, onToggleModel = () => {} }) {
  const [index, setIndex] = useState(0);
  const [strokes, setStrokes] = useState([]);
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);

  const current = questions[index];
  const reference = STROKES[current.char];
  const passedCount = results.filter((r) => r.correct).length;

  const check = () => {
    const r = scoreDrawing(reference, strokes);
    setResult(r);
    setResults((all) => [...all, { kana: current, correct: r.passed, accuracy: r.accuracy, input: `${r.accuracy}%`, detail: r }]);
  };

  const next = () => {
    const all = results;
    if (index + 1 >= questions.length) {
      onFinish(all);
      return;
    }
    setIndex((i) => i + 1);
    setStrokes([]);
    setResult(null);
  };

  // Keyboard: Enter = check / continue, Backspace = undo, Escape = clear
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (result) next();
        else if (strokes.length) check();
      } else if (e.key === 'Backspace' && !result) {
        e.preventDefault();
        setStrokes((s) => s.slice(0, -1));
      } else if (e.key === 'Escape' && !result) {
        setStrokes([]);
      } else if (e.key === 'h' || e.key === 'H') {
        onToggleModel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // re-bind each render so handlers see fresh state

  const notes = [];
  if (result) {
    if (!result.countOk) notes.push(`${result.expected} stroke${result.expected > 1 ? 's' : ''} expected, you drew ${result.drawn}`);
    if (!result.orderOk) notes.push('stroke order is wrong');
    result.strokes.forEach((s, i) => {
      if (s.reversed) notes.push(`stroke ${i + 1} was drawn backwards`);
      else if (!s.missing && !s.extra && s.score < 0.6 && result.countOk) notes.push(`stroke ${i + 1} shape is off`);
    });
  }

  return (
    <div className="card quiz write-quiz">
      <div className="quiz-top">
        <span className="eyebrow">
          Line {line.index + 1} writing quiz · {index + 1} / {questions.length}
        </span>
        <span className="quiz-score">
          ✓ {passedCount} · ✗ {results.length - passedCount}
        </span>
      </div>
      <div className="progress">
        <div style={{ width: `${(results.length / questions.length) * 100}%` }} />
      </div>

      <div className="write-prompt">
        <span className="eyebrow">Draw the {script.name} for</span>
        <div className="write-prompt-row">
          <span className="write-romaji">{current.romaji}</span>
          {showModel ? (
            <span className="write-model" title="Model: click to replay the stroke order">
              <StrokeOrderKana key={current.char + index} char={current.char} size={96} speed={0.45} />
            </span>
          ) : (
            <span className="write-model hidden" aria-label="Model hidden">?</span>
          )}
        </div>
        <button type="button" className="btn toggle-model" onClick={onToggleModel} aria-pressed={showModel}>
          {showModel ? '🙈 Hide kana (H)' : '👁 Show kana (H)'}
        </button>
        <span className="hint">
          {reference.length} stroke{reference.length > 1 ? 's' : ''} ·{' '}
          {strokes.length ? `you drew ${strokes.length}` : 'draw in the box'}
        </span>
      </div>

      <div className="write-area">
        <DrawCanvas strokes={strokes} onChange={setStrokes} disabled={!!result} reference={result ? reference : null} strokeStates={result?.strokes} />
        {result && (
          <div className={`write-result ${result.passed ? 'ok' : 'ko'}`}>
            <div className="write-result-head">
              <span className="pct">{result.accuracy}%</span>
              <span>{result.passed ? 'Good!' : 'Not quite'}</span>
            </div>
            <StrokeOrderKana char={current.char} size={110} speed={0.5} />
            {notes.length > 0 && (
              <ul className="write-notes">
                {notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
            <span className="hint">Red: correct strokes · green/red: yours</span>
          </div>
        )}
      </div>

      <div className="actions write-actions">
        {!result ? (
          <>
            <button className="btn primary big" onClick={check} disabled={!strokes.length}>
              Check (Enter)
            </button>
            <button className="btn" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length}>
              Undo stroke (⌫)
            </button>
            <button className="btn" onClick={() => setStrokes([])} disabled={!strokes.length}>
              Clear (Esc)
            </button>
            <button className="btn" onClick={check}>
              I don't know
            </button>
          </>
        ) : (
          <button className="btn primary big" onClick={next} autoFocus>
            {index + 1 >= questions.length ? 'See results (Enter)' : 'Next (Enter)'}
          </button>
        )}
      </div>

      <button className="btn link" onClick={onQuit}>
        ← Quit and go back to the study sheet
      </button>
    </div>
  );
}
