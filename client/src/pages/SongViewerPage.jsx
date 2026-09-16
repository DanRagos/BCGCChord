import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSong } from '../hooks/useSongs';
import { transposeSong } from '../api/songs';
import ChordLyricLine from '../components/chord/ChordLyricLine.jsx';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SECTION_LABELS = {
  intro: 'Intro',
  verse: 'Verse',
  prechorus: 'Pre-Chorus',
  chorus: 'Chorus',
  postchorus: 'Post-Chorus',
  bridge: 'Bridge',
  interlude: 'Interlude',
  instrumental: 'Instrumental',
  solo: 'Solo',
  outro: 'Outro',
  custom: 'Section',
};

export default function SongViewerPage() {
  const { id } = useParams();
  const { data: song, isLoading, isError, error } = useSong(id);
  const queryClient = useQueryClient();
  const [fontScale, setFontScale] = useState(1);
  const [transposing, setTransposing] = useState(false);

  const handleTranspose = async (targetKey) => {
    if (!targetKey || !song || targetKey === song.currentKey) return;
    setTransposing(true);
    try {
      const updated = await transposeSong(id, targetKey);
      queryClient.setQueryData(['song', id], updated);
    } finally {
      setTransposing(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  if (isLoading) return <p className="opacity-70">Loading...</p>;
  if (isError) return <p className="text-red-500">{error.message}</p>;
  if (!song) return null;

  return (
    <div style={{ fontSize: `${fontScale}rem` }}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{song.title}</h1>
          <p className="opacity-70">
            {song.artist}
            {song.album ? ` · ${song.album}` : ''}
          </p>
        </div>
        <Link to={`/songs/${id}/edit`} className="underline text-sm shrink-0 mt-2">
          Edit
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
        <label className="flex items-center gap-2">
          Key:
          <select
            value={song.currentKey || song.originalKey || ''}
            disabled={!song.originalKey || transposing}
            onChange={(e) => handleTranspose(e.target.value)}
            className="border rounded px-2 py-1"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {!song.originalKey && <option value="">—</option>}
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        {song.originalKey && song.currentKey && song.currentKey !== song.originalKey && (
          <button className="underline" onClick={() => handleTranspose(song.originalKey)}>
            Reset to original ({song.originalKey})
          </button>
        )}
        {song.capo > 0 && <span>Capo: {song.capo}</span>}
        <label className="flex items-center gap-2">
          Text size:
          <input
            type="range"
            min="0.75"
            max="1.75"
            step="0.05"
            value={fontScale}
            onChange={(e) => setFontScale(parseFloat(e.target.value))}
          />
        </label>
        <button onClick={toggleFullscreen} className="underline">
          Fullscreen
        </button>
      </div>

      {song.sections.map((section, sIdx) => (
        <section key={section._id || sIdx} className="mb-8">
          <h2 className="text-sm uppercase tracking-wide font-bold opacity-60 mb-1">
            {section.label || SECTION_LABELS[section.type] || section.type}
          </h2>
          {section.lines.map((line, lIdx) => (
            <ChordLyricLine key={line._id || lIdx} line={line} />
          ))}
        </section>
      ))}

      {song.sections.length === 0 && <p className="opacity-70">This song has no sections yet.</p>}
    </div>
  );
}
