const { looksLikeChordToken, looksLikeChordLine } = require('../../server/utils/chordRegex');

describe('looksLikeChordToken', () => {
  test.each([
    'A', 'E', 'Am', 'Am7', 'Bm', 'F#m', 'C#m', 'CM7', 'Cmaj7', 'Dsus', 'Dsus4', 'Gsus4',
    'Bb', 'Bbmaj7', 'Em7b5', 'E7#9', 'Cadd9', 'D/F#', 'G/B', 'Dsus/B', 'N.C.', 'NC', '(N.C.)',
  ])('accepts %s', (token) => {
    expect(looksLikeChordToken(token)).toBe(true);
  });

  test.each(['Again', 'and', 'again', 'day', 'Bad', 'Amen', 'Dad', 'Add', 'you', 'Name', '', '1234'])(
    'rejects the ordinary word %s',
    (token) => {
      expect(looksLikeChordToken(token)).toBe(false);
    }
  );

  test('does not blow up on a very long digit string', () => {
    expect(looksLikeChordToken('C' + '1'.repeat(200))).toBe(false);
  });
});

describe('looksLikeChordLine', () => {
  test('recognizes real chord lines, including N.C., slash chords and x2 markers', () => {
    expect(looksLikeChordLine('N.C. D/F# G')).toBe(true);
    expect(looksLikeChordLine('C   G D A')).toBe(true);
    expect(looksLikeChordLine('Am7  F#m  CM7  | Bm  x2')).toBe(true);
  });

  test('does not treat lyric lines as chord lines, even if every word starts with A-G', () => {
    expect(looksLikeChordLine('Again and again and again and again')).toBe(false);
    expect(looksLikeChordLine('You rescued me out of the mess I was in')).toBe(false);
    expect(looksLikeChordLine('A beautiful day')).toBe(false);
    expect(looksLikeChordLine('')).toBe(false);
  });
});
