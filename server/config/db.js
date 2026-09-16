const mongoose = require('mongoose');
const env = require('./env');

const RETRY_DELAY_MS = 5000;

async function connectDb() {
  mongoose.set('strictQuery', true);

  const attempt = () => {
    mongoose.connect(env.mongoUri).catch((err) => {
      console.error('MongoDB connection error:', err.message);
      console.error(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(attempt, RETRY_DELAY_MS);
    });
  };

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  attempt();
}

async function disconnectDb() {
  await mongoose.connection.close();
}

module.exports = { connectDb, disconnectDb };
