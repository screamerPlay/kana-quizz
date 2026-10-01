import { useState } from 'react';
import { generateQuiz, hasPassed } from '../lib/quiz.js';
import StudyScreen from './StudyScreen.jsx';
import QuizScreen from './QuizScreen.jsx';
import ResultsScreen from './ResultsScreen.jsx';
import CompleteScreen from './CompleteScreen.jsx';
import WriteStudyScreen from './WriteStudyScreen.jsx';
import WriteQuizScreen from './WriteQuizScreen.jsx';
import { STROKES } from '../data/strokes.js';

// State machine: study → quiz → results → (study next line | quiz again | study again) … → complete
export default function KanaTrainer({ script, mode = 'read' }) {
  // Writing mode skips yōon lines (they are combinations of kana already learned) and
  // only keeps kana we have stroke data for.
  const lines =
    mode === 'write'
      ? script.lines.filter((l) => l.group !== 'Yōon' && l.kana.every((k) => STROKES[k.char])).map((l, index) => ({ ...l, index }))
      : script.lines;
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState('study');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [quizId, setQuizId] = useState(0);
  const [showModel, setShowModel] = useState(true); // write mode: show the kana next to the romaji

  const line = lines[lineIndex];

  const startQuiz = () => {
    setQuestions(generateQuiz(lines, lineIndex));
    setAnswers([]);
    setQuizId((n) => n + 1);
    setPhase('quiz');
  };

  const goToLine = (index) => {
    setLineIndex(index);
    setPhase('study');
  };

  const finishQuiz = (results) => {
    setAnswers(results);
    setPhase('results');
  };

  const nextLine = () => {
    if (lineIndex + 1 >= lines.length) setPhase('complete');
    else goToLine(lineIndex + 1);
  };

  const score = answers.filter((a) => a.correct).length;

  return (
    <section className="trainer">
      <div className="trainer-head">
        <div className="trainer-title">
          <h1>
            <span lang="ja">{script.jp}</span> {script.name}
          </h1>
          <nav className="mode-switch" aria-label="Mode">
            <a href={`#/${script.id}`} className={mode === 'read' ? 'active' : ''}>Read</a>
            <a href={`#/${script.id}/write`} className={mode === 'write' ? 'active' : ''}>Write</a>
          </nav>
        </div>
        <div className="line-progress" aria-label="Line progress">
          {lines.map((l) => (
            <span
              key={l.id}
              title={`${l.index + 1}. ${l.label} (${l.id})`}
              className={l.index < lineIndex ? 'done' : l.index === lineIndex ? 'current' : ''}
            />
          ))}
        </div>
      </div>

      {phase === 'study' && mode === 'read' && (
        <StudyScreen lines={lines} line={line} onLineChange={goToLine} onStart={startQuiz} />
      )}
      {phase === 'study' && mode === 'write' && (
        <WriteStudyScreen lines={lines} line={line} onLineChange={goToLine} onStart={startQuiz} />
      )}
      {phase === 'quiz' && mode === 'read' && (
        <QuizScreen key={quizId} line={line} questions={questions} onFinish={finishQuiz} onQuit={() => setPhase('study')} />
      )}
      {phase === 'quiz' && mode === 'write' && (
        <WriteQuizScreen
          key={quizId}
          script={script}
          line={line}
          questions={questions}
          onFinish={finishQuiz}
          onQuit={() => setPhase('study')}
          showModel={showModel}
          onToggleModel={() => setShowModel((v) => !v)}
        />
      )}
      {phase === 'results' && (
        <ResultsScreen
          mode={mode}
          line={line}
          isLast={lineIndex + 1 >= lines.length}
          answers={answers}
          score={score}
          passed={hasPassed(score, answers.length)}
          onNext={nextLine}
          onRetry={startQuiz}
          onStudy={() => setPhase('study')}
        />
      )}
      {phase === 'complete' && <CompleteScreen script={script} mode={mode} lineCount={lines.length} onRestart={() => goToLine(0)} />}
    </section>
  );
}
