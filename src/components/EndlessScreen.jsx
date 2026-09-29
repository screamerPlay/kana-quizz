import { useEffect, useRef, useState } from 'react';
import { SCRIPTS } from '../data/kana.js';
import { isCorrect, nextEndlessQuestion } from '../lib/quiz.js';

const AUTO_ADVANCE_MS = 550;

const POOLS = {
  hiragana: { label: 'Hiragana', jp: 'ひらがな', scripts: ['hiragana'] },
  katakana: { label: 'Katakana', jp: 'カタカナ', scripts: ['katakana'] },
  all: { label: 'Both mixed', jp: 'かな・カナ', scripts: ['hiragana', 'katakana'] },
};

function buildPool(id) {
  return POOLS[id].scripts.flatMap((s) => SCRIPTS[s].lines.flatMap((l) => l.kana));
}

export default function EndlessScreen() {
  const [poolId, setPoolId] = useState('all');
  const [phase, setPhase] = useState('setup'); // setup | play | summary
  const [pool, setPool] = useState([]);
  const [current, setCurrent] = useState(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [stats, setStats] = useState({ answered: 0, correct: 0, streak: 0, best: 0 });
  const [misses, setMisses] = useState({});
  const [history, setHistory] = useState([]); // last few wrong answers
  const inputRef = useRef(null);

  const start = () => {
    const p = buildPool(poolId);
    setPool(p);
    setCurrent(nextEndlessQuestion(p));
    setStats({ answered: 0, correct: 0, streak: 0, best: 0 });
    setMisses({});
    setHistory([]);
    setInput('');
    setFeedback(null);
    setPhase('play');
  };

  const advance = () => {
    setCurrent(nextEndlessQuestion(pool, misses, current.char));
    setInput('');
    setFeedback(null);
  };

  useEffect(() => {
    if (!feedback?.correct) return;
    const t = setTimeout(advance, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'play') inputRef.current?.focus();
  }, [phase, current, feedback]);

  const submit = (e) => {
    e.preventDefault();
    if (feedback) {
      if (!feedback.correct) advance();
      return;
    }
    if (!input.trim()) return;
    const correct = isCorrect(current, input);
    setStats((s) => {
      const streak = correct ? s.streak + 1 : 0;
      return { answered: s.answered + 1, correct: s.correct + (correct ? 1 : 0), streak, best: Math.max(s.best, streak) };
    });
    if (!correct) {
      setMisses((m) => ({ ...m, [current.char]: (m[current.char] || 0) + 1 }));
      setHistory((h) => [{ kana: current, input: input.trim() }, ...h].slice(0, 30));
    }
    setFeedback({ correct });
  };

  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;

  if (phase === 'setup') {
    return (
      <section className="trainer">
        <div className="trainer-head">
          <h1>∞ Endless mode</h1>
        </div>
        <div className="card">
          <p className="eyebrow">All characters, no end</p>
          <h2>Pick a pool</h2>
          <p className="hint">
            Random kana from basic, dakuten, handakuten and yōon lines. Characters you miss come back more often.
            Stop whenever you want to see your weak spots.
          </p>
          <div className="pool-options">
            {Object.entries(POOLS).map(([id, p]) => (
              <label key={id} className={`pool-option ${poolId === id ? 'selected' : ''}`}>
                <input type="radio" name="pool" value={id} checked={poolId === id} onChange={() => setPoolId(id)} />
                <span className="pool-jp" lang="ja">{p.jp}</span>
                <span className="pool-label">{p.label}</span>
                <span className="pool-meta">{buildPool(id).length} kana</span>
              </label>
            ))}
          </div>
          <button className="btn primary big" onClick={start} autoFocus>
            Start endless quiz →
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'summary') {
    const worst = Object.entries(misses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([char, n]) => ({ kana: pool.find((k) => k.char === char), n }));
    return (
      <section className="trainer">
        <div className="trainer-head">
          <h1>∞ Endless mode · {POOLS[poolId].label}</h1>
        </div>
        <div className={`card results ${accuracy >= 80 ? 'passed' : 'failed'}`}>
          <p className="eyebrow">Session summary</p>
          <div className="results-score">
            <span className="pct">{accuracy}%</span>
            <span>
              {stats.correct} / {stats.answered} correct · best streak {stats.best}
            </span>
          </div>
          {worst.length > 0 ? (
            <>
              <h3>Most missed</h3>
              <ul className="mistakes">
                {worst.map(({ kana, n }) => (
                  <li key={kana.char}>
                    <span className="kana-char small" lang="ja">{kana.char}</span>
                    <span className="mistake-detail">
                      <strong>{kana.romaji}</strong> · ✗ {n}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <h3>No mistakes. Nice.</h3>
          )}
          <div className="actions">
            <button className="btn primary big" onClick={start} autoFocus>Go again</button>
            <button className="btn" onClick={() => setPhase('setup')}>Change pool</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="trainer">
      <div className="trainer-head">
        <h1>∞ Endless mode · {POOLS[poolId].label}</h1>
      </div>
      <div className="card quiz">
        <div className="quiz-top">
          <span className="eyebrow">#{stats.answered + 1} · {accuracy}% accuracy</span>
          <span className="quiz-score">
            ✓ {stats.correct} · ✗ {stats.answered - stats.correct} · 🔥 {stats.streak}
          </span>
        </div>

        <div className={`quiz-kana ${feedback ? (feedback.correct ? 'ok' : 'ko') : ''}`} lang="ja">
          {current.char}
        </div>

        <form onSubmit={submit} className="quiz-form">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => !feedback && setInput(e.target.value)}
            readOnly={!!feedback}
            placeholder="type the romaji…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            lang="en"
            inputMode="latin"
            aria-label="Romaji answer"
            className={feedback ? (feedback.correct ? 'ok' : 'ko') : ''}
          />
          <button className="btn primary" type="submit">
            {feedback && !feedback.correct ? 'Continue' : 'Check'}
          </button>
        </form>

        <div className="feedback" aria-live="polite">
          {feedback?.correct && <span className="ok">Correct!</span>}
          {feedback && !feedback.correct && (
            <span className="ko">
              Wrong: <span lang="ja">{current.char}</span> = <strong>{current.accepted.join(' / ')}</strong>
              <em> (press Enter to continue)</em>
            </span>
          )}
        </div>

        {history.length > 0 && (
          <div className="recent-misses">
            <span className="eyebrow">Recent misses</span>
            <div>
              {history.slice(0, 8).map((h, i) => (
                <span key={i} className="chip" title={`you typed "${h.input}"`}>
                  <span lang="ja">{h.kana.char}</span> {h.kana.romaji}
                </span>
              ))}
            </div>
          </div>
        )}

        <button className="btn link" onClick={() => setPhase(stats.answered ? 'summary' : 'setup')}>
          ■ Stop and see summary
        </button>
      </div>
    </section>
  );
}
