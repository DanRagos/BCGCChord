const ChordSheetJS = require('chordsheetjs');

const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B', Fb: 'E' };
const NO_CHORD_RE = /^(N\.?C\.?|NC)$/i;

function normalizeRoot(key) {
  if (!key) return null;
  const match = key.trim().match(/^([A-Ga-g])([#b]{0,2})/);
  if (!match) return null;
  const root = match[1].toUpperCase() + (match[2] || '');
  return FLAT_TO_SHARP[root] || root;
}

function keyIndex(key) {
  const root = normalizeRoot(key);
  return root ? CHROMATIC_SHARP.indexOf(root) : null;
}

function semitoneDistance(fromKey, toKey) {
  const from = keyIndex(fromKey);
  const to = keyIndex(toKey);
  if (from === null || to === null) return 0;
  return ((to - from) % 12 + 12) % 12;
}

// Transposes a single chord string by N semitones using ChordSheetJS, which
// correctly preserves quality (m, 7, maj7, dim, aug, sus, add9, ...) and
// slash-chord bass notes. Anything ChordSheetJS can't parse (typos, "N.C.")
// is returned untouched rather than corrupted.
function transposeChordString(chordStr, semitones) {
  if (!chordStr) return chordStr;
  const trimmed = chordStr.trim();
  if (!trimmed || !semitones || NO_CHORD_RE.test(trimmed)) return chordStr;
  try {
    const parsed = ChordSheetJS.Chord.parse(trimmed);
    if (!parsed) return chordStr;
    return parsed.transpose(semitones).toString();
  } catch (e) {
    return chordStr;
  }
}

// Returns a plain-object clone of the song with every chord anchor's chord
// transposed for display in targetKey. NEVER mutates the passed-in document
// and never overwrites the stored (original-key) chord strings — the DB
// value of chordAnchors[].chord is always the chord as entered in
// song.originalKey, so "reset to original key" is a lookup, not a re-derivation.
function transposeSongForDisplay(songDoc, targetKey) {
  const song =
    typeof songDoc.toObject === 'function' ? songDoc.toObject() : JSON.parse(JSON.stringify(songDoc));
  const sourceKey = song.originalKey || song.currentKey;
  const semitones = semitoneDistance(sourceKey, targetKey);

  song.sections = (song.sections || []).map((section) => ({
    ...section,
    lines: (section.lines || []).map((line) => ({
      ...line,
      chordAnchors: (line.chordAnchors || []).map((anchor) => ({
        ...anchor,
        chord: transposeChordString(anchor.chord, semitones),
      })),
    })),
  }));
  song.currentKey = targetKey;
  return song;
}

// A chord typed while viewing a transposed song must be converted back to
// the song's original key before it is persisted, so stored chords always
// stay anchored to originalKey regardless of what key was on screen.
function chordToOriginalKey(chordStr, song) {
  const sourceKey = song.originalKey || song.currentKey;
  const viewedKey = song.currentKey || sourceKey;
  const semitones = semitoneDistance(viewedKey, sourceKey);
  return transposeChordString(chordStr, semitones);
}

module.exports = {
  semitoneDistance,
  transposeChordString,
  transposeSongForDisplay,
  chordToOriginalKey,
  normalizeRoot,
};
