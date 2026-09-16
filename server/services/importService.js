const geniusService = require('./geniusService');
const scrapeService = require('./scrapeService');
const { normalizeLyricsText } = require('./lyricsNormalizer');
const { parsePastedChordSheet } = require('./chordParserService');
const ApiError = require('../utils/ApiError');
const Song = require('../models/Song');

// Fetches a Genius song + scrapes its lyrics, normalizes everything into
// our section/line shape, and returns a PREVIEW payload. Nothing is saved
// here — see saveImportedSong.
async function previewGeniusImport(geniusId) {
  const song = await geniusService.getSongById(geniusId);

  let sections = [];
  let lyricsFound = true;
  try {
    const lyrics = await scrapeService.scrapeLyricsFromGeniusUrl(song.url);
    if (!lyrics) {
      lyricsFound = false;
    } else {
      sections = normalizeLyricsText(lyrics).sections;
    }
  } catch (e) {
    lyricsFound = false;
  }

  const youtube = (song.media || []).find((m) => m.provider === 'youtube');

  return {
    title: song.title,
    artist: (song.primary_artist && song.primary_artist.name) || song.artist_names || '',
    album: (song.album && song.album.name) || '',
    originalKey: '',
    currentKey: '',
    sections,
    metadata: {
      notes: lyricsFound
        ? ''
        : 'Lyrics could not be automatically extracted from Genius — paste or type them in before saving.',
    },
    source: {
      type: 'genius',
      geniusId: song.id,
      sourceUrl: song.url,
      // Persisted from here on (previously these only ever lived in the
      // `preview` block below, shown once during import and then discarded —
      // Phase 8's migration found that the pre-MERN app HAD been keeping
      // these long-term, so future imports shouldn't lose them either).
      ...(youtube ? { mediaUrl: youtube.url } : {}),
      ...(song.song_art_image_url ? { imageUrl: song.song_art_image_url } : {}),
      importedAt: new Date(),
    },
    preview: { lyricsFound, mediaUrl: youtube ? youtube.url : null, imageUrl: song.song_art_image_url },
  };
}

// Parses a pasted chord sheet into a PREVIEW payload — same contract as
// previewGeniusImport, nothing saved.
function previewPasteImport({ chordSheetText, title, artist }) {
  if (!chordSheetText || !chordSheetText.trim()) {
    throw ApiError.badRequest('Paste some chord sheet text to import.', 'EMPTY_CHORDSHEET');
  }
  const { sections } = parsePastedChordSheet(chordSheetText);
  if (sections.length === 0) {
    throw ApiError.badRequest(
      'Could not find any recognizable lyric/chord lines in that text.',
      'UNPARSEABLE_CHORDSHEET'
    );
  }
  return {
    title: title || 'Untitled Song',
    artist: artist || '',
    album: '',
    originalKey: '',
    currentKey: '',
    sections,
    metadata: {},
    source: { type: 'paste-import', importedAt: new Date() },
  };
}

// Persists a previously-returned preview payload. The user (via the Import
// Preview screen) always sits between "we parsed something" and "this is
// saved" — nothing from a scrape or paste is written to the DB directly.
async function saveImportedSong(previewPayload, { orgId, userId } = {}) {
  const { preview, ...songData } = previewPayload;
  const song = new Song({ ...songData, org: orgId, createdBy: userId });
  await song.save();
  return song;
}

module.exports = { previewGeniusImport, previewPasteImport, saveImportedSong };
