export default function CompleteScreen({ script, onRestart }) {
  const other = script.id === 'hiragana' ? { id: 'katakana', name: 'Katakana' } : { id: 'hiragana', name: 'Hiragana' };
  return (
    <div className="card complete">
      <div className="complete-jp" lang="ja">おめでとう！</div>
      <h2>You've completed all {script.lines.length} {script.name} lines</h2>
      <p>Basic kana, dakuten, handakuten and yōon: all done.</p>
      <div className="actions">
        <button className="btn primary big" onClick={onRestart}>Restart from line 1</button>
        <a className="btn" href={`#/${other.id}`}>Try {other.name} →</a>
      </div>
    </div>
  );
}
