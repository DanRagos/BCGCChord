import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSongs } from '../hooks/useSongs';
import { createSong } from '../api/songs';

export default function LibraryPage() {
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError, error } = useSongs({ q: q || undefined, limit: 40 });
  const navigate = useNavigate();

  const handleNewSong = async () => {
    setCreating(true);
    try {
      const song = await createSong({ title: 'Untitled Song', sections: [] });
      navigate(`/songs/${song._id}/edit`);
    } catch (e) {
      window.alert(e.message || 'Could not create a new song.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Song Library</h1>
        <div className="flex items-center gap-3 flex-1 max-w-xl justify-end">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or artist..."
            className="border rounded px-3 py-2 flex-1 max-w-xs"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          />
          <Link
            to="/import"
            className="px-3 py-2 rounded font-medium shrink-0 border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            Import
          </Link>
          <button
            onClick={handleNewSong}
            disabled={creating}
            className="px-3 py-2 rounded font-medium shrink-0 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            {creating ? 'Creating…' : '+ New Song'}
          </button>
        </div>
      </div>

      {isLoading && <p className="opacity-70">Loading songs...</p>}
      {isError && <p className="text-red-500">{error.message}</p>}

      {data && data.songs.length === 0 && (
        <p className="opacity-70">No songs yet. Create one, import one, or paste a chord sheet to get started.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.songs.map((song) => (
          <Link
            key={song._id}
            to={`/songs/${song._id}`}
            className="block rounded-lg border p-4 hover:shadow-md transition"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="font-semibold">{song.title}</div>
            <div className="text-sm opacity-70">{song.artist || 'Unknown artist'}</div>
            <div className="text-xs mt-2 flex gap-3 opacity-60">
              {(song.currentKey || song.originalKey) && <span>Key: {song.currentKey || song.originalKey}</span>}
              <span>Updated {new Date(song.updatedAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
