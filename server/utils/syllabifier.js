// Best-effort automatic syllabification using the Liang hyphenation
// algorithm (the same technique browsers/LaTeX use for line-break points).
// This is a proposal only: lineTokenizer runs it once when a line is first
// created, and every edit after that is manual and authoritative (per the
// "manual editing always takes precedence" requirement).
const Hypher = require('hypher');
const english = require('hyphenation.en-us');

const h = new Hypher(english);

function splitWordIntoSyllables(word) {
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

module.exports = { splitWordIntoSyllables };
