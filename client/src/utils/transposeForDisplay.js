// Client-side mirror of server/services/transposeService.js's
// transposeSongForDisplay/transposeChordString/semitoneDistance.
//
// Why this needs to exist client-side at all: a Lineup entry remembers
// "what key we sang this song in on this date" (songs[].keyUsed) — that's
// per-lineup-entry, throwaway-for-display state, completely separate from
// the Song document's own originalKey/currentKey. The Live view has to show
// each song transposed to *that* key without ever touching the shared Song
// document — calling the real POST /songs/:id/transpose endpoint would
// persist a new currentKey on the song itself, which would leak across
// every other place that song is used (a different lineup, the viewer, a
// second lineup using the same song in a different key) — exactly the
// cross-talk bug the non-destructive transpose design in Phase 3 exists to
// prevent. So this stays purely local, never mutating anything, same
// contract as the server side, just evaluated in the browser instead.
import ChordSheetJS from 'chordsheetjs';

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

export function semitoneDistance(fromKey, toKey) {
  const from = keyIndex(fromKey);
  const to = keyIndex(toKey);
  if (from === null || to === null) return 0;
  return ((to - from) % 12 + 12) % 12;
}

export function transposeChordString(chordStr, semitones) {
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

// Returns a plain-object clone of `song` with every chord anchor's chord
// transposed from song.originalKey to targetKey. Never mutates the input.
export function transposeSongForDisplay(song, targetKey) {
  if (!targetKey || !song?.originalKey || targetKey === song.originalKey) return song;
  const semitones = semitoneDistance(song.originalKey, targetKey);
  return {
    ...song,
    sections: (song.sections || []).map((section) => ({
      ...section,
      lines: (section.lines || []).map((line) => ({
        ...line,
        chordAnchors: (line.chordAnchors || []).map((anchor) => ({
          ...anchor,
          chord: transposeChordString(anchor.chord, semitones),
        })),
      })),
    })),
  };
}
