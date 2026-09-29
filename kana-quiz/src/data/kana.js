// Kana data. Each entry: [kana, canonicalRomaji, ...acceptedAlternatives]
// Katakana is derived from hiragana (Unicode offset 0x60), so only one table to maintain.

const HIRAGANA_LINES = [
  // ── Basic (gojūon) ──
  { id: 'a', group: 'Basic', kana: [['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o']] },
  { id: 'ka', group: 'Basic', kana: [['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko']] },
  { id: 'sa', group: 'Basic', kana: [['さ', 'sa'], ['し', 'shi', 'si'], ['す', 'su'], ['せ', 'se'], ['そ', 'so']] },
  { id: 'ta', group: 'Basic', kana: [['た', 'ta'], ['ち', 'chi', 'ti'], ['つ', 'tsu', 'tu'], ['て', 'te'], ['と', 'to']] },
  { id: 'na', group: 'Basic', kana: [['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no']] },
  { id: 'ha', group: 'Basic', kana: [['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu', 'hu'], ['へ', 'he'], ['ほ', 'ho']] },
  { id: 'ma', group: 'Basic', kana: [['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo']] },
  { id: 'ya', group: 'Basic', kana: [['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo']] },
  { id: 'ra', group: 'Basic', kana: [['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro']] },
  { id: 'wa', group: 'Basic', kana: [['わ', 'wa'], ['を', 'wo', 'o'], ['ん', 'n', 'nn']] },

  // ── Dakuten ──
  { id: 'ga', group: 'Dakuten', kana: [['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go']] },
  { id: 'za', group: 'Dakuten', kana: [['ざ', 'za'], ['じ', 'ji', 'zi'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo']] },
  { id: 'da', group: 'Dakuten', kana: [['だ', 'da'], ['ぢ', 'ji', 'di', 'dzi'], ['づ', 'zu', 'du', 'dzu'], ['で', 'de'], ['ど', 'do']] },
  { id: 'ba', group: 'Dakuten', kana: [['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo']] },

  // ── Handakuten ──
  { id: 'pa', group: 'Handakuten', kana: [['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po']] },

  // ── Yōon (combinations) ──
  { id: 'kya', group: 'Yōon', kana: [['きゃ', 'kya'], ['きゅ', 'kyu'], ['きょ', 'kyo']] },
  { id: 'sha', group: 'Yōon', kana: [['しゃ', 'sha', 'sya'], ['しゅ', 'shu', 'syu'], ['しょ', 'sho', 'syo']] },
  { id: 'cha', group: 'Yōon', kana: [['ちゃ', 'cha', 'tya', 'cya'], ['ちゅ', 'chu', 'tyu', 'cyu'], ['ちょ', 'cho', 'tyo', 'cyo']] },
  { id: 'nya', group: 'Yōon', kana: [['にゃ', 'nya'], ['にゅ', 'nyu'], ['にょ', 'nyo']] },
  { id: 'hya', group: 'Yōon', kana: [['ひゃ', 'hya'], ['ひゅ', 'hyu'], ['ひょ', 'hyo']] },
  { id: 'mya', group: 'Yōon', kana: [['みゃ', 'mya'], ['みゅ', 'myu'], ['みょ', 'myo']] },
  { id: 'rya', group: 'Yōon', kana: [['りゃ', 'rya'], ['りゅ', 'ryu'], ['りょ', 'ryo']] },
  { id: 'gya', group: 'Yōon', kana: [['ぎゃ', 'gya'], ['ぎゅ', 'gyu'], ['ぎょ', 'gyo']] },
  { id: 'ja', group: 'Yōon', kana: [['じゃ', 'ja', 'jya', 'zya'], ['じゅ', 'ju', 'jyu', 'zyu'], ['じょ', 'jo', 'jyo', 'zyo']] },
  { id: 'bya', group: 'Yōon', kana: [['びゃ', 'bya'], ['びゅ', 'byu'], ['びょ', 'byo']] },
  { id: 'pya', group: 'Yōon', kana: [['ぴゃ', 'pya'], ['ぴゅ', 'pyu'], ['ぴょ', 'pyo']] },
];

/** Convert hiragana string to katakana (ぁ U+3041 … ゖ U+3096 → +0x60). */
export function toKatakana(str) {
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : ch;
    })
    .join('');
}

function build(convert) {
  return HIRAGANA_LINES.map((line, index) => ({
    id: line.id,
    index,
    group: line.group,
    label: convert(line.kana[0][0]),
    kana: line.kana.map(([k, romaji, ...alts]) => ({
      char: convert(k),
      romaji,
      accepted: [romaji, ...alts],
    })),
  }));
}

export const SCRIPTS = {
  hiragana: {
    id: 'hiragana',
    name: 'Hiragana',
    jp: 'ひらがな',
    lines: build((s) => s),
  },
  katakana: {
    id: 'katakana',
    name: 'Katakana',
    jp: 'カタカナ',
    lines: build(toKatakana),
  },
};
