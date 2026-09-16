const Lineup = require('../models/Lineup');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listLineups = asyncHandler(async (req, res) => {
  const lineups = await Lineup.find({})
    .sort({ lineupDate: 'desc' })
    .populate({ path: 'songs.song', select: 'title artist originalKey currentKey' });
  sendSuccess(res, lineups);
});

const getLineup = asyncHandler(async (req, res) => {
  const lineup = await Lineup.findById(req.params.id).populate({
    path: 'songs.song',
    select: 'title artist originalKey currentKey capo sections',
  });
  if (!lineup) throw ApiError.notFound('Lineup not found.', 'LINEUP_NOT_FOUND');
  sendSuccess(res, lineup);
});

const createLineup = asyncHandler(async (req, res) => {
  const lineup = new Lineup({
    ...req.body,
    org: req.user ? req.user.organization : undefined,
    createdBy: req.user ? req.user._id : undefined,
  });
  await lineup.save();
  sendSuccess(res, lineup, 'Lineup created successfully', 201);
});

const updateLineup = asyncHandler(async (req, res) => {
  const lineup = await Lineup.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!lineup) throw ApiError.notFound('Lineup not found.', 'LINEUP_NOT_FOUND');
  sendSuccess(res, lineup, 'Lineup updated successfully');
});

const deleteLineup = asyncHandler(async (req, res) => {
  const lineup = await Lineup.findByIdAndDelete(req.params.id);
  if (!lineup) throw ApiError.notFound('Lineup not found.', 'LINEUP_NOT_FOUND');
  sendSuccess(res, null, 'Lineup deleted successfully');
});

module.exports = { listLineups, getLineup, createLineup, updateLineup, deleteLineup };
