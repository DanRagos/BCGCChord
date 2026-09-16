// Renders one Line (syllables[] + chordAnchors[]) with chords positioned
// above their exact syllable/offset — never from literal spaces. Consecutive
// lyric syllables that share a wordId are wrapped in a single non-breaking
// group so a word never splits across a line-wrap on narrow/mobile screens;
// space and chordSlot units remain independent wrap points.
//
// Layout helpers live in utils/chordLayout.js and are shared with
// EditableChordLyricLine so the viewer and the editor never disagree on
// where a chord sits.
import { syllableDisplayText, groupIntoChunks, charOffsetToLeftPct, anchorsByIndexMap } from '../../utils/chordLayout.js';

function SyllableCell({ syl, index, anchorsByIndex }) {
  const anchors = (anchorsByIndex.get(index) || []).slice().sort((a, b) => a.charOffset - b.charOffset);
  const isChordSlot = syl.type === 'chordSlot';

  return (
    <span className={`relative inline-block ${isChordSlot ? 'min-w-[0.6ch]' : ''}`}>
      {anchors.map((a) => (
        <span
          key={a._id || `${index}-${a.chord}-${a.charOffset}`}
          className="absolute -top-[1.15em] text-sm font-bold whitespace-nowrap select-none"
          style={{ left: `${charOffsetToLeftPct(a.charOffset, syl.text)}%`, color: 'var(--color-chord)' }}
        >
          {a.chord}
        </span>
      ))}
      <span>{syllableDisplayText(syl)}</span>
    </span>
  );
}

export default function ChordLyricLine({ line }) {
  const anchorsByIndex = anchorsByIndexMap(line.chordAnchors);
  const chunks = groupIntoChunks(line.syllables || []);

  return (
    <div className="flex flex-wrap items-end leading-tight pt-[1.3em] mb-2">
      {chunks.map((chunk, ci) => (
        <span key={ci} className="inline-flex whitespace-nowrap">
          {chunk.items.map(({ syl, index }) => (
            <SyllableCell key={index} syl={syl} index={index} anchorsByIndex={anchorsByIndex} />
          ))}
        </span>
      ))}
    </div>
  );
}
