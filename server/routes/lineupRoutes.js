const express = require('express');
const { z } = require('zod');
const controller = require('../controllers/lineupController');
const { validateBody } = require('../middleware/validate');
const { attachUserIfPresent } = require('../middleware/auth');

const router = express.Router();

const lineupSchema = z.object({
  songs: z
    .array(
      z.object({
        song: z.string(),
        keyUsed: z.string().optional(),
        songType: z
          .enum(['opening', 'praise', 'worship', 'response', 'offering', 'communion', 'closing'])
          .optional(),
      })
    )
    .default([]),
  lineupDate: z.string().or(z.date()).optional(),
});

router.get('/', controller.listLineups);
router.get('/:id', controller.getLineup);
// attachUserIfPresent (already used the same way in songRoutes.js) so
// createLineup can set org/createdBy when the request is signed in, without
// requiring auth outright — createLineup silently no-oped this before since
// req.user was never populated on this router at all.
router.post('/', attachUserIfPresent, validateBody(lineupSchema), controller.createLineup);
router.put('/:id', attachUserIfPresent, validateBody(lineupSchema.partial()), controller.updateLineup);
router.delete('/:id', controller.deleteLineup);

module.exports = router;
