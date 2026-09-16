const dotenv = require('dotenv');
dotenv.config();

const required = ['MONGODB_URI'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Fail fast and loud rather than limping along with an undefined connection string.
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3003,
  mongoUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  geniusAccessToken: process.env.GENIUS_ACCESS_TOKEN || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};
