const request = require('supertest');
const app = require('../../server/app');
const Song = require('../../server/models/Song');
const User = require('../../server/models/User');
const Org = require('../../server/models/Org');
const Lineup = require('../../server/models/Lineup');
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

async function createSong(title = 'Amazing Grace') {
  const res = await request(app).post('/api/songs').send({ title, originalKey: 'C', sections: [] });
  return res.body.data._id;
}

describe('POST /api/lineups', () => {
  test('creates a lineup referencing a real song', async () => {
    const songId = await createSong();
    const res = await request(app)
      .post('/api/lineups')
      .send({ songs: [{ song: songId, songType: 'praise' }], lineupDate: '2026-09-14' });
    expect(res.status).toBe(201);
    expect(res.body.data.songs).toHaveLength(1);
    expect(res.body.data.songs[0].songType).toBe('praise');
  });

  test('rejects an unrecognized songType', async () => {
    const songId = await createSong();
    const res = await request(app)
      .post('/api/lineups')
      .send({ songs: [{ song: songId, songType: 'not-a-real-type' }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('leaves org/createdBy unset when the request is not authenticated', async () => {
    const songId = await createSong();
    const res = await request(app).post('/api/lineups').send({ songs: [{ song: songId }] });
    expect(res.status).toBe(201);
    expect(res.body.data.org).toBeFalsy();
    expect(res.body.data.createdBy).toBeFalsy();
  });

  test('sets org/createdBy from the signed-in user (the Phase 6a attachUserIfPresent fix)', async () => {
    const org = await Org.create({ name: 'Test Church' });
    const user = await User.create({
      name: 'Worship Lead',
      username: 'worshiplead',
      passwordHash: 'irrelevant-for-this-test',
      organization: org._id,
    });
    const jwt = require('jsonwebtoken');
    const env = require('../../server/config/env');
    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: '1h' });

    const songId = await createSong();
    const res = await request(app)
      .post('/api/lineups')
      .set('Authorization', `Bearer ${token}`)
      .send({ songs: [{ song: songId }] });

    expect(res.status).toBe(201);
    expect(res.body.data.createdBy).toBe(user._id.toString());
    expect(res.body.data.org).toBe(org._id.toString());
  });
});

describe('GET /api/lineups and /api/lineups/:id', () => {
  test('list populates each entry\'s song title/artist', async () => {
    const songId = await createSong('How Great Thou Art');
    await request(app).post('/api/lineups').send({ songs: [{ song: songId }] });

    const res = await request(app).get('/api/lineups');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].songs[0].song.title).toBe('How Great Thou Art');
  });

  test('single-lineup fetch populates full song sections (for the Live view)', async () => {
    const songId = await createSong();
    const created = await request(app).post('/api/lineups').send({ songs: [{ song: songId }] });

    const res = await request(app).get(`/api/lineups/${created.body.data._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.songs[0].song).toHaveProperty('sections');
  });

  test('returns 404 for a non-existent lineup', async () => {
    const res = await request(app).get('/api/lineups/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('LINEUP_NOT_FOUND');
  });
});

describe('PUT /api/lineups/:id', () => {
  test('updates the songType of an existing entry', async () => {
    const songId = await createSong();
    const created = await request(app)
      .post('/api/lineups')
      .send({ songs: [{ song: songId, songType: 'opening' }] });

    const res = await request(app)
      .put(`/api/lineups/${created.body.data._id}`)
      .send({ songs: [{ song: songId, songType: 'closing' }] });
    expect(res.status).toBe(200);
    expect(res.body.data.songs[0].songType).toBe('closing');
  });
});

describe('DELETE /api/lineups/:id', () => {
  test('deletes the lineup, and a second fetch 404s', async () => {
    const songId = await createSong();
    const created = await request(app).post('/api/lineups').send({ songs: [{ song: songId }] });

    const del = await request(app).delete(`/api/lineups/${created.body.data._id}`);
    expect(del.status).toBe(200);

    const after = await request(app).get(`/api/lineups/${created.body.data._id}`);
    expect(after.status).toBe(404);
  });
});
