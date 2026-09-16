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

function makeSongPayload(overrides = {}) {
  return {
    title: 'Amazing Grace',
    artist: 'Traditional',
    originalKey: 'C',
    sections: [
      {
        type: 'verse',
        label: 'Verse 1',
        lines: [
          {
            syllables: [
              { text: 'Amazing', wordId: 'w1', isWordStart: true, isWordEnd: true, type: 'lyric' },
              { text: ' ', type: 'space' },
              { text: 'grace', wordId: 'w2', isWordStart: true, isWordEnd: true, type: 'lyric' },
            ],
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

describe('POST /api/songs', () => {
  test('creates a song and defaults currentKey to originalKey on save', async () => {
    const res = await request(app).post('/api/songs').send(makeSongPayload());
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Amazing Grace');
    expect(res.body.data.currentKey).toBe('C'); // set by the pre('save') hook

    const stored = await Song.findById(res.body.data._id);
    expect(stored.sections[0].lines[0].chordAnchors).toHaveLength(2);
  });

  test('rejects a song with no title', async () => {
    const payload = makeSongPayload();
    delete payload.title;
    const res = await request(app).post('/api/songs').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/songs/:id', () => {
  test('returns 404 for a well-formed but non-existent id', async () => {
    const res = await request(app).get('/api/songs/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('SONG_NOT_FOUND');
  });

  test('returns 400 INVALID_ID for a malformed id (not a 404)', async () => {
    const res = await request(app).get('/api/songs/not-a-valid-object-id');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ID');
  });

  test('returns the song as-is when currentKey equals originalKey (no transposition)', async () => {
    const created = await request(app).post('/api/songs').send(makeSongPayload());
    const res = await request(app).get(`/api/songs/${created.body.data._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.sections[0].lines[0].chordAnchors[0].chord).toBe('C');
  });
});

describe('the non-destructive transpose contract', () => {
  test('transposing changes the displayed chords but never the stored (original-key) ones', async () => {
    const created = await request(app).post('/api/songs').send(makeSongPayload());
    const id = created.body.data._id;

    const transposeRes = await request(app).post(`/api/songs/${id}/transpose`).send({ targetKey: 'D' });
    expect(transposeRes.status).toBe(200);
    // C -> D is a whole step (2 semitones): C becomes D, G becomes A.
    expect(transposeRes.body.data.sections[0].lines[0].chordAnchors.map((a) => a.chord)).toEqual(['D', 'A']);

    // The raw stored document must be untouched — only currentKey changed.
    const stored = await Song.findById(id);
    expect(stored.currentKey).toBe('D');
    expect(stored.sections[0].lines[0].chordAnchors.map((a) => a.chord)).toEqual(['C', 'G']);
  });

  test('GET after a transpose returns the transposed view automatically', async () => {
    const created = await request(app).post('/api/songs').send(makeSongPayload());
    const id = created.body.data._id;
    await request(app).post(`/api/songs/${id}/transpose`).send({ targetKey: 'D' });

    const res = await request(app).get(`/api/songs/${id}`);
    expect(res.body.data.sections[0].lines[0].chordAnchors.map((a) => a.chord)).toEqual(['D', 'A']);
  });

  test('an edit made while viewing a transposed key is converted back to originalKey before saving', async () => {
    const created = await request(app).post('/api/songs').send(makeSongPayload());
    const id = created.body.data._id;
    await request(app).post(`/api/songs/${id}/transpose`).send({ targetKey: 'D' });

    // The editor is now showing D-based chords; the user changes the first
    // chord from "D" to "E" (one more whole step up, in D-transposed terms).
    const editedSections = makeSongPayload().sections;
    editedSections[0].lines[0].chordAnchors = [
      { chord: 'E', syllableIndex: 0, charOffset: 0 },
      { chord: 'A', syllableIndex: 2, charOffset: 0 },
    ];
    const updateRes = await request(app).put(`/api/songs/${id}`).send({ sections: editedSections });
    expect(updateRes.status).toBe(200);

    // "E" while viewing D (2 semitones above C) converts back to "D" in
    // original-key (C) terms; "A" converts back to "G".
    const stored = await Song.findById(id);
    expect(stored.sections[0].lines[0].chordAnchors.map((a) => a.chord)).toEqual(['D', 'G']);
  });

  test('rejects transposing a song with no originalKey set', async () => {
    const created = await request(app).post('/api/songs').send(makeSongPayload({ originalKey: '' }));
    const res = await request(app)
      .post(`/api/songs/${created.body.data._id}/transpose`)
      .send({ targetKey: 'D' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_ORIGINAL_KEY');
  });
});

describe('DELETE /api/songs/:id', () => {
  test('deletes the song, and a second fetch 404s', async () => {
    const created = await request(app).post('/api/songs').send(makeSongPayload());
    const id = created.body.data._id;

    const del = await request(app).delete(`/api/songs/${id}`);
    expect(del.status).toBe(200);

    const getAfter = await request(app).get(`/api/songs/${id}`);
    expect(getAfter.status).toBe(404);
  });
});

describe('POST /api/songs/:id/duplicate-section', () => {
  test('inserts a copy of the section right after the original, with fresh _ids', async () => {
    const created = await request(app).post('/api/songs').send(makeSongPayload());
    const id = created.body.data._id;
    const originalLineId = created.body.data.sections[0].lines[0]._id;

    const res = await request(app).post(`/api/songs/${id}/duplicate-section`).send({ sectionIndex: 0 });
    expect(res.status).toBe(200);
    expect(res.body.data.sections).toHaveLength(2);
    expect(res.body.data.sections[1].label).toBe('Verse 1');
    expect(res.body.data.sections[1].lines[0]._id).not.toBe(originalLineId);
  });

  test('rejects an out-of-range sectionIndex', async () => {
    const created = await request(app).post('/api/songs').send(makeSongPayload());
    const res = await request(app)
      .post(`/api/songs/${created.body.data._id}/duplicate-section`)
      .send({ sectionIndex: 5 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SECTION_INDEX');
  });
});

describe('GET /api/songs (list)', () => {
  beforeEach(async () => {
    await request(app).post('/api/songs').send(makeSongPayload({ title: 'Amazing Grace', artist: 'Traditional' }));
    await request(app).post('/api/songs').send(makeSongPayload({ title: 'How Great Thou Art', artist: 'Stuart Hine' }));
  });

  test('lists all songs by default', async () => {
    const res = await request(app).get('/api/songs');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.songs).toHaveLength(2);
  });

  test('filters by title/artist search text', async () => {
    const res = await request(app).get('/api/songs').query({ q: 'Great' });
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.songs[0].title).toBe('How Great Thou Art');
  });

  test('paginates with limit/page', async () => {
    const res = await request(app).get('/api/songs').query({ limit: 1, page: 2 });
    expect(res.body.data.songs).toHaveLength(1);
    expect(res.body.data.page).toBe(2);
    expect(res.body.data.total).toBe(2);
  });
});
