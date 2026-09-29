import { useEffect, useRef, useState } from 'react';
import { isCorrect } from '../lib/quiz.js';

const AUTO_ADVANCE_MS = 550;

export default function QuizScreen({ line, questions, onFinish, onQuit }) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null); // null | { correct: boolean }
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  const current = questions[index];
  const score = results.filter((r) => r.correct).length;

  const advance = (allResults) => {
    if (index + 1 >= questions.length) {
      onFinish(allResults);
      return;
    }
    setIndex((i) => i + 1);
    setInput('');
    setFeedback(null);
  };

  // Correct answers move on automatically after a short flash.
  useEffect(() => {
    if (!feedback?.correct) return;
    const t = setTimeout(() => advance(results), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    inputRef.current?.focus();
  }, [index, feedback]);

  const submit = (e) => {
    e.preventDefault();
    if (feedback) {
      // Wrong answer shown → Enter continues
      if (!feedback.correct) advance(results);
      return;
    }
    if (!input.trim()) return;
    const correct = isCorrect(current, input);
    setResults((r) => [...r, { kana: current, input: input.trim(), correct }]);
    setFeedback({ correct });
  };

  const answered = results.length;
  return (
    <div className="card quiz">
      <div className="quiz-top">
        <span className="eyebrow">
          Line {line.index + 1} quiz · question {index + 1} / {questions.length}
        </span>
        <span className="quiz-score">
          ✓ {score} · ✗ {answered - score}
        </span>
      </div>
      <div className="progress">
        <div style={{ width: `${(answered / questions.length) * 100}%` }} />
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

      <button className="btn link" onClick={onQuit}>
        ← Quit and go back to the study sheet
      </button>
    </div>
  );
}
