import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLineups } from '../hooks/useLineups';
import { createLineup, deleteLineup } from '../api/lineups';

function formatDate(d) {
  if (!d) return 'No date set';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function LineupListPage() {
  const { data: lineups, isLoading, isError, error } = useLineups();
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleNew = async () => {
    setCreating(true);
    try {
      const lineup = await createLineup({ lineupDate: new Date().toISOString(), songs: [] });
      navigate(`/lineups/${lineup._id}/edit`);
    } catch (e) {
      window.alert(e.message || 'Could not create a new lineup.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lineup? This does not delete the songs in it.')) return;
    setDeletingId(id);
    try {
      await deleteLineup(id);
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    } catch (e) {
      window.alert(e.message || 'Could not delete this lineup.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Lineups</h1>
          <p className="text-sm opacity-60">Service set lists — what was sung, and in what key, on a given date.</p>
        </div>
        <button
          onClick={handleNew}
          disabled={creating}
          className="px-3 py-2 rounded font-medium shrink-0 disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
        >
          {creating ? 'Creating…' : '+ New Lineup'}
        </button>
      </div>

      {isLoading && <p className="opacity-70">Loading lineups…</p>}
      {isError && <p className="text-red-500">{error.message}</p>}
      {lineups && lineups.length === 0 && <p className="opacity-70">No lineups yet. Create one to get started.</p>}

      <div className="flex flex-col gap-3">
        {lineups?.map((lineup) => (
          <div
            key={lineup._id}
            className="rounded-lg border p-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="min-w-0">
              <div className="font-semibold">{formatDate(lineup.lineupDate)}</div>
              <div className="text-sm opacity-70 truncate">
                {lineup.songs.length === 0
                  ? 'No songs added yet'
                  : lineup.songs.map((s) => s.song?.title || '(deleted song)').join(' · ')}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm shrink-0">
              <Link to={`/lineups/${lineup._id}/live`} className="underline">
                Live
              </Link>
              <Link to={`/lineups/${lineup._id}/edit`} className="underline">
                Edit
              </Link>
              <button
                onClick={() => handleDelete(lineup._id)}
                disabled={deletingId === lineup._id}
                className="text-red-500 underline disabled:opacity-50"
              >
                {deletingId === lineup._id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
