const Song = require('../models/Song');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return sendSuccess(res, { songs: [], artists: [] });

  const regex = new RegExp(q, 'i');
  const songs = await Song.find({ $or: [{ title: regex }, { artist: regex }] })
    .select('title artist originalKey updatedAt')
    .limit(25);

  const artists = [...new Set(songs.map((s) => s.artist).filter(Boolean))];
  sendSuccess(res, { songs, artists });
});

module.exports = { search };
