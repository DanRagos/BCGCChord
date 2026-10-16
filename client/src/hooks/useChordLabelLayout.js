import { useLayoutEffect, useRef, useState } from 'react';

// Chord labels are absolutely positioned above their syllable (left% derived
// from charOffset), so they take up no room in the line. That's fine when a
// syllable has one chord, but when two or more chords land on the SAME
// syllable (e.g. a chord before "earth" and another right after it — common
// in migrated songs where a word is both the first and last chunk of a
// line) the labels are wider than the gap between their positions and print
// on top of each other ("Dsus" + "B" -> "Dsu3").
//
// This measures the real rendered widths and, only when two labels would
// collide, pushes the later one right just far enough to clear the earlier
// one (plus a small gap) and widens that syllable's cell so the following
// word doesn't run into the pushed-over label. Cells where nothing collides
// return null, so their layout is exactly what it always was.
const LABEL_GAP_PX = 4;

function sameLayout(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.minWidth !== b.minWidth || a.lefts.length !== b.lefts.length) return false;
  return a.lefts.every((v, i) => v === b.lefts[i]);
}

// `anchors` must already be sorted by charOffset (same order they're rendered
// in), so labelRefs.current[i] lines up with anchors[i].
export function useChordLabelLayout(anchors, syllableText) {
  const textRef = useRef(null);
  const labelRefs = useRef([]);
  const [layout, setLayout] = useState(null);

  // No dependency array on purpose: re-measure after every render so a font
  // size change (the viewer's text-size slider) or an edited chord name is
  // picked up. setLayout bails out when nothing changed, so this can't loop.
  useLayoutEffect(() => {
    let next = null;
    if (anchors.length >= 2 && textRef.current) {
      const textWidth = textRef.current.offsetWidth;
      const basis = Math.max(syllableText ? syllableText.length : 1, 1);
      const lefts = [];
      let cursor = 0; // right edge of the previous label
      let collided = false;
      for (let i = 0; i < anchors.length; i += 1) {
        const labelEl = labelRefs.current[i];
        const labelWidth = labelEl ? labelEl.offsetWidth : 0;
        const natural = Math.min(0.95, anchors[i].charOffset / basis) * textWidth;
        let left = natural;
        if (i > 0 && natural < cursor + LABEL_GAP_PX) {
          left = cursor + LABEL_GAP_PX;
          collided = true;
        }
        lefts.push(Math.round(left * 10) / 10);
        cursor = left + labelWidth;
      }
      if (collided) next = { lefts, minWidth: Math.ceil(Math.max(textWidth, cursor)) };
    }
    setLayout((cur) => (sameLayout(cur, next) ? cur : next));
  });

  return { textRef, labelRefs, layout };
}
