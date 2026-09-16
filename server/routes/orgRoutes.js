const express = require('express');
const { z } = require('zod');
const controller = require('../controllers/orgController');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.get('/', controller.listOrgs);
router.post(
  '/',
  validateBody(z.object({ name: z.string().min(1), location: z.string().optional() })),
  controller.createOrg
);

module.exports = router;
