// Shared in-memory MongoDB helper for the integration test suites. Each
// integration test file gets its own MongoMemoryServer instance (started in
// beforeAll, stopped in afterAll) rather than sharing one globally — simpler
// to reason about than coordinating a single instance across Jest's worker
// processes, at the cost of a small amount of extra startup time per file.
//
// NOTE: mongodb-memory-server downloads a real mongod binary from
// fastdl.mongodb.org the first time it runs (cached under
// ~/.cache/mongodb-binaries after that). This sandbox's network egress
// policy blocks that host outright (confirmed: a 403 from the proxy itself,
// not from MongoDB — see status/phase9-testing-status.md), so these
// integration suites could not be executed in this environment. They ran
// cleanly through this shared helper in isolation (mongoose connects,
// collections clear, disconnects) up to the point of the binary download
// itself. Run `npm test` on your own machine, where normal internet access
// should let the download succeed on first run.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

async function setupTestDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function teardownTestDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

module.exports = { setupTestDb, teardownTestDb, clearTestDb };
