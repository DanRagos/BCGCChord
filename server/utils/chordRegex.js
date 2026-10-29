// Fast pre-filter for "does this token look like a chord". ChordSheetJS's
// own Chord.parse() (see services/transposeService.js) is the source of truth
// for whether a token is a *valid, transposable* chord — but it is far too
// lenient to decide "chord line vs lyric line" with: it happily parses
// "Again" as an A chord with suffix "gain", and "and"/"again" the same way,
// so a lyric line like "Again and again and again" gets mistaken for a chord
// line. At the same time it can't parse "N.C." (no chord) at all, so a real
// chord line like "N.C.  D/F#  G" gets mistaken for lyrics. The import code
// (services/chordParserService.js) therefore classifies lines with the strict
// helpers below instead.
//
// A chord here is: a root note (A-G, optional #/b), then ZERO OR MORE pieces
// drawn from a closed vocabulary of chord-quality words/symbols (maj, min, m,
// M, dim, aug, sus, add, alt, +, -, #, b, a single digit, a (...) group),
// then an optional /bass note. "Again" fails because "g" isn't in that
// vocabulary; "Am", "F#m", "CM7", "Dsus4", "G/B", "Bbmaj7" all pass.
const NO_CHORD = /^\(?N\.?C\.?\)?$/i;

const NOTE = '[A-G](?:#|b|♯|♭)?';
const SUFFIX_PIECE = '(?:maj|min|dim|aug|sus|add|alt|m|M|°|ø|\\+|-|#|b|♯|♭|\\d|\\([^)]*\\))';
const CHORD_TOKEN_RE = new RegExp(`^${NOTE}${SUFFIX_PIECE}*(?:/${NOTE})?$`);

// Things that routinely sit on a chord line without being chords or lyrics:
// bar lines, repeat markers, "x2", separators.
const NEUTRAL_TOKEN_RE = /^(?:[|\\/\-–—.:~*%()]+|\(?[xX×]\d+\)?|\d+[xX×])$/;

const MAX_CHORD_TOKEN_LENGTH = 16;

function looksLikeChordToken(token) {
  if (!token) return false;
  const trimmed = token.trim();
  if (!trimmed || trimmed.length > MAX_CHORD_TOKEN_LENGTH) return false;
  if (NO_CHORD.test(trimmed)) return true;
  return CHORD_TOKEN_RE.test(trimmed);
}

// A whole line "looks like" a chord line if most of its whitespace-separated
// tokens look chord-like (ignoring bar lines / "x2" style markers), and at
// least one of them really is a chord. Used to decide chord line vs lyric
// line when pasted text has no explicit chord markup to lean on.
function looksLikeChordLine(line) {
  const tokens = (line || '')
    .trim()
    .split(/\s+/)
    .filter((t) => t && !NEUTRAL_TOKEN_RE.test(t));
  if (tokens.length === 0) return false;
  const chordish = tokens.filter(looksLikeChordToken).length;
  if (chordish === 0) return false;
  return chordish / tokens.length >= 0.6;
}

module.exports = { looksLikeChordToken, looksLikeChordLine, NO_CHORD, CHORD_TOKEN_RE };
