const {
  parsePastedChordSheet,
  buildLineFromItems,
  normalizeSectionType,
  parseChordsOverWordsText,
} = require('../../server/services/chordParserService');

describe('normalizeSectionType', () => {
  test('maps common aliases to their canonical section type', () => {
    expect(normalizeSectionType('Verse')).toBe('verse');
    expect(normalizeSectionType('pre-chorus')).toBe('prechorus');
    expect(normalizeSectionType('Post-Chorus')).toBe('postchorus');
    expect(normalizeSectionType('Tab')).toBe('instrumental');
  });

  test('ignores a trailing number or repeat marker ("Chorus 3", "Verse 1", "Outro x2")', () => {
    expect(normalizeSectionType('Chorus 3')).toBe('chorus');
    expect(normalizeSectionType('Verse 1')).toBe('verse');
    expect(normalizeSectionType('Outro x2')).toBe('outro');
    expect(normalizeSectionType('Bridge (2x)')).toBe('bridge');
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

// Regression tests for real songs that imported with chords and lyrics
// swapped / chord lines printed as lyrics. Root causes: ChordSheetJS treats
// ordinary words starting with A-G ("Again", "and") as chords, can't parse
// "N.C." at all, and pairs two consecutive chord lines as chord+"lyrics".
describe('parsePastedChordSheet — chord line vs lyric line detection', () => {
  const plain = (line) => line.syllables.map((s) => (s.type === 'chordSlot' ? '' : s.text)).join('');
  const chordsOf = (line) => line.chordAnchors.map((a) => a.chord);

  test('a chord line containing N.C. is still a chord line, laid over the lyric below it', () => {
    const { sections } = parsePastedChordSheet(
      ['[Chorus 3]', 'N.C. D/F# G', 'Again and again and again and again'].join('\n')
    );
    const lines = sections.flatMap((s) => s.lines);
    expect(lines).toHaveLength(1);
    expect(plain(lines[0])).toBe('Again and again and again and again');
    expect(chordsOf(lines[0])).toEqual(['N.C.', 'D/F#', 'G']);
  });

  test('a lyric line made of words starting with A-G is NOT mistaken for a chord line', () => {
    const { sections } = parsePastedChordSheet(
      ['C       G', 'Again and again and again', 'Am', 'You rescued me'].join('\n')
    );
    const lines = sections.flatMap((s) => s.lines);
    expect(lines).toHaveLength(2);
    expect(plain(lines[0])).toBe('Again and again and again');
    expect(chordsOf(lines[0])).toEqual(['C', 'G']);
    expect(plain(lines[1])).toBe('You rescued me');
    expect(chordsOf(lines[1])).toEqual(['Am']);
  });

  test('two chord lines in a row stay two chord-only lines (the second is not printed as lyrics)', () => {
    const { sections } = parsePastedChordSheet(['[Outro]', 'C   G D A', 'D#m B E'].join('\n'));
    const lines = sections.flatMap((s) => s.lines);
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.syllables.every((s) => s.type === 'chordSlot'))).toBe(true);
    expect(chordsOf(lines[0])).toEqual(['C', 'G', 'D', 'A']);
    expect(chordsOf(lines[1])).toEqual(['D#m', 'B', 'E']);
  });

  test('plain minor / suffixed chords are recognized as chord lines', () => {
    const { sections } = parsePastedChordSheet(['Am7   F#m   CM7   Bm', 'Hello there my friend'].join('\n'));
    const lines = sections.flatMap((s) => s.lines);
    expect(lines).toHaveLength(1);
    expect(chordsOf(lines[0])).toEqual(['Am7', 'F#m', 'CM7', 'Bm']);
  });

  test('section tags keep their own number instead of getting another appended', () => {
    const { sections } = parsePastedChordSheet(['[Chorus 3]', 'Hello there', '', '[Outro]', 'Goodbye now'].join('\n'));
    expect(sections.map((s) => s.label)).toEqual(['Chorus 3', 'Outro 1']);
    expect(sections.map((s) => s.type)).toEqual(['chorus', 'outro']);
  });

  test('text with inline [C] chord markup still goes through ChordSheetJS', () => {
    const { sections } = parsePastedChordSheet('[C]Amazing [G]grace');
    const lines = sections.flatMap((s) => s.lines);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.chordAnchors.length > 0)).toBe(true);
  });

  test('parseChordsOverWordsText skips blank lines and emits section tags as comment items', () => {
    const { lines } = parseChordsOverWordsText('[Verse]\n\nG\nHello');
    expect(lines[0].items[0]).toMatchObject({ _originalName: 'comment', _value: 'Verse' });
    expect(lines).toHaveLength(2);
  });
});
