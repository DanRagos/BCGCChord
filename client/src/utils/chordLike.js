// Client-side mirror of server/utils/chordRegex.js's looksLikeChordToken.
// Purely a UX hint in the chord popover ("this doesn't look like a chord") —
// it never blocks saving. The server (via ChordSheetJS) is always the
// source of truth for what's actually parseable/transposable; anything this
// regex rejects is still saved as typed (e.g. unusual/typo'd chords, or
// annotations someone deliberately wants to keep).
const NO_CHORD = /^(N\.?C\.?|NC)$/i;

const ROOT = '[A-G](?:#{1,2}|b{1,2})?';
const QUALITY =
  '(?:maj|major|min|minor|dim|aug|sus)?' +
  '[0-9]{0,2}' +
  '(?:sus[0-9]?|add[0-9]{1,2}|dim[0-9]?|aug[0-9]?|[-+](?:5|9|11|13)|[#b][0-9]{1,2})*';
const BASS = `(?:/${ROOT})?`;

const CHORD_TOKEN_RE = new RegExp(`^${ROOT}${QUALITY}${BASS}$`);

export function looksLikeChordToken(token) {
  if (!token) return false;
  const trimmed = token.trim();
  if (!trimmed) return false;
  if (NO_CHORD.test(trimmed)) return true;
  return CHORD_TOKEN_RE.test(trimmed);
}
