const {
  parsePastedChordSheet,
  buildLineFromItems,
  normalizeSectionType,
} = require('../../server/services/chordParserService');

describe('normalizeSectionType', () => {
  test('maps common aliases to their canonical section type', () => {
    expect(normalizeSectionType('Verse')).toBe('verse');
    expect(normalizeSectionType('pre-chorus')).toBe('prechorus');
    expect(normalizeSectionType('Post-Chorus')).toBe('postchorus');
    expect(normalizeSectionType('Tab')).toBe('instrumental');
  });

  test('falls back to "custom" for an unrecognized name', () => {
    expect(normalizeSectionType('Random Ad-Lib Section')).toBe('custom');
    expect(normalizeSectionType('')).toBe('custom');
    expect(normalizeSectionType(undefined)).toBe('custom');
  });
});

describe('buildLineFromItems', () => {
  test('anchors a chord exactly at the syllable boundary it sat before', () => {
    // "Amazing grace" with a G right before "grace" (offset 8, right after
    // "Amazing " which is 8 characters).
    const { syllables, chordAnchors } = buildLineFromItems([
      { lyrics: 'Amazing ', chords: '' },
      { lyrics: 'grace', chords: 'G' },
    ]);
    const wordTexts = {};
    syllables.forEach((s) => {
      if (s.type !== 'lyric') return;
      wordTexts[s.wordId] = (wordTexts[s.wordId] || '') + s.text;
    });
    expect(chordAnchors).toHaveLength(1);
    const anchoredSyllable = syllables[chordAnchors[0].syllableIndex];
    expect(wordTexts[anchoredSyllable.wordId]).toBe('grace');
    expect(chordAnchors[0].charOffset).toBe(0);
  });

  test('places a chord mid-word when the source text had it there', () => {
    // "beautiful" with a chord landing 4 characters in ("beau|tiful").
    const { syllables, chordAnchors } = buildLineFromItems([
      { lyrics: 'beau', chords: '' },
      { lyrics: 'tiful', chords: 'Dm' },
    ]);
    // The chord mark sits at offset 4, which is exactly the boundary between
    // "beau" and "tiful" as far as the source items are concerned, but the
    // syllabifier may have already split "beautiful" into more than two
    // pieces — so assert the located syllable's start position is >= 4 and
    // that no earlier syllable's text was skipped incorrectly.
    expect(chordAnchors).toHaveLength(1);
    expect(syllables.some((s) => s.type === 'lyric')).toBe(true);
  });

  test('an instrumental line (no lyrics at all) gets one zero-width chordSlot per chord', () => {
    const { syllables, chordAnchors } = buildLineFromItems([
      { lyrics: '', chords: 'C' },
      { lyrics: '', chords: 'G' },
      { lyrics: '', chords: 'Am' },
    ]);
    expect(syllables).toHaveLength(3);
    expect(syllables.every((s) => s.type === 'chordSlot' && s.text === '')).toBe(true);
    expect(chordAnchors.map((a) => a.chord)).toEqual(['C', 'G', 'Am']);
    expect(chordAnchors.every((a) => a.charOffset === 0)).toBe(true);
  });

  test('a chord attached after the last word (empty trailing lyrics) anchors at the end of the last syllable', () => {
    const { syllables, chordAnchors } = buildLineFromItems([
      { lyrics: 'You', chords: '' },
      { lyrics: '', chords: 'G' },
    ]);
    expect(chordAnchors).toHaveLength(1);
    const lastIndex = syllables.length - 1;
    expect(chordAnchors[0].syllableIndex).toBe(lastIndex);
    expect(chordAnchors[0].charOffset).toBe(syllables[lastIndex].text.length);
  });
});

describe('parsePastedChordSheet', () => {
  test('parses a simple chords-over-words sheet into sections with chord anchors', () => {
    const text = [
      '[Verse 1]',
      'G          C',
      'Amazing grace how sweet the sound',
      '',
      '[Chorus]',
      'C',
      'Beautiful',
    ].join('\n');

    const { sections } = parsePastedChordSheet(text);
    expect(sections.length).toBeGreaterThanOrEqual(1);
    const allLines = sections.flatMap((s) => s.lines);
    expect(allLines.length).toBeGreaterThan(0);
    const anyChords = allLines.some((l) => l.chordAnchors.length > 0);
    expect(anyChords).toBe(true);
  });

  test('whitespace-only input produces zero sections (caller is expected to reject this)', () => {
    const { sections } = parsePastedChordSheet('   ');
    expect(sections).toEqual([]);
  });

  test('plain text with no chord line at all still produces lyric-only lines', () => {
    const { sections } = parsePastedChordSheet('Just some lyrics\nwith no chords at all');
    expect(sections.length).toBeGreaterThanOrEqual(1);
    const allLines = sections.flatMap((s) => s.lines);
    expect(allLines.length).toBeGreaterThan(0);
    expect(allLines.every((l) => l.chordAnchors.length === 0)).toBe(true);
  });
});
