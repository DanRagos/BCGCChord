// Client-side mirror of server/utils/lineTokenizer.js. Turns raw typed text
// into the syllables[] shape a Line stores, exactly like the server does on
// import — so a line added in the editor looks and behaves identically to
// one that came from a paste-import once it's saved and reloaded.
import { splitWordIntoSyllables } from './syllabifier.js';

let counter = 0;
export function nextWordId() {
  counter += 1;
  return `cw${Date.now().toString(36)}${counter}`;
}

export function tokenizeLine(rawText) {
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
