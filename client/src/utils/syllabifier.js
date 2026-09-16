// Client-side mirror of server/utils/syllabifier.js. Used when the editor
// creates a brand-new line (typed lyrics, not imported) so its syllables[]
// gets the same real Liang-hyphenation proposal the server would give it —
// this is a proposal only; once created, edits to that line's chords are
// manual and authoritative, same contract as the server side.
import Hypher from 'hypher';
import english from 'hyphenation.en-us';

const h = new Hypher(english);

export function splitWordIntoSyllables(word) {
  if (!word) return [word];
  const match = word.match(/^([^a-zA-Z']*)([a-zA-Z']+)([^a-zA-Z']*)$/);
  if (!match) return [word];
  const [, lead, core, trail] = match;

  let parts;
  try {
    parts = h.hyphenate(core);
  } catch (e) {
    parts = [core];
  }

  if (!parts || parts.length <= 1) return [word];

  return parts.map((part, i) => {
    if (i === 0 && i === parts.length - 1) return lead + part + trail;
    if (i === 0) return lead + part;
    if (i === parts.length - 1) return part + trail;
    return part;
  });
}
