const { tokenizeLine } = require('../utils/lineTokenizer');
const { normalizeSectionType } = require('./chordParserService');

const CHAR_MAP = {
  '‘': "'", '’': "'", '‚': "'", '‛': "'",
  '“': '"', '”': '"', '„': '"', '‟': '"',
  ' ': ' ', ' ': '\n', ' ': '\n\n',
};

// Normalizes raw imported text: curly quotes/apostrophes to straight ones
// (so the syllabifier's word matching stays consistent), collapses
// repeated spaces and excessive blank lines, without destroying
// intentional single line breaks.
function cleanText(raw) {
  if (!raw) return '';
  let text = raw;
  Object.entries(CHAR_MAP).forEach(([from, to]) => {
    text = text.split(from).join(to);
  });
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, '').replace(/[ \t]{2,}/g, ' '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

const SECTION_HEADER_RE = /^[[(]\s*([^\])]+?)\s*[\])]$/;

// Turns raw, lyrics-only text (typically scraped from a lyrics page, no
// chord information) into the sections/lines shape used by the Song model,
// with empty chordAnchors — the user attaches chords afterward in the
// editor. Section headers like "[Verse 1]", "[Chorus: Artist]",
// "(Instrumental)" are detected and stripped out of the lyric text itself.
function normalizeLyricsText(rawText) {
  const text = cleanText(rawText);
  const lines = text.split('\n');
  const sections = [];
  const counters = {};
  let current = null;

  function ensureSection(rawLabel) {
    const cleanLabel = rawLabel.split(':')[0].trim();
    const type = normalizeSectionType(cleanLabel.replace(/\s*\d+$/, ''));
    const countKey = cleanLabel.toLowerCase();
    counters[countKey] = (counters[countKey] || 0) + 1;
    const label = /\d/.test(cleanLabel) ? cleanLabel : `${cleanLabel} ${counters[countKey]}`;
    current = { type, label, lines: [] };
    sections.push(current);
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    const headerMatch = line.match(SECTION_HEADER_RE);
    if (headerMatch) {
      ensureSection(headerMatch[1]);
      return;
    }
    if (!current) ensureSection('Verse');
    const syllables = tokenizeLine(line);
    if (syllables.length === 0) return;
    current.lines.push({ syllables, chordAnchors: [] });
  });

  return { sections };
}

module.exports = { cleanText, normalizeLyricsText };
