# Kana Quiz — learn Hiragana & Katakana line by line

A small React app (only `react` + `react-dom` at runtime) that teaches the kana one line at a time.

## How it works

1. **Study**: the current line is displayed with its romaji (e.g. か き く け こ → ka ki ku ke ko).
2. **Quiz**: click *"I've memorized it"* and type the romaji for each kana.
   - Line 1 = **20 questions**, and each following line adds **+5** (line 2 = 25, line 3 = 30, … line 26 = 145).
   - Questions mix the current line **and all previous lines**. Every unlocked kana appears at least once,
     the newest line is weighted ×2 in the remaining slots, and the same kana never appears twice in a row.
3. **Results**: **≥ 80%** unlocks the next line. Otherwise retry the quiz or study the line again.
4. **Start from line**: a dropdown on the study screen lets you jump to any line. Quizzes for that line still
   include all earlier lines.

5. **Endless mode** (`#/endless`): pick Hiragana, Katakana or both mixed (208 kana) and answer an unlimited
   random stream. Kana you miss come back more often; stop any time for a summary of your most-missed characters.

Progress is intentionally **not** saved: every visit starts fresh.

### Lines (26 per script)

| Group | Lines |
|---|---|
| Basic | a · ka · sa · ta · na · ha · ma · ya · ra · wa/wo/n |
| Dakuten | ga · za · da · ba |
| Handakuten | pa |
| Yōon | kya · sha · cha · nya · hya · mya · rya · gya · ja · bya · pya |

Accepted romaji variants: shi/si, chi/ti, tsu/tu, fu/hu, ji/zi, wo/o, n/nn, ぢ ji/di, づ zu/du,
sha/sya, cha/tya/cya, ja/jya/zya…
Input is case-insensitive, and full-width letters and spaces are ignored.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # logic tests (node:test, no extra deps)
npm run build    # → dist/
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (branch `main`).
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml` (install → test → build → deploy).

Works for both `user.github.io` and `user.github.io/repo-name` URLs thanks to `base: './'` and hash routing
(`#/hiragana`, `#/katakana`), so no 404 workaround is needed.

## Structure

```
src/
  data/kana.js          hiragana table (katakana derived by Unicode offset)
  lib/quiz.js           question count, generator, answer checker (pure, tested)
  lib/useHashRoute.js   ~15-line hash router
  components/           Home, KanaTrainer (state machine), Study/Quiz/Results/Complete screens, LineSelect, EndlessScreen
tests/quiz.test.js
```

## Tweak

All rules live at the top of `src/lib/quiz.js`: `BASE_QUESTIONS`, `QUESTIONS_PER_LINE`, `PASS_RATIO`.
