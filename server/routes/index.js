const express = require('express');
const songRoutes = require('./songRoutes');
const lineupRoutes = require('./lineupRoutes');
const orgRoutes = require('./orgRoutes');
const authRoutes = require('./authRoutes');
const importRoutes = require('./importRoutes');
const searchRoutes = require('./searchRoutes');

const router = express.Router();

router.use('/songs', songRoutes);
router.use('/lineups', lineupRoutes);
router.use('/orgs', orgRoutes);
router.use('/auth', authRoutes);
router.use('/import', importRoutes);
router.use('/search', searchRoutes);

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

module.exports = router;
