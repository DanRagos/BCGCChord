const { splitWordIntoSyllables } = require('../../server/utils/syllabifier');

describe('splitWordIntoSyllables', () => {
  test('splits a multi-syllable word', () => {
    expect(splitWordIntoSyllables('beautiful')).toEqual(['beau', 'ti', 'ful']);
  });

  test('does not over-split a short/common word', () => {
    expect(splitWordIntoSyllables('love')).toEqual(['love']);
  });

  test('preserves leading/trailing punctuation attached to the word', () => {
    // "grace," should split around the trailing comma without losing it.
    const pieces = splitWordIntoSyllables('grace,');
    expect(pieces.join('')).toBe('grace,');
  });

  test('handles an apostrophe inside the word', () => {
    const pieces = splitWordIntoSyllables("don't");
    expect(pieces.join('')).toBe("don't");
  });

  test('returns the input unchanged for falsy input', () => {
    expect(splitWordIntoSyllables('')).toEqual(['']);
  });
});
