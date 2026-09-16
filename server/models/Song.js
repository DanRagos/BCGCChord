const mongoose = require('mongoose');
const { Schema } = mongoose;

// --- Chord/syllable placement model (see architecture/phase2-design.md) ---
// A syllable is a unit of rendered text (lyric, whitespace, or a zero-width
// "chordSlot" that exists only to anchor a chord with no lyric under it).
// wordId groups syllables belonging to the same word for editing purposes
// only — it never limits how many chords can anchor to that word.
const SyllableSchema = new Schema(
  {
    text: { type: String, default: '' },
    wordId: { type: String, default: null },
    isWordStart: { type: Boolean, default: false },
    isWordEnd: { type: Boolean, default: false },
    type: { type: String, enum: ['lyric', 'space', 'chordSlot'], default: 'lyric' },
  },
  { _id: false }
);

// chord is always the ORIGINAL, un-transposed chord as entered/imported.
// Transposition (services/transposeService.js) rewrites this string in
// place from the song's originalKey each time, so "reset to original key"
// is a lookup rather than an accumulation of rounding/interval errors.
const ChordAnchorSchema = new Schema(
  {
    chord: { type: String, required: true },
    syllableIndex: { type: Number, required: true },
    charOffset: { type: Number, default: 0 },
  },
  { _id: true }
);

const LineSchema = new Schema(
  {
    syllables: { type: [SyllableSchema], default: [] },
    chordAnchors: { type: [ChordAnchorSchema], default: [] },
  },
  { _id: true }
);

const SECTION_TYPES = [
  'intro',
  'verse',
  'prechorus',
  'chorus',
  'postchorus',
  'bridge',
  'interlude',
  'instrumental',
  'solo',
  'outro',
  'custom',
];

const SectionSchema = new Schema(
  {
    type: { type: String, enum: SECTION_TYPES, default: 'verse' },
    label: { type: String, default: '' }, // e.g. "Verse 2", or the custom name when type === 'custom'
    lines: { type: [LineSchema], default: [] },
  },
  { _id: true }
);

const SongSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, trim: true, default: '' },
    album: { type: String, trim: true, default: '' },
    originalKey: { type: String, default: '' },
    currentKey: { type: String, default: '' },
    tempo: { type: Number },
    capo: { type: Number, default: 0 },
    sections: { type: [SectionSchema], default: [] },
    metadata: {
      genre: { type: String, default: '' },
      tags: { type: [String], default: [] },
      timeSignature: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    source: {
      type: {
        type: String,
        enum: ['manual', 'genius', 'paste-import', 'migrated'],
        default: 'manual',
      },
      geniusId: { type: Number },
      sourceUrl: { type: String },
      // A reference video/audio link and cover art image, when the import
      // source provided them (e.g. Genius's media list and song art). The
      // import preview always surfaced these for display, but nothing
      // persisted them until Phase 8's migration surfaced real pre-MERN
      // documents that HAD been keeping this (as urlMedia/songArt) — so this
      // closes that gap for both migrated data and every import from here on.
      mediaUrl: { type: String },
      imageUrl: { type: String },
      importedAt: { type: Date },
    },
    org: { type: Schema.Types.ObjectId, ref: 'Org' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

SongSchema.index({ title: 'text', artist: 'text' });
SongSchema.index({ org: 1, updatedAt: -1 });
SongSchema.index({ 'source.geniusId': 1 });

SongSchema.pre('save', function setCurrentKeyDefault(next) {
  if (!this.currentKey && this.originalKey) {
    this.currentKey = this.originalKey;
  }
  next();
});

module.exports = mongoose.model('Song', SongSchema);
module.exports.SECTION_TYPES = SECTION_TYPES;
