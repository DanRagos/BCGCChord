const {
  semitoneDistance,
  transposeChordString,
  transposeSongForDisplay,
  chordToOriginalKey,
  normalizeRoot,
} = require('../../server/services/transposeService');

describe('normalizeRoot', () => {
  test('normalizes flats to their sharp equivalent', () => {
    expect(normalizeRoot('Db')).toBe('C#');
    expect(normalizeRoot('Bb')).toBe('A#');
  });
  test('leaves sharps and naturals as-is (uppercased)', () => {
    expect(normalizeRoot('f#')).toBe('F#');
    expect(normalizeRoot('g')).toBe('G');
  });
  test('returns null for empty/unrecognizable input', () => {
    expect(normalizeRoot('')).toBeNull();
    expect(normalizeRoot(null)).toBeNull();
  });
});

describe('semitoneDistance', () => {
  test('computes the correct upward distance', () => {
    expect(semitoneDistance('C', 'D')).toBe(2);
    expect(semitoneDistance('G', 'A')).toBe(2);
  });
  test('wraps around the octave for a "downward" target', () => {
    expect(semitoneDistance('C', 'B')).toBe(11);
  });
  test('is zero for the same key', () => {
    expect(semitoneDistance('C', 'C')).toBe(0);
  });
});

describe('transposeChordString', () => {
  test('preserves chord quality across common shapes', () => {
    expect(transposeChordString('C', 2)).toBe('D');
    expect(transposeChordString('Am', 2)).toBe('Bm');
    expect(transposeChordString('G/B', 2)).toBe('A/C#');
    expect(transposeChordString('F#m7', 1)).toBe('Gm7');
  });
  test('leaves "N.C." (no chord) untouched', () => {
    expect(transposeChordString('N.C.', 3)).toBe('N.C.');
    expect(transposeChordString('NC', 3)).toBe('NC');
  });
  test('returns an unparseable chord untouched rather than throwing', () => {
    expect(transposeChordString('???', 3)).toBe('???');
  });
  test('is a no-op when semitones is 0', () => {
    expect(transposeChordString('C', 0)).toBe('C');
  });
});

function makeSongDoc(overrides = {}) {
  return {
    originalKey: 'C',
    currentKey: 'C',
    sections: [
      {
        lines: [
          {
            chordAnchors: [
              { chord: 'C', syllableIndex: 0, charOffset: 0 },
              { chord: 'G', syllableIndex: 2, charOffset: 0 },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('transposeSongForDisplay', () => {
  test('transposes every chord anchor by the distance from originalKey to targetKey', () => {
    const song = makeSongDoc();
    const view = transposeSongForDisplay(song, 'D');
    expect(view.sections[0].lines[0].chordAnchors.map((a) => a.chord)).toEqual(['D', 'A']);
    expect(view.currentKey).toBe('D');
  });

  test('never mutates the original document', () => {
    const song = makeSongDoc();
    const before = JSON.stringify(song);
    transposeSongForDisplay(song, 'D');
    expect(JSON.stringify(song)).toBe(before);
  });

  test('supports a real Mongoose document via toObject()', () => {
    const song = {
      ...makeSongDoc(),
      toObject() {
        return makeSongDoc();
      },
    };
    const view = transposeSongForDisplay(song, 'D');
    expect(view.sections[0].lines[0].chordAnchors[0].chord).toBe('D');
  });
});

describe('chordToOriginalKey', () => {
  test('converts a chord typed while viewing a transposed key back to originalKey', () => {
    // Song is stored in C, currently being viewed in D (a whole step up).
    // A chord typed as "A" while looking at the D-transposed view should be
    // converted back down to what it would be in C: "G".
    const song = { originalKey: 'C', currentKey: 'D' };
    expect(chordToOriginalKey('A', song)).toBe('G');
  });

  test('is a no-op when currentKey already equals originalKey', () => {
    const song = { originalKey: 'C', currentKey: 'C' };
    expect(chordToOriginalKey('Am', song)).toBe('Am');
  });
});
