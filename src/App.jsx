import { useHashRoute } from './lib/useHashRoute.js';
import { SCRIPTS } from './data/kana.js';
import KanaTrainer from './components/KanaTrainer.jsx';
import Home from './components/Home.jsx';
import EndlessScreen from './components/EndlessScreen.jsx';

export default function App() {
  const hash = useHashRoute();
  const [route, sub] = hash.split('/');
  const script = SCRIPTS[route];
  const mode = sub === 'write' ? 'write' : 'read';

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
        {script ? <KanaTrainer key={`${script.id}-${mode}`} script={script} mode={mode} /> : route === 'endless' ? <EndlessScreen /> : <Home />}
      </main>

      <footer className="footer">
        Study a line · take the quiz · 80% unlocks the next line
        <br />
        Stroke-order data from <a href="http://kanjivg.tagaini.net" target="_blank" rel="noopener noreferrer">KanjiVG</a> (CC BY-SA 3.0)
      </footer>
    </div>
  );
}
