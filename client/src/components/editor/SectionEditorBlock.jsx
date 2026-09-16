import { useState } from 'react';
import EditableChordLyricLine from '../chord/EditableChordLyricLine.jsx';
import { lineToPlainText } from '../../utils/chordLayout.js';

const SECTION_TYPES = [
  'intro', 'verse', 'prechorus', 'chorus', 'postchorus',
  'bridge', 'interlude', 'instrumental', 'solo', 'outro', 'custom',
];
const SECTION_LABELS = {
  intro: 'Intro', verse: 'Verse', prechorus: 'Pre-Chorus', chorus: 'Chorus',
  postchorus: 'Post-Chorus', bridge: 'Bridge', interlude: 'Interlude',
  instrumental: 'Instrumental', solo: 'Solo', outro: 'Outro', custom: 'Custom',
};

function LineRow({ line, sectionKey, onRemoveLine, onMoveLine, onRetextLine, onAppendChordSlot, onSyllableAction, onChordDrop, isFirst, isLast }) {
  const [editingText, setEditingText] = useState(false);
  const [draftText, setDraftText] = useState('');
  const hasChords = (line.chordAnchors || []).length > 0;

  const startEditingText = () => {
    setDraftText(lineToPlainText(line));
    setEditingText(true);
  };

  const commitText = () => {
    if (hasChords) {
      const ok = window.confirm(
        `This line has ${line.chordAnchors.length} chord${line.chordAnchors.length > 1 ? 's' : ''} placed. Retyping the lyrics will clear them. Continue?`
      );
      if (!ok) {
        setEditingText(false);
        return;
      }
    }
    onRetextLine(line._k, draftText);
    setEditingText(false);
  };

  return (
    <div className="group flex items-start gap-2 -mx-2 px-2 rounded hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
      <div className="flex-1 min-w-0">
        {editingText ? (
          <div className="flex items-center gap-2 py-1">
            <input
              autoFocus
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitText();
                if (e.key === 'Escape') setEditingText(false);
              }}
              className="flex-1 text-sm border rounded px-2 py-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
            <button onClick={commitText} className="text-xs underline">Save</button>
            <button onClick={() => setEditingText(false)} className="text-xs underline opacity-60">Cancel</button>
          </div>
        ) : (line.syllables || []).length === 0 ? (
          <p className="opacity-40 text-sm italic py-2">(empty line)</p>
        ) : (
          <EditableChordLyricLine
            line={line}
            sectionKey={sectionKey}
            lineKey={line._k}
            onSyllableAction={onSyllableAction}
            onChordDrop={onChordDrop}
          />
        )}
      </div>
      <div className="flex items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs">
        {!editingText && (
          <button onClick={startEditingText} title="Edit lyrics text" className="px-1 hover:underline">✎</button>
        )}
        <button onClick={() => onAppendChordSlot(line._k)} title="Add a chord-only hit at the end of this line" className="px-1 hover:underline">
          +chord
        </button>
        <button onClick={() => onMoveLine(line._k, -1)} disabled={isFirst} title="Move line up" className="px-1 disabled:opacity-20 hover:underline">↑</button>
        <button onClick={() => onMoveLine(line._k, 1)} disabled={isLast} title="Move line down" className="px-1 disabled:opacity-20 hover:underline">↓</button>
        <button onClick={() => onRemoveLine(line._k)} title="Delete line" className="px-1 text-red-500 hover:underline">✕</button>
      </div>
    </div>
  );
}

export default function SectionEditorBlock({
  section,
  isFirst,
  isLast,
  onUpdateMeta,
  onMove,
  onDuplicate,
  onRemove,
  onAddLine,
  onRemoveLine,
  onMoveLine,
  onRetextLine,
  onAppendChordSlot,
  onSyllableAction,
  onChordDrop,
}) {
  const [newLineText, setNewLineText] = useState('');

  const submitNewLine = () => {
    if (!newLineText.trim()) return;
    onAddLine(newLineText);
    setNewLineText('');
  };

  return (
    <section
      className="mb-6 rounded-lg border p-3"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
        <select
          value={section.type}
          onChange={(e) => onUpdateMeta({ type: e.target.value })}
          className="border rounded px-2 py-1 text-xs uppercase tracking-wide font-bold"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
        >
          {SECTION_TYPES.map((t) => (
            <option key={t} value={t}>{SECTION_LABELS[t]}</option>
          ))}
        </select>
        <input
          value={section.label}
          onChange={(e) => onUpdateMeta({ label: e.target.value })}
          placeholder={SECTION_LABELS[section.type] || 'Label'}
          className="border rounded px-2 py-1 text-sm flex-1 min-w-[8rem]"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
        />
        <div className="flex items-center gap-1 ml-auto text-xs">
          <button onClick={() => onMove(-1)} disabled={isFirst} title="Move section up" className="px-1.5 py-1 disabled:opacity-20 hover:underline">↑</button>
          <button onClick={() => onMove(1)} disabled={isLast} title="Move section down" className="px-1.5 py-1 disabled:opacity-20 hover:underline">↓</button>
          <button onClick={onDuplicate} title="Duplicate section" className="px-1.5 py-1 hover:underline">⧉ Duplicate</button>
          <button onClick={onRemove} title="Delete section" className="px-1.5 py-1 text-red-500 hover:underline">✕ Delete</button>
        </div>
      </div>

      {section.lines.map((line, idx) => (
        <LineRow
          key={line._k}
          line={line}
          sectionKey={section._k}
          onRemoveLine={onRemoveLine}
          onMoveLine={onMoveLine}
          onRetextLine={onRetextLine}
          onAppendChordSlot={onAppendChordSlot}
          onSyllableAction={onSyllableAction}
          onChordDrop={onChordDrop}
          isFirst={idx === 0}
          isLast={idx === section.lines.length - 1}
        />
      ))}

      {section.lines.length === 0 && <p className="opacity-40 text-sm italic mb-2">No lines yet.</p>}

      <div className="flex items-center gap-2 mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <input
          value={newLineText}
          onChange={(e) => setNewLineText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitNewLine();
          }}
          placeholder="Type a lyric line and press Enter to add it…"
          className="flex-1 border rounded px-2 py-1 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
        />
        <button onClick={submitNewLine} className="text-sm underline shrink-0">+ Add line</button>
      </div>
    </section>
  );
}
