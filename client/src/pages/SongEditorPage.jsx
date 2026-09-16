import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSong } from '../hooks/useSongs.js';
import { updateSong } from '../api/songs.js';
import { useUndoableState } from '../hooks/useUndoableState.js';
import {
  hydrateSong,
  dehydrateSong,
  addSection,
  removeSection,
  updateSectionMeta,
  moveSection,
  duplicateSection,
  addLine,
  removeLine,
  moveLine,
  retextLine,
  appendChordSlot,
  addChordAnchor,
  updateChordAnchor,
  removeChordAnchor,
  moveChordAnchor,
} from '../utils/songTree.js';
import SectionEditorBlock from '../components/editor/SectionEditorBlock.jsx';
import ChordPopover from '../components/chord/ChordPopover.jsx';

export default function SongEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: fetchedSong, isLoading, isError, error } = useSong(id);

  const { value: song, set, reset, undo, redo, canUndo, canRedo } = useUndoableState(null);
  const savedSnapshotRef = useRef(null);
  const [popover, setPopover] = useState(null); // { sectionKey, lineKey, syllableIndex, charOffset, anchorKey, isNew, position }
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  // Load (and reload, e.g. after a save) the server song into local editable
  // state with fresh client-only keys, and reset undo history.
  useEffect(() => {
    if (!fetchedSong) return;
    const hydrated = hydrateSong(fetchedSong);
    reset(hydrated);
    savedSnapshotRef.current = JSON.stringify(dehydrateSong(hydrated));
  }, [fetchedSong, reset]);

  const isDirty = song ? JSON.stringify(dehydrateSong(song)) !== savedSnapshotRef.current : false;

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return; // let native input undo work
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  if (isLoading || !song) return <p className="opacity-70">Loading…</p>;
  if (isError) return <p className="text-red-500">{error.message}</p>;

  const closePopover = () => setPopover(null);

  const handleSyllableAction = ({ sectionKey, lineKey, syllableIndex, charOffset, existing, position }) => {
    setPopover({
      sectionKey,
      lineKey,
      syllableIndex,
      charOffset,
      anchorKey: existing?._k || null,
      isNew: !existing,
      initialChord: existing?.chord || '',
      position,
    });
  };

  const handlePopoverSave = (chordText) => {
    if (!popover) return;
    if (popover.isNew) {
      set((s) => addChordAnchor(s, popover.sectionKey, popover.lineKey, {
        chord: chordText,
        syllableIndex: popover.syllableIndex,
        charOffset: popover.charOffset,
      }));
    } else {
      set((s) => updateChordAnchor(s, popover.sectionKey, popover.lineKey, popover.anchorKey, { chord: chordText }));
    }
    closePopover();
  };

  const handlePopoverDelete = () => {
    if (!popover) return;
    set((s) => removeChordAnchor(s, popover.sectionKey, popover.lineKey, popover.anchorKey));
    closePopover();
  };

  const handleChordDrop = ({ anchorKey, fromSectionKey, fromLineKey, toSectionKey, toLineKey, syllableIndex, charOffset }) => {
    set((s) => moveChordAnchor(
      s,
      { sectionKey: fromSectionKey, lineKey: fromLineKey, anchorKey },
      { sectionKey: toSectionKey, lineKey: toLineKey, syllableIndex, charOffset }
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = dehydrateSong(song);
      const result = await updateSong(id, payload);
      const hydrated = hydrateSong(result);
      reset(hydrated);
      savedSnapshotRef.current = JSON.stringify(dehydrateSong(hydrated));
      queryClient.setQueryData(['song', id], result);
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      setSavedAt(Date.now());
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
    navigate(`/songs/${id}`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={handleBack} className="underline text-sm shrink-0">← Back to viewer</button>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {isDirty && <span className="opacity-60">Unsaved changes</span>}
          {!isDirty && savedAt && <span className="opacity-60">Saved</span>}
          <button onClick={undo} disabled={!canUndo} className="px-2 py-1 rounded border disabled:opacity-30" style={{ borderColor: 'var(--color-border)' }}>
            ↶ Undo
          </button>
          <button onClick={redo} disabled={!canRedo} className="px-2 py-1 rounded border disabled:opacity-30" style={{ borderColor: 'var(--color-border)' }}>
            ↷ Redo
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-3 py-1 rounded font-medium disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {saveError && <p className="text-red-500 text-sm mb-3">{saveError}</p>}

      <div className="grid sm:grid-cols-2 gap-3 mb-6 text-sm">
        <label className="flex flex-col gap-1">
          Title
          <input
            value={song.title || ''}
            onChange={(e) => set((s) => ({ ...s, title: e.target.value }))}
            className="border rounded px-2 py-1"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          />
        </label>
        <label className="flex flex-col gap-1">
          Artist
          <input
            value={song.artist || ''}
            onChange={(e) => set((s) => ({ ...s, artist: e.target.value }))}
            className="border rounded px-2 py-1"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          />
        </label>
        <label className="flex flex-col gap-1">
          Album
          <input
            value={song.album || ''}
            onChange={(e) => set((s) => ({ ...s, album: e.target.value }))}
            className="border rounded px-2 py-1"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          />
        </label>
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 flex-1">
            Original key
            <input
              value={song.originalKey || ''}
              onChange={(e) => set((s) => ({ ...s, originalKey: e.target.value }))}
              placeholder="e.g. C, F#m"
              className="border rounded px-2 py-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </label>
          <label className="flex flex-col gap-1 w-20">
            Capo
            <input
              type="number"
              min="0"
              value={song.capo ?? 0}
              onChange={(e) => set((s) => ({ ...s, capo: parseInt(e.target.value, 10) || 0 }))}
              className="border rounded px-2 py-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </label>
          <label className="flex flex-col gap-1 w-24">
            Tempo
            <input
              type="number"
              min="0"
              value={song.tempo ?? ''}
              onChange={(e) => set((s) => ({ ...s, tempo: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              className="border rounded px-2 py-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </label>
        </div>
        {song.currentKey && song.currentKey !== song.originalKey && (
          <p className="sm:col-span-2 text-xs opacity-60">
            Currently viewing/editing in {song.currentKey} (transposed from {song.originalKey}). Chords you place here
            are saved correctly back to {song.originalKey} — use the viewer's key selector to change what key you're
            editing in.
          </p>
        )}
      </div>

      <p className="text-xs opacity-50 mb-3">
        Click a syllable to place a chord — left half puts it before the syllable, right half puts it after. Click an
        existing chord to edit or delete it. Drag a chord onto a different syllable (even on another line) to move it.
      </p>

      {song.sections.map((section, idx) => (
        <SectionEditorBlock
          key={section._k}
          section={section}
          isFirst={idx === 0}
          isLast={idx === song.sections.length - 1}
          onUpdateMeta={(patch) => set((s) => updateSectionMeta(s, section._k, patch))}
          onMove={(direction) => set((s) => moveSection(s, section._k, direction))}
          onDuplicate={() => set((s) => duplicateSection(s, section._k))}
          onRemove={() => {
            if (section.lines.length > 0 && !window.confirm('Delete this section and all its lines?')) return;
            set((s) => removeSection(s, section._k));
          }}
          onAddLine={(text) => set((s) => addLine(s, section._k, text))}
          onRemoveLine={(lineKey) => set((s) => removeLine(s, section._k, lineKey))}
          onMoveLine={(lineKey, direction) => set((s) => moveLine(s, section._k, lineKey, direction))}
          onRetextLine={(lineKey, text) => set((s) => retextLine(s, section._k, lineKey, text))}
          onAppendChordSlot={(lineKey) => set((s) => appendChordSlot(s, section._k, lineKey))}
          onSyllableAction={handleSyllableAction}
          onChordDrop={handleChordDrop}
        />
      ))}

      <button
        onClick={() => set((s) => addSection(s, { type: 'verse', label: '' }))}
        className="w-full text-sm py-3 rounded-lg border border-dashed hover:bg-black/5 dark:hover:bg-white/5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        + Add section
      </button>

      {popover && (
        <ChordPopover
          position={popover.position}
          initialChord={popover.initialChord}
          isNew={popover.isNew}
          onSave={handlePopoverSave}
          onDelete={handlePopoverDelete}
          onClose={closePopover}
        />
      )}
    </div>
  );
}
