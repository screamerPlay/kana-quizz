import { useState } from 'react';
import { generateQuiz, hasPassed } from '../lib/quiz.js';
import StudyScreen from './StudyScreen.jsx';
import QuizScreen from './QuizScreen.jsx';
import ResultsScreen from './ResultsScreen.jsx';
import CompleteScreen from './CompleteScreen.jsx';

// State machine: study → quiz → results → (study next line | quiz again | study again) … → complete
export default function KanaTrainer({ script }) {
  const { lines } = script;
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState('study');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [quizId, setQuizId] = useState(0);

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
        <h1>
          <span lang="ja">{script.jp}</span> {script.name}
        </h1>
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

      {phase === 'study' && (
        <StudyScreen lines={lines} line={line} onLineChange={goToLine} onStart={startQuiz} />
      )}
      {phase === 'quiz' && (
        <QuizScreen key={quizId} line={line} questions={questions} onFinish={finishQuiz} onQuit={() => setPhase('study')} />
      )}
      {phase === 'results' && (
        <ResultsScreen
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
      {phase === 'complete' && <CompleteScreen script={script} onRestart={() => goToLine(0)} />}
    </section>
  );
}
