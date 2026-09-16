const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../middleware/auth');
const env = require('../config/env');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const publicUser = (user) => ({ id: user._id, name: user.name, username: user.username, role: user.role });

const signup = asyncHandler(async (req, res) => {
  const { name, username, password, role, organization } = req.body;

  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) throw ApiError.conflict('That username is already taken.', 'USERNAME_TAKEN');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, username, passwordHash, role, organization });
  await user.save();

  const token = signToken(user);
  res.cookie('token', token, COOKIE_OPTIONS);
  sendSuccess(res, publicUser(user), 'Account created successfully', 201);
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: (username || '').toLowerCase() }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid username or password.', 'INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid username or password.', 'INVALID_CREDENTIALS');

  const token = signToken(user);
  res.cookie('token', token, COOKIE_OPTIONS);
  sendSuccess(res, publicUser(user), 'Signed in successfully');
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  sendSuccess(res, null, 'Signed out successfully');
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { ...publicUser(req.user), organization: req.user.organization });
});

module.exports = { signup, login, logout, me };
