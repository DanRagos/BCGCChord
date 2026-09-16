// Shared layout helpers for rendering a Line's syllables[] + chordAnchors[].
// Used by both the read-only viewer (ChordLyricLine) and the editor
// (EditableChordLyricLine) so the two never drift apart on how a chord's
// horizontal position is derived from charOffset, or how syllables get
// grouped into non-breaking words.

export function syllableDisplayText(syllable) {
  // A plain ' ' rendered as the ENTIRE content of its own inline-block span
  // gets collapsed to zero width by the browser's normal CSS whitespace
  // rules (it's treated as leading/trailing whitespace of that box, same
  // trap the chordSlot/empty-lyric cases below already work around). A
  // non-breaking space is visually identical but never collapses.
  if (syllable.type === 'space') return '\u00A0';
  if (syllable.type === 'chordSlot') return '⁠'; // word-joiner: invisible, keeps the span non-empty
  return syllable.text || '​';
}

// Groups consecutive syllables that share a wordId into one chunk so a word
// never splits across a line-wrap. Space and chordSlot units are always
// their own chunk (independent wrap points).
export function groupIntoChunks(syllables) {
  const chunks = [];
  let current = null;
  syllables.forEach((syl, index) => {
    if (syl.type === 'lyric' && syl.wordId) {
      if (current && current.wordId === syl.wordId) {
        current.items.push({ syl, index });
        return;
      }
      current = { wordId: syl.wordId, items: [{ syl, index }] };
      chunks.push(current);
      return;
    }
    current = null;
    chunks.push({ wordId: null, items: [{ syl, index }] });
  });
  return chunks;
}

// charOffset -> a left% within the syllable cell, clamped the same way in
// both the viewer and the editor so a chord looks like it's in the same
// spot whichever mode you're looking at it in.
export function charOffsetToLeftPct(charOffset, syllableText) {
  const widthBasis = syllableText ? syllableText.length : 1;
  return Math.min(95, (charOffset / Math.max(widthBasis, 1)) * 100);
}

export function anchorsByIndexMap(chordAnchors) {
  const map = new Map();
  (chordAnchors || []).forEach((a) => {
    const list = map.get(a.syllableIndex) || [];
    list.push(a);
    map.set(a.syllableIndex, list);
  });
  return map;
}

// Reconstructs the plain lyric text of a line from its syllables (used to
// pre-fill the "edit lyrics" text box). chordSlot units carry no lyric.
export function lineToPlainText(line) {
  return (line.syllables || []).map((s) => (s.type === 'chordSlot' ? '' : s.text || '')).join('');
}
