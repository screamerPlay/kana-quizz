import { useHashRoute } from './lib/useHashRoute.js';
import { SCRIPTS } from './data/kana.js';
import KanaTrainer from './components/KanaTrainer.jsx';
import Home from './components/Home.jsx';
import EndlessScreen from './components/EndlessScreen.jsx';

export default function App() {
  const route = useHashRoute();
  const script = SCRIPTS[route];

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="brand-mark">かな</span> Kana Quiz
        </a>
        <nav>
          {Object.values(SCRIPTS).map((s) => (
            <a key={s.id} href={`#/${s.id}`} className={route === s.id ? 'active' : ''}>
              <span lang="ja">{s.jp}</span> {s.name}
            </a>
          ))}
          <a href="#/endless" className={route === 'endless' ? 'active' : ''}>∞ Endless</a>
        </nav>
      </header>

      <main className="content">
        {/* key resets all trainer state when switching script */}
        {script ? <KanaTrainer key={script.id} script={script} /> : route === 'endless' ? <EndlessScreen /> : <Home />}
      </main>

      <footer className="footer">Study a line · take the quiz · 80% unlocks the next line</footer>
    </div>
  );
}
