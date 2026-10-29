// Client-side mirror of server/utils/chordRegex.js's looksLikeChordToken.
// Purely a UX hint in the chord popover ("this doesn't look like a chord") —
// it never blocks saving. The server (via ChordSheetJS) is always the
// source of truth for what's actually parseable/transposable; anything this
// regex rejects is still saved as typed (e.g. unusual/typo'd chords, or
// annotations someone deliberately wants to keep).
//
// Keep in sync with the server copy. A chord is a root note (A-G, optional
// #/b), then zero or more pieces from a closed vocabulary of chord-quality
// words/symbols, then an optional /bass note — so Am, F#m, CM7, Dsus4, G/B
// and Bbmaj7 pass (the old version rejected every plain minor chord).
const NO_CHORD = /^\(?N\.?C\.?\)?$/i;

const NOTE = '[A-G](?:#|b|♯|♭)?';
const SUFFIX_PIECE = '(?:maj|min|dim|aug|sus|add|alt|m|M|°|ø|\\+|-|#|b|♯|♭|\\d|\\([^)]*\\))';
const CHORD_TOKEN_RE = new RegExp(`^${NOTE}${SUFFIX_PIECE}*(?:/${NOTE})?$`);

const MAX_CHORD_TOKEN_LENGTH = 16;

export function looksLikeChordToken(token) {
  if (!token) return false;
  const trimmed = token.trim();
  if (!trimmed || trimmed.length > MAX_CHORD_TOKEN_LENGTH) return false;
  if (NO_CHORD.test(trimmed)) return true;
  return CHORD_TOKEN_RE.test(trimmed);
}
