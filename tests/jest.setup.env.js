// Runs before the test framework is installed, in every Jest worker process
// (see jest.config.js's setupFiles) — before any test file's top-level
// `require('../server/app')` executes. server/config/env.js validates
// MONGODB_URI is present and calls process.exit(1) if it's missing, which
// would otherwise kill the whole worker before a single test runs.
//
// This value is never actually dialed: app.js (unlike server.js) never
// calls connectDb() on its own, and every integration test connects
// mongoose itself, directly, to its own mongodb-memory-server instance.
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chordbook-test-placeholder';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-production';
process.env.NODE_ENV = 'test';
// Quiets down the app's own request-lifecycle console noise during test runs
// (connectDb()/errorHandler console.error calls) without hiding jest's own
// pass/fail output or assertion errors.
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
