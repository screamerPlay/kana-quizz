import { SCRIPTS } from '../data/kana.js';
import { BASE_QUESTIONS, QUESTIONS_PER_LINE, PASS_RATIO } from '../lib/quiz.js';

export default function Home() {
  return (
    <section className="home">
      <h1>Learn the kana, one line at a time</h1>
      <p className="lead">
        Study a line, then type the romaji for each character. Score {PASS_RATIO * 100}% or more to unlock the
        next line. Every quiz mixes in all previous lines: {BASE_QUESTIONS} questions for the first line, +
        {QUESTIONS_PER_LINE} per line after that.
      </p>
      <div className="home-cards">
        {Object.values(SCRIPTS).map((s) => (
          <a key={s.id} href={`#/${s.id}`} className="home-card">
            <span className="home-card-jp" lang="ja">{s.jp}</span>
            <span className="home-card-name">{s.name}</span>
            <span className="home-card-meta">{s.lines.length} lines · basic, dakuten, yōon</span>
          </a>
        ))}
      </div>
    </section>
  );
}
