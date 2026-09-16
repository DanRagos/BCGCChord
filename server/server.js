const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDb, disconnectDb } = require('./config/db');
const { initSocketService } = require('./services/socketService');

const server = http.createServer(app);
initSocketService(server, env.clientUrl);

connectDb();

server.listen(env.port, '0.0.0.0', () => {
  console.log(`Chordbook server listening on port ${env.port} (${env.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
