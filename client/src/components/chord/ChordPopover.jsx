import { useEffect, useRef, useState } from 'react';
import { looksLikeChordToken } from '../../utils/chordLike.js';

// A small floating editor anchored near a click point. Used both to place a
// brand-new chord anchor and to edit/delete an existing one.
export default function ChordPopover({ position, initialChord = '', isNew, onSave, onDelete, onClose }) {
  const [value, setValue] = useState(initialChord);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const trimmed = value.trim();
  const looksValid = !trimmed || looksLikeChordToken(trimmed);

  const handleSave = () => {
    if (!trimmed) return;
    onSave(trimmed);
  };

  // Clamp so the popover never renders off-screen near the edges.
  const left = Math.min(Math.max(position.x, 90), (typeof window !== 'undefined' ? window.innerWidth : 800) - 90);
  const top = Math.max(position.y - 12, 8);

  return (
    <div
      ref={ref}
      className="fixed z-50 shadow-lg rounded-lg border p-2 -translate-x-1/2 -translate-y-full"
      style={{
        left,
        top,
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
          placeholder="e.g. Cmaj7, G/B, N.C."
          className="w-28 text-sm border rounded px-2 py-1"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
        />
        <button
          onClick={handleSave}
          disabled={!trimmed}
          className="text-sm px-2 py-1 rounded font-medium disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
        >
          {isNew ? 'Add' : 'Save'}
        </button>
        {!isNew && (
          <button onClick={onDelete} className="text-sm px-2 py-1 rounded text-red-500 hover:underline">
            Delete
          </button>
        )}
      </div>
      {!looksValid && (
        <p className="text-xs mt-1 opacity-60">Doesn't look like a chord — it'll still be saved as typed.</p>
      )}
    </div>
  );
}
