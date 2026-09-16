const { tokenizeLine, nextWordId } = require('../../server/utils/lineTokenizer');

describe('nextWordId', () => {
  test('never returns the same id twice', () => {
    const ids = new Set(Array.from({ length: 50 }, () => nextWordId()));
    expect(ids.size).toBe(50);
  });
});

describe('tokenizeLine', () => {
  test('splits words and spaces, syllabifying each word', () => {
    const syllables = tokenizeLine('Amazing grace');
    const words = syllables.filter((s) => s.type === 'lyric');
    const spaces = syllables.filter((s) => s.type === 'space');
    expect(spaces).toHaveLength(1);
    expect(words.length).toBeGreaterThanOrEqual(2);
  });

  test('gives every syllable of the same word the same wordId', () => {
    const syllables = tokenizeLine('beautiful');
    const wordIds = new Set(syllables.filter((s) => s.type === 'lyric').map((s) => s.wordId));
    expect(wordIds.size).toBe(1);
  });

  test('marks isWordStart/isWordEnd correctly on a multi-syllable word', () => {
    const syllables = tokenizeLine('beautiful').filter((s) => s.type === 'lyric');
    expect(syllables[0].isWordStart).toBe(true);
    expect(syllables[0].isWordEnd).toBe(false);
    expect(syllables[syllables.length - 1].isWordStart).toBe(false);
    expect(syllables[syllables.length - 1].isWordEnd).toBe(true);
  });

  test('returns an empty array for blank input', () => {
    expect(tokenizeLine('')).toEqual([]);
    expect(tokenizeLine('   ')).toEqual([]);
  });
});
