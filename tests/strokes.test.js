import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STROKES } from '../src/data/strokes.js';
import { SCRIPTS } from '../src/data/kana.js';
import { parsePath, resample, scoreDrawing, normalizeStrokes, pathStart } from '../src/lib/strokes.js';

const nonYoon = (s) => s.lines.filter((l) => l.group !== 'Yōon').flatMap((l) => l.kana.map((k) => k.char));

test('stroke data covers every non-yōon kana of both scripts', () => {
  for (const s of Object.values(SCRIPTS)) for (const c of nonYoon(s)) assert.ok(STROKES[c], `missing strokes for ${c}`);
  assert.equal(Object.keys(STROKES).length, 142);
});

test('parsePath flattens KanjiVG paths inside the 109 box', () => {
  for (const paths of Object.values(STROKES))
    for (const d of paths) {
      const pts = parsePath(d);
      assert.ok(pts.length >= 2);
      for (const [x, y] of pts) assert.ok(x >= -5 && x <= 115 && y >= -5 && y <= 115, `${d} → ${x},${y}`);
    }
  assert.deepEqual(parsePath('M10,10 L20,10'), [[10, 10], [20, 10]]);
  assert.deepEqual(pathStart('M31.01,33c0.88,0.88'), [31.01, 33]);
});

test('resample gives n evenly spaced points', () => {
  const r = resample([[0, 0], [10, 0]], 6);
  assert.equal(r.length, 6);
  assert.deepEqual(r[3].map(Math.round), [6, 0]);
  const n = normalizeStrokes([[[0, 0], [10, 20]]]);
  assert.deepEqual(n[0][0], [-0.25, -0.5]);
});

// Simulate a user tracing the reference (with jitter / scale / offset) → should pass.
// `wobble` = per-stroke shift (fraction of the 109 box) + per-stroke scale jitter + small tremor
const jitter = (paths, { scale = 1, dx = 0, dy = 0, wobble = 0, noise = 0, reverse = false, order = null } = {}) => {
  let strokes = paths.map((d) => {
    const sx = dx + (Math.random() - 0.5) * wobble * 109 * scale, sy = dy + (Math.random() - 0.5) * wobble * 109 * scale;
    const k = scale * (1 + (Math.random() - 0.5) * wobble);
    return parsePath(d).map(([x, y]) => [x * k + sx + (Math.random() - 0.5) * noise, y * k + sy + (Math.random() - 0.5) * noise]);
  });
  if (reverse) strokes = strokes.map((s, i) => (i === 0 ? [...s].reverse() : s));
  if (order) strokes = order.map((i) => strokes[i]);
  return strokes;
};

test('a faithful (scaled, shifted, noisy) tracing passes for every kana', () => {
  for (const [char, paths] of Object.entries(STROKES)) {
    const r = scoreDrawing(paths, jitter(paths, { scale: 3, dx: 40, dy: -20, wobble: 0.08, noise: 4 }));
    assert.ok(r.passed, `${char} failed: ${JSON.stringify(r)}`);
    assert.ok(r.accuracy >= 65, `${char} accuracy ${r.accuracy}`);
  }
});

test('wrong stroke count fails', () => {
  const paths = STROKES['あ'];
  const r = scoreDrawing(paths, jitter(paths).slice(0, 2));
  assert.equal(r.countOk, false);
  assert.equal(r.passed, false);
  assert.equal(scoreDrawing(paths, []).accuracy, 0);
});

test('wrong stroke order is detected and penalised', () => {
  const paths = STROKES['い']; // 2 clearly separate strokes
  const ok = scoreDrawing(paths, jitter(paths));
  const swapped = scoreDrawing(paths, jitter(paths, { order: [1, 0] }));
  assert.equal(ok.orderOk, true);
  assert.equal(swapped.orderOk, false);
  assert.equal(swapped.passed, false);
  assert.ok(swapped.accuracy < ok.accuracy);
});

test('a reversed stroke is flagged and penalised', () => {
  const paths = STROKES['し'];
  const ok = scoreDrawing(paths, jitter(paths));
  const rev = scoreDrawing(paths, jitter(paths, { reverse: true }));
  assert.equal(rev.strokes[0].reversed, true);
  assert.ok(rev.accuracy <= ok.accuracy * 0.6);
});

test('drawing a different kana scores low', () => {
  const r = scoreDrawing(STROKES['あ'], jitter(STROKES['お']));
  assert.ok(r.accuracy < 60, `お-as-あ scored ${r.accuracy}`);
  const r2 = scoreDrawing(STROKES['さ'], jitter(STROKES['き']));
  assert.ok(!r2.passed);
});
