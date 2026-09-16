const express = require('express');
const { z } = require('zod');
const controller = require('../controllers/authController');
const { validateBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const signupSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['musician', 'worshipLead', 'admin']).default('musician'),
  organization: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/signup', authLimiter, validateBody(signupSchema), controller.signup);
router.post('/login', authLimiter, validateBody(loginSchema), controller.login);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
