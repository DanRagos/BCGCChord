const express = require('express');
const { z } = require('zod');
const controller = require('../controllers/importController');
const { validateBody } = require('../middleware/validate');
const { importLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/genius/search', importLimiter, controller.searchGenius);
router.get('/genius/:geniusId/preview', importLimiter, controller.previewGeniusImport);
router.post(
  '/paste/preview',
  importLimiter,
  validateBody(
    z.object({
      chordSheetText: z.string().min(1),
      title: z.string().optional(),
      artist: z.string().optional(),
    })
  ),
  controller.previewPasteImport
);

module.exports = router;
