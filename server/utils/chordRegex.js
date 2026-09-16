// Fast pre-filter for "does this token look like a chord". ChordSheetJS's
// own Chord.parse() (see services/transposeService.js) is always the source
// of truth for whether a token is a *valid, transposable* chord — this
// regex exists so import/scrape code can cheaply decide "chord line vs
// lyric line" without invoking the full parser on every word of a page.
const NO_CHORD = /^(N\.?C\.?|NC)$/i;

const ROOT = '[A-G](?:#{1,2}|b{1,2})?';
const QUALITY =
  '(?:maj|major|min|minor|dim|aug|sus)?' +
  '[0-9]{0,2}' +
  '(?:sus[0-9]?|add[0-9]{1,2}|dim[0-9]?|aug[0-9]?|[-+](?:5|9|11|13)|[#b][0-9]{1,2})*';
const BASS = `(?:/${ROOT})?`;

const CHORD_TOKEN_RE = new RegExp(`^${ROOT}${QUALITY}${BASS}$`);

function looksLikeChordToken(token) {
  if (!token) return false;
  const trimmed = token.trim();
  if (!trimmed) return false;
  if (NO_CHORD.test(trimmed)) return true;
  return CHORD_TOKEN_RE.test(trimmed);
}

// A whole line "looks like" a chord line if most of its whitespace-separated
// tokens look chord-like. Used as a fallback when scraped/pasted text has no
// explicit chord markup to lean on.
function looksLikeChordLine(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const chordish = tokens.filter(looksLikeChordToken).length;
  return chordish / tokens.length >= 0.6;
}

module.exports = { looksLikeChordToken, looksLikeChordLine, NO_CHORD, CHORD_TOKEN_RE };
