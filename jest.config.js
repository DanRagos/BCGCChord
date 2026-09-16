module.exports = {
  testEnvironment: 'node',
  // Sets a placeholder MONGODB_URI (and a few other env vars) before any test
  // file is loaded. server/config/env.js exits the process if MONGODB_URI is
  // missing at require-time — but app.js itself never actually connects to
  // Mongo (only server.js does, via config/db.js's connectDb()), so this
  // placeholder is never dialed. Integration tests connect mongoose
  // themselves, directly, to a real mongodb-memory-server instance in each
  // file's own beforeAll (the same "bypass the retry-forever connectDb()
  // helper and connect directly" pattern scripts/migrate.js already uses).
  setupFiles: ['<rootDir>/tests/jest.setup.env.js'],
  // mongodb-memory-server downloads a mongod binary the first time it runs
  // (cached under ~/.cache/mongodb-binaries after that) — generous timeout
  // so that first run isn't flaky, especially on a fresh machine/CI box.
  testTimeout: 30000,
  testPathIgnorePatterns: ['/node_modules/', '/client/'],
  // sanitize-html (used by server/services/scrapeService.js) depends on
  // htmlparser2@12, which ships ESM-only ("type": "module") — Jest's default
  // CommonJS transform skips everything under node_modules, which leaves
  // that file untranspiled and Jest can't require() it. This carves out an
  // exception so just those two packages get run through the transform
  // (still CommonJS everywhere else in node_modules, for speed).
  transformIgnorePatterns: [
    'node_modules/(?!(sanitize-html|htmlparser2|entities|dom-serializer|domhandler|domutils|domelementtype)/)',
  ],
};
