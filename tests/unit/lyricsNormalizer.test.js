const { cleanText, normalizeLyricsText } = require('../../server/services/lyricsNormalizer');

describe('cleanText', () => {
  test('converts curly quotes/apostrophes to straight ones', () => {
    expect(cleanText('‘hello’ “world”')).toBe('\'hello\' "world"');
  });

  test('collapses repeated spaces without touching single line breaks', () => {
    expect(cleanText('one   two\nthree')).toBe('one two\nthree');
  });

  test('collapses 3+ blank lines down to a single blank line', () => {
    expect(cleanText('one\n\n\n\ntwo')).toBe('one\n\ntwo');
  });

  test('returns an empty string for falsy input', () => {
    expect(cleanText('')).toBe('');
    expect(cleanText(null)).toBe('');
  });
});

describe('normalizeLyricsText', () => {
  test('detects bracketed section headers and starts a new section', () => {
    const { sections } = normalizeLyricsText('[Verse 1]\nAmazing grace\n\n[Chorus]\nHow sweet the sound');
    expect(sections).toHaveLength(2);
    expect(sections[0].type).toBe('verse');
    expect(sections[1].type).toBe('chorus');
    expect(sections[0].lines).toHaveLength(1);
    expect(sections[1].lines).toHaveLength(1);
  });

  test('every line comes back with empty chordAnchors (lyrics-only import)', () => {
    const { sections } = normalizeLyricsText('[Verse]\nJust some words\nAnd some more');
    const allAnchors = sections.flatMap((s) => s.lines).flatMap((l) => l.chordAnchors);
    expect(allAnchors).toEqual([]);
  });

  test('text with no header at all still lands in a default "Verse" section', () => {
    const { sections } = normalizeLyricsText('No header here\nJust lyrics');
    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('verse');
    expect(sections[0].lines).toHaveLength(2);
  });

  test('blank lines are skipped rather than stored as empty lines', () => {
    const { sections } = normalizeLyricsText('[Verse]\nLine one\n\n\nLine two');
    expect(sections[0].lines).toHaveLength(2);
  });
});
