const { splitWordIntoSyllables } = require('./syllabifier');

let counter = 0;
function nextWordId() {
  counter += 1;
  return `w${Date.now().toString(36)}${counter}`;
}

// Turns raw line text into the syllables[] shape stored on a Line
// subdocument (see models/Song.js). Runs once when a line is first created
// (manual entry, paste-import, or scrape-import). After that, syllables[]
// is edited manually and this function is not re-run against user edits.
function tokenizeLine(rawText) {
  const syllables = [];
  if (!rawText || !rawText.trim()) return syllables;

  const parts = rawText.split(/(\s+)/).filter((p) => p.length > 0);

  parts.forEach((part) => {
    if (/^\s+$/.test(part)) {
      syllables.push({ text: part, wordId: null, isWordStart: false, isWordEnd: false, type: 'space' });
      return;
    }
    const wordId = nextWordId();
    const pieces = splitWordIntoSyllables(part);
    pieces.forEach((piece, i) => {
      syllables.push({
        text: piece,
        wordId,
        isWordStart: i === 0,
        isWordEnd: i === pieces.length - 1,
        type: 'lyric',
      });
    });
  });

  return syllables;
}

module.exports = { tokenizeLine, nextWordId };
