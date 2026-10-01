import { SCRIPTS } from '../data/kana.js';
import { BASE_QUESTIONS, QUESTIONS_PER_LINE, PASS_RATIO } from '../lib/quiz.js';

export default function Home() {
  return (
    <section className="home">
      <h1>Learn the kana, one line at a time</h1>
      <p className="lead">
        Study a line, then type the romaji for each character. Score {PASS_RATIO * 100}% or more to unlock the
        next line. Every quiz mixes in all previous lines: {BASE_QUESTIONS} questions for the first line, +
        {QUESTIONS_PER_LINE} per line after that. Each script has a <strong>Read</strong> mode (kana → romaji) and a{' '}
        <strong>Write</strong> mode (romaji → draw the kana, judged on stroke shape and order).
      </p>
      <div className="home-cards">
        {Object.values(SCRIPTS).map((s) => (
          <div key={s.id} className="home-card">
            <span className="home-card-jp" lang="ja">{s.jp}</span>
            <span className="home-card-name">{s.name}</span>
            <span className="home-card-meta">{s.lines.length} lines · basic, dakuten, yōon</span>
            <span className="home-card-links">
              <a href={`#/${s.id}`} className="btn primary">Read →</a>
              <a href={`#/${s.id}/write`} className="btn">✎ Write →</a>
            </span>
          </div>
        ))}
        <a href="#/endless" className="home-card endless">
          <span className="home-card-jp">∞</span>
          <span className="home-card-name">Endless mode</span>
          <span className="home-card-meta">all 104 kana per script, or both mixed · no end, adaptive</span>
        </a>
      </div>
    </section>
  );
}
