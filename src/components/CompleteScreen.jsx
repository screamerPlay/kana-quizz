export default function CompleteScreen({ script, mode = 'read', lineCount, onRestart }) {
  const other = script.id === 'hiragana' ? { id: 'katakana', name: 'Katakana' } : { id: 'hiragana', name: 'Hiragana' };
  return (
    <div className="card complete">
      <div className="complete-jp" lang="ja">おめでとう！</div>
      <h2>You've completed all {lineCount ?? script.lines.length} {script.name} {mode === 'write' ? 'writing' : ''} lines</h2>
      <p>{mode === 'write' ? 'Basic kana, dakuten and handakuten: you can write them all.' : 'Basic kana, dakuten, handakuten and yōon: all done.'}</p>
      <div className="actions">
        <button className="btn primary big" onClick={onRestart}>Restart from line 1</button>
        <a className="btn" href={`#/${other.id}${mode === 'write' ? '/write' : ''}`}>Try {other.name} →</a>
        <a className="btn" href={`#/${script.id}${mode === 'write' ? '' : '/write'}`}>
          {mode === 'write' ? `Read ${script.name} →` : `Write ${script.name} →`}
        </a>
      </div>
    </div>
  );
}
