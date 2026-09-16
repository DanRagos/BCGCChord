const request = require('supertest');
const app = require('../../server/app');
const Song = require('../../server/models/Song');
const { setupTestDb, teardownTestDb, clearTestDb } = require('./testDb');

beforeAll(async () => {
  await setupTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

// NOTE: searchGenius / previewGeniusImport are NOT covered here — they need
// GENIUS_ACCESS_TOKEN and outbound access to genius.com, neither of which
// this sandbox has (flagged the same way back in Phase 6b's status doc).
// Worth exercising by hand once this is running on a machine with real
// network access: search for a song you know is on Genius, confirm the
// preview, and confirm it saves with chords/lyrics intact.

describe('POST /api/import/paste/preview', () => {
  test('parses a pasted chord sheet into a preview payload (nothing saved)', async () => {
    const chordSheetText = ['[Verse 1]', 'C          G', 'Amazing grace how sweet'].join('\n');
    const res = await request(app)
      .post('/api/import/paste/preview')
      .send({ chordSheetText, title: 'Amazing Grace', artist: 'Traditional' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Amazing Grace');
    expect(res.body.data.source.type).toBe('paste-import');
    expect(res.body.data.sections.length).toBeGreaterThan(0);

    // Belt-and-suspenders: confirm the preview call itself never touches the DB.
    expect(await Song.countDocuments({})).toBe(0);
  });

  test('rejects empty chordSheetText at the validation layer', async () => {
    const res = await request(app).post('/api/import/paste/preview').send({ chordSheetText: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects text that has no recognizable lyric/chord lines', async () => {
    const res = await request(app).post('/api/import/paste/preview').send({ chordSheetText: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNPARSEABLE_CHORDSHEET');
  });
});

describe('POST /api/songs/import (saving a preview)', () => {
  test('saves a paste-import preview as a real song', async () => {
    const previewRes = await request(app)
      .post('/api/import/paste/preview')
      .send({ chordSheetText: '[Verse]\nC\nHello world', title: 'Test Song' });

    const saveRes = await request(app).post('/api/songs/import').send(previewRes.body.data);
    expect(saveRes.status).toBe(201);
    expect(saveRes.body.data.title).toBe('Test Song');
    expect(await Song.countDocuments({})).toBe(1);
  });

  test('strips the ephemeral "preview" sub-object (Genius-shaped payloads only) before saving', async () => {
    // Shaped like previewGeniusImport's return value — a "preview" block
    // (lyricsFound/mediaUrl/imageUrl) that exists only for the import
    // screen and must never be persisted on the Song document itself.
    const geniusShapedPreview = {
      title: 'A Genius Song',
      artist: 'Someone',
      originalKey: '',
      currentKey: '',
      sections: [],
      metadata: {},
      source: { type: 'genius', geniusId: 12345, importedAt: new Date().toISOString() },
      preview: { lyricsFound: true, mediaUrl: 'https://youtu.be/abc', imageUrl: 'https://example.com/art.jpg' },
    };

    const saveRes = await request(app).post('/api/songs/import').send(geniusShapedPreview);
    expect(saveRes.status).toBe(201);

    const stored = await Song.findById(saveRes.body.data._id);
    expect(stored.toObject()).not.toHaveProperty('preview');
    expect(stored.source.geniusId).toBe(12345);
  });
});
