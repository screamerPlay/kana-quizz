// "Start from line" dropdown, grouped Basic / Dakuten / Handakuten / Yōon.
export default function LineSelect({ lines, value, onChange }) {
  const groups = [...new Set(lines.map((l) => l.group))];
  return (
    <label className="line-select">
      <span>Start from line</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {lines
              .filter((l) => l.group === g)
              .map((l) => (
                <option key={l.id} value={l.index}>
                  {l.index + 1}. {l.label} ({l.id})
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
