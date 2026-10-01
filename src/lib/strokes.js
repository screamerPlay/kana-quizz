// Stroke geometry + handwriting scorer. Pure functions, unit-tested with node:test.
//
// Reference strokes come from KanjiVG SVG paths (109×109 box). User strokes come from the
// canvas as point lists. Both are normalised to the same frame before comparison, so size
// and position on the canvas don't matter — only shape, stroke count, order and direction.

export const SAMPLE_POINTS = 24;
export const SHAPE_TOLERANCE = 0.38; // blended point distance (in kana-size units) that scores 0
export const MAX_DEVIATION_WEIGHT = 0.4; // blend: (1-w)·mean distance + w·worst point distance
export const KANA_PASS_ACCURACY = 60; // a drawing "passes" at or above this accuracy (0–100)
export const ORDER_PENALTY = 0.6; // multiplier when strokes are drawn in the wrong order
export const DIRECTION_PENALTY = 0.5; // multiplier on a stroke drawn backwards

// ── SVG path → points ────────────────────────────────────────────────────────

function cubic(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return [
    mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
    mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
  ];
}

/** Flatten an SVG path (M/m, L/l, C/c, S/s, Z supported) into a polyline. */
export function parsePath(d, segments = 12) {
  const tokens = d.match(/[MmLlCcSsZz]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  const pts = [];
  let cur = [0, 0];
  let start = [0, 0];
  let lastCtrl = null;
  let cmd = null;
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  const isNum = () => i < tokens.length && !/^[A-Za-z]$/.test(tokens[i]);

  while (i < tokens.length) {
    if (!isNum()) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const off = rel ? cur : [0, 0];
    switch (cmd.toUpperCase()) {
      case 'M': {
        cur = [off[0] + num(), off[1] + num()];
        start = cur;
        pts.push(cur);
        lastCtrl = null;
        cmd = rel ? 'l' : 'L'; // subsequent pairs are implicit lineto
        break;
      }
      case 'L': {
        cur = [off[0] + num(), off[1] + num()];
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      case 'C':
      case 'S': {
        let c1;
        if (cmd.toUpperCase() === 'C') c1 = [off[0] + num(), off[1] + num()];
        else c1 = lastCtrl ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]] : cur;
        const c2 = [off[0] + num(), off[1] + num()];
        const end = [off[0] + num(), off[1] + num()];
        for (let s = 1; s <= segments; s++) pts.push(cubic(cur, c1, c2, end, s / segments));
        lastCtrl = c2;
        cur = end;
        break;
      }
      case 'Z': {
        cur = start;
        pts.push(cur);
        lastCtrl = null;
        break;
      }
      default:
        i++; // skip unsupported command
    }
  }
  return pts;
}

// ── Polyline helpers ─────────────────────────────────────────────────────────

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function pathLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
  return len;
}

/** Resample a polyline to exactly n points, evenly spaced along its length. */
export function resample(pts, n = SAMPLE_POINTS) {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array(n).fill(pts[0]);
  const total = pathLength(pts);
  if (total === 0) return Array(n).fill(pts[0]);
  const step = total / (n - 1);
  const out = [pts[0]];
  let acc = 0;
  let i = 1;
  let prev = pts[0];
  while (out.length < n && i < pts.length) {
    const d = dist(prev, pts[i]);
    if (acc + d >= step) {
      const t = (step - acc) / d;
      const p = [prev[0] + t * (pts[i][0] - prev[0]), prev[1] + t * (pts[i][1] - prev[1])];
      out.push(p);
      prev = p;
      acc = 0;
    } else {
      acc += d;
      prev = pts[i];
      i++;
    }
  }
  while (out.length < n) out.push(pts[pts.length - 1]);
  return out;
}

