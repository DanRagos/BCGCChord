import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLineup } from '../hooks/useLineups';
import { updateLineup } from '../api/lineups';
import { fetchSongs } from '../api/songs';

const SONG_TYPES = ['opening', 'praise', 'worship', 'response', 'offering', 'communion', 'closing'];
const SONG_TYPE_LABELS = {
  opening: 'Opening', praise: 'Praise', worship: 'Worship', response: 'Response',
  offering: 'Offering', communion: 'Communion', closing: 'Closing',
};

let keyCounter = 0;
function localKey() {
  keyCounter += 1;
  return `lu_${Date.now().toString(36)}_${keyCounter}`;
}

function toLocalDateInput(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toEditableEntries(lineup) {
  return (lineup.songs || [])
    .filter((entry) => entry.song) // guard against a song that was since deleted
    .map((entry) => ({
      _k: localKey(),
      song: entry.song,
      keyUsed: entry.keyUsed || entry.song.originalKey || '',
      songType: entry.songType || 'worship',
    }));
}

export default function LineupEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: lineup, isLoading, isError, error } = useLineup(id);

  const [lineupDate, setLineupDate] = useState('');
  const [entries, setEntries] = useState(null);
  const savedSnapshotRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!lineup) return;
    setLineupDate(toLocalDateInput(lineup.lineupDate));
    const initialEntries = toEditableEntries(lineup);
    setEntries(initialEntries);
    savedSnapshotRef.current = JSON.stringify({ lineupDate: toLocalDateInput(lineup.lineupDate), entries: initialEntries.map(stripKey) });
  }, [lineup]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await fetchSongs({ q: query, limit: 8 });
        setResults(data.songs);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function stripKey(e) {
    return { song: e.song._id, keyUsed: e.keyUsed, songType: e.songType };
  }

  const isDirty = entries ? JSON.stringify({ lineupDate, entries: entries.map(stripKey) }) !== savedSnapshotRef.current : false;

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (isLoading || !entries) return <p className="opacity-70">Loading…</p>;
  if (isError) return <p className="text-red-500">{error.message}</p>;

  const addSong = (song) => {
    if (entries.some((e) => e.song._id === song._id)) return;
    setEntries((cur) => [...cur, { _k: localKey(), song, keyUsed: song.originalKey || '', songType: 'worship' }]);
    setQuery('');
    setResults([]);
  };

  const removeEntry = (k) => setEntries((cur) => cur.filter((e) => e._k !== k));

  const moveEntry = (k, direction) => {
    setEntries((cur) => {
      const idx = cur.findIndex((e) => e._k === k);
      const target = idx + direction;
      if (idx === -1 || target < 0 || target >= cur.length) return cur;
      const next = cur.slice();
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const updateEntry = (k, patch) => {
    setEntries((cur) => cur.map((e) => (e._k === k ? { ...e, ...patch } : e)));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        lineupDate: lineupDate ? new Date(lineupDate).toISOString() : undefined,
        songs: entries.map(stripKey),
      };
      // Note: PUT /lineups/:id returns the lineup WITHOUT song populated
      // (unlike GET), so we don't cache `result` directly — invalidating
      // triggers a refetch through the populated GET instead.
      await updateLineup(id, payload);
      queryClient.invalidateQueries({ queryKey: ['lineup', id] });
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
      savedSnapshotRef.current = JSON.stringify({ lineupDate, entries: entries.map(stripKey) });
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
    navigate('/lineups');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={handleBack} className="underline text-sm shrink-0">← Back to lineups</button>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {isDirty && <span className="opacity-60">Unsaved changes</span>}
          <Link to={`/lineups/${id}/live`} className="underline">Live view</Link>
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

      <label className="flex flex-col gap-1 text-sm mb-6 max-w-xs">
        Service date
        <input
          type="date"
          value={lineupDate}
          onChange={(e) => setLineupDate(e.target.value)}
          className="border rounded px-2 py-1"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        />
      </label>

      <div className="flex flex-col gap-2 mb-4">
        {entries.map((entry, idx) => (
          <div
            key={entry._k}
            className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="min-w-[10rem] flex-1">
              <div className="font-medium">{entry.song.title}</div>
              <div className="text-xs opacity-60">{entry.song.artist || 'Unknown artist'}</div>
            </div>
            <select
              value={entry.songType}
              onChange={(e) => updateEntry(entry._k, { songType: e.target.value })}
              className="border rounded px-2 py-1 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
              {SONG_TYPES.map((t) => (
                <option key={t} value={t}>{SONG_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input
              value={entry.keyUsed}
              onChange={(e) => updateEntry(entry._k, { keyUsed: e.target.value })}
              placeholder="Key used"
              className="border rounded px-2 py-1 text-sm w-24"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            />
            <div className="flex items-center gap-1 text-xs">
              <button onClick={() => moveEntry(entry._k, -1)} disabled={idx === 0} className="px-1 disabled:opacity-20 hover:underline">↑</button>
              <button onClick={() => moveEntry(entry._k, 1)} disabled={idx === entries.length - 1} className="px-1 disabled:opacity-20 hover:underline">↓</button>
              <button onClick={() => removeEntry(entry._k)} className="px-1 text-red-500 hover:underline">✕</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="opacity-40 text-sm italic">No songs added yet.</p>}
      </div>

      <div className="relative max-w-md">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs to add…"
          className="w-full border rounded px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        />
        {(searching || results.length > 0) && query.trim() && (
          <div
            className="absolute z-10 mt-1 w-full rounded-lg border shadow-lg max-h-64 overflow-auto"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {searching && <div className="px-3 py-2 text-sm opacity-60">Searching…</div>}
            {!searching && results.length === 0 && <div className="px-3 py-2 text-sm opacity-60">No matches</div>}
            {!searching &&
              results.map((song) => (
                <button
                  key={song._id}
                  onClick={() => addSong(song)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span className="font-medium">{song.title}</span>{' '}
                  <span className="opacity-60">{song.artist}</span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
