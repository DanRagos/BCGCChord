const Song = require('../models/Song');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { transposeSongForDisplay, chordToOriginalKey } = require('../services/transposeService');

const listSongs = asyncHandler(async (req, res) => {
  const { q, key, sort = '-updatedAt', page = 1, limit = 20 } = req.query;
  const filter = {};
  if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { artist: new RegExp(q, 'i') }];
  if (key) filter.originalKey = key;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [songs, total] = await Promise.all([
    Song.find(filter)
      .select('title artist album originalKey currentKey capo tempo updatedAt')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Song.countDocuments(filter),
  ]);

  sendSuccess(res, { songs, total, page: pageNum, limit: limitNum });
});

const getSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw ApiError.notFound('Song not found.', 'SONG_NOT_FOUND');

  const view =
    song.currentKey && song.originalKey && song.currentKey !== song.originalKey
      ? transposeSongForDisplay(song, song.currentKey)
      : song.toObject();

  sendSuccess(res, view);
});

const createSong = asyncHandler(async (req, res) => {
  const song = new Song({
    ...req.body,
    org: req.user ? req.user.organization : undefined,
    createdBy: req.user ? req.user._id : undefined,
  });
  await song.save();
  sendSuccess(res, song, 'Song created successfully', 201);
});

// If the incoming edit was made while viewing a transposed key, every
// chord in it is converted back to originalKey before it touches the DB —
// chordAnchors[].chord must always stay anchored to originalKey.
const updateSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) throw ApiError.notFound('Song not found.', 'SONG_NOT_FOUND');

  const incoming = { ...req.body };
  const isTransposedView = song.currentKey && song.originalKey && song.currentKey !== song.originalKey;
  if (incoming.sections && isTransposedView) {
    incoming.sections = incoming.sections.map((section) => ({
      ...section,
      lines: (section.lines || []).map((line) => ({
        ...line,
        chordAnchors: (line.chordAnchors || []).map((anchor) => ({
          ...anchor,
          chord: chordToOriginalKey(anchor.chord, song),
        })),
      })),
    }));
  }

  Object.assign(song, incoming);
  await song.save();
  sendSuccess(res, song, 'Song updated successfully');
});

const deleteSong = asyncHandler(async (req, res) => {
  const song = await Song.findByIdAndDelete(req.params.id);
  if (!song) throw ApiError.notFound('Song not found.', 'SONG_NOT_FOUND');
  sendSuccess(res, null, 'Song deleted successfully');
});

const transposeSong = asyncHandler(async (req, res) => {
  const { targetKey } = req.body;
  if (!targetKey) throw ApiError.badRequest('targetKey is required.', 'MISSING_TARGET_KEY');

  const song = await Song.findById(req.params.id);
  if (!song) throw ApiError.notFound('Song not found.', 'SONG_NOT_FOUND');
  if (!song.originalKey) {
    throw ApiError.badRequest('This song has no originalKey set yet, so it cannot be transposed.', 'MISSING_ORIGINAL_KEY');
  }

  const view = transposeSongForDisplay(song, targetKey);
  song.currentKey = targetKey;
  await song.save();

  sendSuccess(res, view, 'Song transposed');
});

const duplicateSection = asyncHandler(async (req, res) => {
  const { sectionIndex } = req.body;
  const song = await Song.findById(req.params.id);
  if (!song) throw ApiError.notFound('Song not found.', 'SONG_NOT_FOUND');
  const section = song.sections[sectionIndex];
  if (!section) throw ApiError.badRequest('Invalid sectionIndex.', 'INVALID_SECTION_INDEX');

  const clone = section.toObject();
  delete clone._id;
  clone.lines.forEach((line) => {
    delete line._id;
    (line.chordAnchors || []).forEach((a) => delete a._id);
  });
  song.sections.splice(sectionIndex + 1, 0, clone);
  await song.save();
  sendSuccess(res, song, 'Section duplicated');
});

module.exports = { listSongs, getSong, createSong, updateSong, deleteSong, transposeSong, duplicateSection };
