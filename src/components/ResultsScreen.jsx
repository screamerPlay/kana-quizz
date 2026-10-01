import { PASS_RATIO } from '../lib/quiz.js';

export default function ResultsScreen({ mode = 'read', line, isLast, answers, score, passed, onNext, onRetry, onStudy }) {
  const total = answers.length;
  const pct = Math.round((score / total) * 100);
  const mistakes = answers.filter((a) => !a.correct);

  return (
    <div className={`card results ${passed ? 'passed' : 'failed'}`}>
      <p className="eyebrow">Line {line.index + 1} · {line.label} ({line.id})</p>
      <div className="results-score">
        <span className="pct">{pct}%</span>
        <span>
          {score} / {total} {mode === 'write' ? 'drawn correctly' : 'correct'}
          {mode === 'write' && ` · avg accuracy ${Math.round(answers.reduce((a, x) => a + (x.accuracy || 0), 0) / total)}%`}
        </span>
      </div>
      <h2>{passed ? (isLast ? 'You passed the final line! 🎉' : 'Passed! Next line unlocked 🎉') : `Not quite: you need ${PASS_RATIO * 100}%`}</h2>

      {mistakes.length > 0 && (
        <>
          <h3>Mistakes to review</h3>
          <ul className="mistakes">
            {mistakes.map((m, i) => (
              <li key={i}>
                <span className="kana-char small" lang="ja">{m.kana.char}</span>
                <span className="mistake-detail">
                  {mode === 'write' ? (
                    <>
                      <strong>{m.kana.romaji}</strong> · {m.accuracy}%
                    </>
                  ) : (
                    <>
                      <s>{m.input}</s> → <strong>{m.kana.romaji}</strong>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="actions">
        {passed && (
          <button className="btn primary big" onClick={onNext} autoFocus>
            {isLast ? 'Finish →' : 'Study next line →'}
          </button>
        )}
        <button className={`btn ${passed ? '' : 'primary big'}`} onClick={onRetry} autoFocus={!passed}>
          Retry quiz
        </button>
        <button className="btn" onClick={onStudy}>
          Study this line again
        </button>
      </div>
    </div>
  );
}