/** Light moving-average smoothing to remove pen/finger tremor before comparing. */
export function smooth(pts, passes = 2) {
  let out = pts;
  for (let p = 0; p < passes; p++) {
    if (out.length < 3) return out;
    const next = [out[0]];
    for (let i = 1; i < out.length - 1; i++)
      next.push([(out[i - 1][0] + out[i][0] + out[i + 1][0]) / 3, (out[i - 1][1] + out[i][1] + out[i + 1][1]) / 3]);
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

export function bbox(strokes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes)
    for (const [x, y] of s) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/**
 * Normalise a whole drawing: centre its bounding box at the origin and scale so the larger
 * side equals 1. Uses the whole-kana box, so relative stroke positions are preserved.
 */
export function normalizeStrokes(strokes) {
  const b = bbox(strokes);
  const size = Math.max(b.w, b.h, 1e-6);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return strokes.map((s) => s.map(([x, y]) => [(x - cx) / size, (y - cy) / size]));
}

/** Blend of mean and worst point-to-point distance between two resampled strokes. */
function strokeDistance(a, b) {
  let sum = 0, max = 0;
  for (let i = 0; i < a.length; i++) {
    const d = dist(a[i], b[i]);
    sum += d;
    if (d > max) max = d;
  }
  return (1 - MAX_DEVIATION_WEIGHT) * (sum / a.length) + MAX_DEVIATION_WEIGHT * max;
}

function permutations(n) {
  if (n === 0) return [[]];
  const out = [];
  for (const p of permutations(n - 1)) for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}

// ── Scorer ───────────────────────────────────────────────────────────────────

/**
 * Compare a user's drawing to reference SVG paths.
 * @param {string[]} refPaths  ordered KanjiVG path strings
 * @param {number[][][]} userStrokes  ordered strokes, each a list of [x, y]
 * @returns {{ accuracy:number, passed:boolean, countOk:boolean, orderOk:boolean, expected:number, drawn:number, strokes:Array<{score:number, reversed:boolean}> }}
 */
export function scoreDrawing(refPaths, userStrokes) {
  const expected = refPaths.length;
  const drawn = userStrokes.filter((s) => s.length > 0).length;
  const base = { expected, drawn, countOk: drawn === expected, orderOk: true, strokes: [] };
  if (drawn === 0) return { ...base, accuracy: 0, passed: false };

  const ref = normalizeStrokes(refPaths.map((d) => parsePath(d))).map((s) => resample(s));
  const usr = normalizeStrokes(userStrokes.filter((s) => s.length > 0).map((s) => smooth(resample(s, 48)))).map((s) => resample(s));

  // distance matrix (user i vs ref j), forward and reversed
  const n = usr.length, m = ref.length;
  const fwd = usr.map((u) => ref.map((r) => strokeDistance(u, r)));
  const rev = usr.map((u) => {
    const ur = [...u].reverse();
    return ref.map((r) => strokeDistance(ur, r));
  });
  const best = fwd.map((row, i) => row.map((v, j) => Math.min(v, rev[i][j])));

  // Order: compare in-order assignment with the best permutation (strokes ≤ 6, so brute force is fine)
  const k = Math.min(n, m);
  const identity = Array.from({ length: k }, (_, i) => best[i][i]).reduce((a, b) => a + b, 0);
  let orderOk = true;
  if (k > 1 && k <= 7) {
    let bestSum = Infinity;
    for (const p of permutations(k)) {
      let s = 0;
      for (let i = 0; i < k; i++) s += best[i][p[i]];
      if (s < bestSum) bestSum = s;
    }
    orderOk = identity <= bestSum + 0.06 * k;
  }

  // Per-stroke shape + direction scores (in-order pairing)
  const strokes = [];
  for (let i = 0; i < Math.max(n, m); i++) {
    if (i >= k) {
      strokes.push({ score: 0, reversed: false, missing: i >= n, extra: i >= m });
      continue;
    }
    const reversed = rev[i][i] < fwd[i][i] * 0.7;
    const d = Math.min(fwd[i][i], rev[i][i]);
    let score = Math.max(0, Math.min(1, 1 - d / SHAPE_TOLERANCE));
    if (reversed) score *= DIRECTION_PENALTY;
    strokes.push({ score, reversed });
  }

  let accuracy = strokes.reduce((a, s) => a + s.score, 0) / strokes.length;
  if (!orderOk) accuracy *= ORDER_PENALTY;
  accuracy = Math.round(accuracy * 100);

  return {
    ...base,
    orderOk,
    strokes,
    accuracy,
    passed: drawn === expected && orderOk && accuracy >= KANA_PASS_ACCURACY,
  };
}

/** Start point of a path — used to draw stroke-order numbers. */
export function pathStart(d) {
  const m = d.match(/^M\s*(-?[\d.]+)[ ,](-?[\d.]+)/);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
}
