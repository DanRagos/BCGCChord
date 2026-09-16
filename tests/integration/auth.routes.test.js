const request = require('supertest');
const app = require('../../server/app');
const User = require('../../server/models/User');
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

const validSignup = {
  name: 'Test User',
  username: 'testuser',
  password: 'password123',
  role: 'musician',
};

describe('POST /api/auth/signup', () => {
  test('creates an account and signs the caller in (sets a session cookie)', async () => {
    const res = await request(app).post('/api/auth/signup').send(validSignup);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('testuser');
    expect(res.body.data).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie'].some((c) => c.startsWith('token='))).toBe(true);

    const stored = await User.findOne({ username: 'testuser' }).select('+passwordHash');
    expect(stored.passwordHash).not.toBe('password123'); // hashed, not stored in plain text
  });

  test('rejects a duplicate username with 409 CONFLICT', async () => {
    await request(app).post('/api/auth/signup').send(validSignup);
    const res = await request(app).post('/api/auth/signup').send(validSignup);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
  });

  test('rejects a password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validSignup, username: 'shortpw', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(validSignup);
  });

  test('signs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('testuser');
  });

  test('rejects the wrong password with 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('rejects an unknown username with the same 401 (no username enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody-here', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/auth/me', () => {
  test('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns the signed-in user when a valid Bearer token is presented', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(validSignup);
    const setCookie = signupRes.headers['set-cookie'][0];
    const token = setCookie.split('token=')[1].split(';')[0];

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('testuser');
  });
});

describe('POST /api/auth/logout', () => {
  test('clears the session cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cleared = res.headers['set-cookie'].find((c) => c.startsWith('token='));
    expect(cleared).toMatch(/token=;/);
  });
});
