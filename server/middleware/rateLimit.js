const rateLimit = require('express-rate-limit');

const message = (text) => ({ success: false, error: { code: 'RATE_LIMITED', message: text } });

const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many import requests — please try again in a few minutes.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many attempts — please try again in a few minutes.'),
});

module.exports = { importLimiter, authLimiter };
