// Schema-shape tests only — validateSync() never touches a database, so
// these run anywhere with no MongoMemoryServer/network dependency at all.
// Actual persistence behavior (the currentKey-defaulting pre('save') hook,
// unique indexes, etc.) is covered in tests/integration/songs.routes.test.js
// against a real (in-memory) MongoDB instance.
const Song = require('../../server/models/Song');

describe('Song schema validation', () => {
  test('requires a title', () => {
    const song = new Song({});
    const err = song.validateSync();
    expect(err).toBeTruthy();
    expect(err.errors.title).toBeTruthy();
  });

  test('a minimal valid song (title only) validates cleanly, with sensible defaults', () => {
    const song = new Song({ title: 'Amazing Grace' });
    expect(song.validateSync()).toBeUndefined();
    expect(song.artist).toBe('');
    expect(song.capo).toBe(0);
    expect(song.sections).toEqual([]);
    expect(song.source.type).toBe('manual');
  });

  test('rejects an unrecognized section type', () => {
    const song = new Song({
      title: 'Test',
      sections: [{ type: 'not-a-real-type', label: '', lines: [] }],
    });
    const err = song.validateSync();
    expect(err).toBeTruthy();
  });

  test('accepts every documented section type', () => {
    const { SECTION_TYPES } = Song;
    const song = new Song({
      title: 'Test',
      sections: SECTION_TYPES.map((type) => ({ type, label: '', lines: [] })),
    });
    expect(song.validateSync()).toBeUndefined();
  });

  test('a chordAnchor without a chord string fails validation', () => {
    const song = new Song({
      title: 'Test',
      sections: [
        {
          type: 'verse',
          lines: [
            {
              syllables: [{ text: 'la', type: 'lyric' }],
              chordAnchors: [{ syllableIndex: 0, charOffset: 0 }],
            },
          ],
        },
      ],
    });
    const err = song.validateSync();
    expect(err).toBeTruthy();
  });

  test('accepts a well-formed line with syllables and a chordAnchor', () => {
    const song = new Song({
      title: 'Test',
      sections: [
        {
          type: 'verse',
          lines: [
            {
              syllables: [
                { text: 'la', wordId: 'w1', isWordStart: true, isWordEnd: true, type: 'lyric' },
              ],
              chordAnchors: [{ chord: 'C', syllableIndex: 0, charOffset: 0 }],
            },
          ],
        },
      ],
    });
    expect(song.validateSync()).toBeUndefined();
  });

  test('rejects an unrecognized source.type', () => {
    const song = new Song({ title: 'Test', source: { type: 'not-a-real-source' } });
    const err = song.validateSync();
    expect(err).toBeTruthy();
  });

  test('accepts the source fields added for migrated/imported media (mediaUrl, imageUrl, geniusId)', () => {
    const song = new Song({
      title: 'Test',
      source: {
        type: 'migrated',
        geniusId: 12345,
        sourceUrl: 'https://genius.com/some-song',
        mediaUrl: 'https://youtu.be/abc',
        imageUrl: 'https://example.com/art.jpg',
        importedAt: new Date(),
      },
    });
    expect(song.validateSync()).toBeUndefined();
  });
});
