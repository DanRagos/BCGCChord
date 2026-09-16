const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function getTokenFromRequest(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) throw ApiError.unauthorized('Sign in required.');
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('Sign in required.');
    req.user = user;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : ApiError.unauthorized('Invalid or expired session.'));
  }
}

// Attaches req.user when a valid token is present but never blocks the
// request — for routes that behave differently when signed in (e.g.
// scoping results to an org) without requiring auth outright.
async function attachUserIfPresent(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub);
      if (user) req.user = user;
    }
  } catch (e) {
    // ignore invalid/expired token on this soft-auth path
  }
  next();
}

module.exports = { signToken, requireAuth, attachUserIfPresent };
