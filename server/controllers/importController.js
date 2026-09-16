const geniusService = require('../services/geniusService');
const importService = require('../services/importService');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const searchGenius = asyncHandler(async (req, res) => {
  const results = await geniusService.searchSongs(req.query.q);
  sendSuccess(res, results);
});

const previewGeniusImport = asyncHandler(async (req, res) => {
  const preview = await importService.previewGeniusImport(req.params.geniusId);
  sendSuccess(res, preview);
});

const previewPasteImport = asyncHandler(async (req, res) => {
  const preview = importService.previewPasteImport(req.body);
  sendSuccess(res, preview);
});

const saveImport = asyncHandler(async (req, res) => {
  const song = await importService.saveImportedSong(req.body, {
    orgId: req.user ? req.user.organization : undefined,
    userId: req.user ? req.user._id : undefined,
  });
  sendSuccess(res, song, 'Song imported successfully', 201);
});

module.exports = { searchGenius, previewGeniusImport, previewPasteImport, saveImport };
