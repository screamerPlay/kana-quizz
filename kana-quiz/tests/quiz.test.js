import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCRIPTS, toKatakana } from '../src/data/kana.js';
import { questionCount, generateQuiz, isCorrect, hasPassed, normalize } from '../src/lib/quiz.js';

const { hiragana, katakana } = SCRIPTS;

test('26 lines per script, 104 kana total', () => {
  for (const s of [hiragana, katakana]) {
    assert.equal(s.lines.length, 26);
    assert.equal(s.lines.flatMap((l) => l.kana).length, 104);
  }
});

test('katakana conversion', () => {
  assert.equal(toKatakana('あ'), 'ア');
  assert.equal(toKatakana('きゃ'), 'キャ');
  assert.equal(toKatakana('を'), 'ヲ');
  assert.equal(toKatakana('ん'), 'ン');
  assert.equal(katakana.lines[15].kana[0].char, 'キャ');
});

test('question count: 20, +5 per line', () => {
  assert.equal(questionCount(0), 20);
  assert.equal(questionCount(1), 25);
  assert.equal(questionCount(9), 65);
  assert.equal(questionCount(25), 145);
});

test('every generated quiz: right length, only unlocked kana, full coverage, no back-to-back repeats', () => {
  for (const s of [hiragana, katakana]) {
    for (let i = 0; i < s.lines.length; i++) {
      for (let run = 0; run < 20; run++) {
        const quiz = generateQuiz(s.lines, i);
        assert.equal(quiz.length, questionCount(i));
        const allowed = new Set(s.lines.slice(0, i + 1).flatMap((l) => l.kana.map((k) => k.char)));
        const seen = new Set(quiz.map((q) => q.char));
        for (const c of seen) assert.ok(allowed.has(c), `${c} not unlocked at line ${i}`);
        assert.equal(seen.size, allowed.size, `line ${i}: every unlocked kana appears`);
        for (let q = 1; q < quiz.length; q++) assert.notEqual(quiz[q].char, quiz[q - 1].char, `repeat at line ${i}`);
      }
    }
  }
});

test('romaji checker accepts alternatives, rejects wrong answers', () => {
  const find = (c) => hiragana.lines.flatMap((l) => l.kana).find((k) => k.char === c);
  assert.ok(isCorrect(find('し'), 'shi'));
  assert.ok(isCorrect(find('し'), ' SI '));
  assert.ok(isCorrect(find('つ'), 'tu'));
  assert.ok(isCorrect(find('ふ'), 'hu'));
  assert.ok(isCorrect(find('を'), 'o'));
  assert.ok(isCorrect(find('ん'), 'nn'));
  assert.ok(isCorrect(find('ぢ'), 'di'));
  assert.ok(isCorrect(find('じゃ'), 'zya'));
  assert.ok(isCorrect(find('ちょ'), 'tyo'));
  assert.ok(isCorrect(find('か'), 'ｋａ'), 'full-width input');
  assert.ok(!isCorrect(find('か'), 'ga'));
  assert.ok(!isCorrect(find('か'), ''));
  assert.equal(normalize(" Sh i "), 'shi');
});

test('pass threshold is 80%', () => {
  assert.ok(hasPassed(16, 20));
  assert.ok(!hasPassed(15, 20));
  assert.ok(hasPassed(116, 145));
  assert.ok(!hasPassed(115, 145));
});
