import { useState } from 'react';
import {
  syllableDisplayText,
  groupIntoChunks,
  charOffsetToLeftPct,
  anchorsByIndexMap,
} from '../../utils/chordLayout.js';

// Given a click/drag-over clientX relative to a syllable cell's bounding
// box, decide which "half" was targeted. Left half -> charOffset 0 (chord
// sits right before this syllable); right half -> charOffset === the
// syllable's full text length (chord sits right after it). This mirrors
// exactly how ChordLyricLine positions a chord from charOffset, so what you
// click is where the chord ends up.
function resolveCharOffset(clientX, rect, textLength) {
  const midpoint = rect.left + rect.width / 2;
  return clientX < midpoint ? 0 : Math.max(textLength, 1);
}

// Finds an already-placed anchor "near" a target charOffset (same half of
// the syllable) so a second click on the same spot edits it instead of
// stacking a duplicate.
function findNearbyAnchor(anchors, targetOffset, textLength) {
  const half = Math.max(textLength, 1) / 2;
  const targetIsStart = targetOffset < half;
  return anchors.find((a) => (a.charOffset < half) === targetIsStart);
}

function SyllableCell({
  syl,
  index,
  anchorsByIndex,
  onCellClick,
  onDropOnCell,
  isDragOver,
  onDragEnterCell,
  onDragLeaveCell,
  sectionKey,
  lineKey,
}) {
  const anchors = (anchorsByIndex.get(index) || []).slice().sort((a, b) => a.charOffset - b.charOffset);
  const isChordSlot = syl.type === 'chordSlot';

  return (
    <span
      className={`relative inline-block cursor-pointer rounded transition-colors ${
        isChordSlot ? 'min-w-[1.4ch]' : ''
      } ${isDragOver ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const charOffset = resolveCharOffset(e.clientX, rect, syl.text ? syl.text.length : 0);
        const existing = findNearbyAnchor(anchors, charOffset, syl.text ? syl.text.length : 0);
        onCellClick({ index, charOffset, existing, position: { x: e.clientX, y: rect.top } });
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragEnterCell(index);
      }}
      onDragLeave={() => onDragLeaveCell(index)}
      onDrop={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const charOffset = resolveCharOffset(e.clientX, rect, syl.text ? syl.text.length : 0);
        onDropOnCell({ index, charOffset, event: e });
        onDragLeaveCell(index);
      }}
    >
      {anchors.map((a) => (
        <span
          key={a._k}
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData(
              'application/json',
              JSON.stringify({ anchorKey: a._k, fromSectionKey: sectionKey, fromLineKey: lineKey })
            );
          }}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            onCellClick({ index, charOffset: a.charOffset, existing: a, position: { x: e.clientX, y: rect.top } });
          }}
          className="absolute -top-[1.3em] text-sm font-bold whitespace-nowrap select-none cursor-grab active:cursor-grabbing px-0.5 rounded"
          style={{ left: `${charOffsetToLeftPct(a.charOffset, syl.text)}%`, color: 'var(--color-chord)' }}
          title="Click to edit, drag to move"
        >
          {a.chord}
        </span>
      ))}
      <span>{syllableDisplayText(syl)}</span>
    </span>
  );
}

export default function EditableChordLyricLine({ line, sectionKey, lineKey, onSyllableAction, onChordDrop }) {
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const anchorsByIndex = anchorsByIndexMap(line.chordAnchors);
  const chunks = groupIntoChunks(line.syllables || []);

  return (
    <div className="flex flex-wrap items-end leading-tight pt-[1.4em] mb-2">
      {chunks.map((chunk, ci) => (
        <span key={ci} className="inline-flex whitespace-nowrap">
          {chunk.items.map(({ syl, index }) => (
            <SyllableCell
              key={index}
              syl={syl}
              index={index}
              anchorsByIndex={anchorsByIndex}
              isDragOver={dragOverIndex === index}
              onDragEnterCell={setDragOverIndex}
              onDragLeaveCell={(idx) => setDragOverIndex((cur) => (cur === idx ? null : cur))}
              onCellClick={({ index: syllableIndex, charOffset, existing, position }) =>
                onSyllableAction({ sectionKey, lineKey, syllableIndex, charOffset, existing, position })
              }
              onDropOnCell={({ index: syllableIndex, charOffset, event }) => {
                let payload;
                try {
                  payload = JSON.parse(event.dataTransfer.getData('application/json'));
                } catch {
                  return;
                }
                if (!payload?.anchorKey) return;
                onChordDrop({
                  anchorKey: payload.anchorKey,
                  fromSectionKey: payload.fromSectionKey,
                  fromLineKey: payload.fromLineKey,
                  toSectionKey: sectionKey,
                  toLineKey: lineKey,
                  syllableIndex,
                  charOffset,
                });
              }}
              sectionKey={sectionKey}
              lineKey={lineKey}
            />
          ))}
        </span>
      ))}
    </div>
  );
}
