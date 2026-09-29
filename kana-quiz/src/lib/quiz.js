// Pure quiz logic — no React, so it can be unit-tested with `node --test`.

export const BASE_QUESTIONS = 20;
export const QUESTIONS_PER_LINE = 5;
export const PASS_RATIO = 0.8;
const NEW_LINE_WEIGHT = 2; // newest line's kana are twice as likely in the random fill

/** Number of questions for a 0-based line index: 20, 25, 30, … */
export function questionCount(lineIndex) {
  return BASE_QUESTIONS + QUESTIONS_PER_LINE * lineIndex;
}

/** Normalise user input: lowercase, trim, drop spaces/apostrophes, full-width → ASCII. */
export function normalize(input) {
  return String(input)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s'’-]/g, '');
}

export function isCorrect(kana, input) {
  const answer = normalize(input);
  return answer.length > 0 && kana.accepted.includes(answer);
}

export function hasPassed(score, total) {
  return total > 0 && score / total >= PASS_RATIO;
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Order the picked questions randomly so the same kana never appears twice in a row.
 * Greedy: at each step pick a random kana (weighted by how many copies remain) that differs
 * from the previous one — but if one kana holds more than half the remaining slots, it must go now.
 */
function orderWithoutRepeats(list, rng) {
  const groups = new Map();
  for (const item of list) {
    if (!groups.has(item.char)) groups.set(item.char, []);
    groups.get(item.char).push(item);
  }
  const out = [];
  let remaining = list.length;
  let last = null;
  while (remaining > 0) {
    const entries = [...groups.entries()].filter(([, items]) => items.length > 0);
    const forced = entries.find(([c, items]) => c !== last && items.length > remaining / 2);
    let options = forced ? [forced] : entries.filter(([c]) => c !== last);
    if (options.length === 0) options = entries; // impossible to avoid (only one kana left)
    const total = options.reduce((n, [, items]) => n + items.length, 0);
    let r = rng() * total;
    let chosen = options[options.length - 1];
    for (const opt of options) {
      r -= opt[1].length;
      if (r < 0) { chosen = opt; break; }
    }
    out.push(chosen[1].pop());
    last = chosen[0];
    remaining--;
  }
  return out;
}

/**
 * Build the quiz for `lines[lineIndex]`, drawing from every line up to and including it.
 * - Every kana in the pool appears at least once (when the count allows — it always does with 26 lines).
 * - Remaining slots are filled randomly, newest line weighted ×2.
 * - Shuffled, with back-to-back repeats avoided.
 */
export function generateQuiz(lines, lineIndex, rng = Math.random) {
  const count = questionCount(lineIndex);
  const newest = lines[lineIndex].kana;
  const previous = lines.slice(0, lineIndex).flatMap((l) => l.kana);
  const pool = [...previous, ...newest];

  let picked;
  if (count >= pool.length) {
    picked = [...pool];
  } else {
    // Not enough slots: keep all of the newest line, sample the rest from earlier lines.
    picked = [...newest, ...shuffle(previous, rng).slice(0, count - newest.length)];
  }

  const weighted = [...previous, ...Array(NEW_LINE_WEIGHT).fill(newest).flat()];
  while (picked.length < count) {
    picked.push(weighted[Math.floor(rng() * weighted.length)]);
  }

  return orderWithoutRepeats(shuffle(picked, rng), rng);
}
