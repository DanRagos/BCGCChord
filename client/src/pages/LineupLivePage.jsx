import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLineup } from '../hooks/useLineups';
import { getSocket } from '../api/socket';
import { transposeSongForDisplay } from '../utils/transposeForDisplay';
import ChordLyricLine from '../components/chord/ChordLyricLine.jsx';

const SONG_TYPE_LABELS = {
  opening: 'Opening', praise: 'Praise', worship: 'Worship', response: 'Response',
  offering: 'Offering', communion: 'Communion', closing: 'Closing',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function LineupLivePage() {
  const { id } = useParams();
  const { data: lineup, isLoading, isError, error } = useLineup(id);

  const validEntries = useMemo(() => (lineup?.songs || []).filter((e) => e.song), [lineup]);

  const [currentSongId, setCurrentSongId] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const sectionRefs = useRef([]);

  // Default to the first song once the lineup loads.
  useEffect(() => {
    if (validEntries.length > 0 && !currentSongId) {
      setCurrentSongId(validEntries[0].song._id);
    }
  }, [validEntries, currentSongId]);

  // Join this lineup's room and follow whoever else scrolls. Last-scroll-wins,
  // no presenter lock, matching the socketService.js contract on the server.
  useEffect(() => {
    const socket = getSocket();
    socket.emit('lineup:join', { lineupId: id });

    const handleScrollTo = ({ songId, sectionIndex }) => {
      if (songId) setCurrentSongId(songId);
      setCurrentSectionIndex(sectionIndex || 0);
    };
    socket.on('lineup:scrollTo', handleScrollTo);
    return () => socket.off('lineup:scrollTo', handleScrollTo);
  }, [id]);

  const jumpTo = (songId, sectionIndex, { broadcast = true } = {}) => {
    setCurrentSongId(songId);
    setCurrentSectionIndex(sectionIndex);
    if (broadcast) {
      getSocket().emit('lineup:scrollTo', { songId, sectionIndex, lineIndex: 0 });
    }
  };

  const currentEntry = validEntries.find((e) => e.song._id === currentSongId);
  const currentSong = currentEntry
    ? transposeSongForDisplay(currentEntry.song, currentEntry.keyUsed || currentEntry.song.originalKey)
    : null;
  const sections = currentSong?.sections || [];

  useEffect(() => {
    sectionRefs.current[currentSectionIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentSectionIndex, currentSongId]);

  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!currentEntry) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentSectionIndex < sections.length - 1) jumpTo(currentSongId, currentSectionIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentSectionIndex > 0) jumpTo(currentSongId, currentSectionIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongId, currentSectionIndex, sections.length]);

  if (isLoading) return <p className="opacity-70">Loading…</p>;
  if (isError) return <p className="text-red-500">{error.message}</p>;
  if (!lineup) return null;

  return (
    // Escapes AppShell's centered/padded <main> on purpose: a live view wants
    // the whole screen, with only the lyrics scrolling — not the page. Fixed
    // (not absolute) so it tracks the viewport even as mobile browser chrome
    // shows/hides; `top-14` matches AppShell's header height exactly.
    <div className="fixed inset-x-0 bottom-0 top-14 flex flex-col lg:flex-row overflow-hidden">
      <aside
        className="shrink-0 border-b lg:border-b-0 lg:border-r lg:w-64 lg:h-full lg:overflow-y-auto"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="min-w-0">
              <div className="font-semibold truncate">{formatDate(lineup.lineupDate)}</div>
              <div className="text-xs opacity-50">Live · follows whoever scrolls</div>
            </div>
            <Link to={`/lineups/${id}/edit`} className="text-xs underline shrink-0">Edit</Link>
          </div>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {validEntries.map((entry) => {
              const isActive = entry.song._id === currentSongId;
              return (
                <button
                  key={entry.song._id}
                  onClick={() => jumpTo(entry.song._id, 0)}
                  className="text-left rounded-lg border px-3 py-2 shrink-0 min-w-[9rem] lg:min-w-0 lg:w-full"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: isActive ? 'white' : 'var(--color-text)',
                  }}
                >
                  <div className="text-xs uppercase tracking-wide opacity-70">{SONG_TYPE_LABELS[entry.songType] || 'Song'}</div>
                  <div className="font-medium text-sm">{entry.song.title}</div>
                  {entry.keyUsed && <div className="text-xs opacity-70">Key: {entry.keyUsed}</div>}
                </button>
              );
            })}
            {validEntries.length === 0 && <p className="text-sm opacity-50">No songs in this lineup yet.</p>}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        {currentSong ? (
          <>
            {/* Controls: shrink-0 so they never get pushed around by content
                below — only the section list underneath scrolls. */}
            <div
              className="shrink-0 border-b px-3 sm:px-4 py-3 flex flex-wrap items-start justify-between gap-3"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">{currentSong.title}</h1>
                <p className="opacity-70 text-xs sm:text-sm truncate">
                  {currentSong.artist}
                  {currentEntry.keyUsed && ` · Key: ${currentEntry.keyUsed}`}
                  {currentSong.capo > 0 && ` · Capo: ${currentSong.capo}`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs shrink-0">
                <button
                  onClick={() => currentSectionIndex > 0 && jumpTo(currentSongId, currentSectionIndex - 1)}
                  disabled={currentSectionIndex === 0}
                  className="px-3 py-1.5 rounded border disabled:opacity-30"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  ↑ <span className="hidden sm:inline">Prev section</span>
                </button>
                <button
                  onClick={() => currentSectionIndex < sections.length - 1 && jumpTo(currentSongId, currentSectionIndex + 1)}
                  disabled={currentSectionIndex >= sections.length - 1}
                  className="px-3 py-1.5 rounded border disabled:opacity-30"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  ↓ <span className="hidden sm:inline">Next section</span>
                </button>
              </div>
            </div>

            {/* The only scrollable region on this page. */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4">
              {sections.map((section, sIdx) => (
                <section
                  key={section._id || sIdx}
                  ref={(el) => (sectionRefs.current[sIdx] = el)}
                  onClick={() => jumpTo(currentSongId, sIdx)}
                  className={`mb-6 rounded-lg p-3 -mx-3 cursor-pointer transition-colors ${
                    sIdx === currentSectionIndex ? 'ring-2' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{ '--tw-ring-color': 'var(--color-accent)' }}
                >
                  <h2 className="text-sm uppercase tracking-wide font-bold opacity-60 mb-1">
                    {section.label || section.type}
                  </h2>
                  {section.lines.map((line, lIdx) => (
                    <ChordLyricLine key={line._id || lIdx} line={line} />
                  ))}
                </section>
              ))}
              {sections.length === 0 && <p className="opacity-70">This song has no sections yet.</p>}
            </div>
          </>
        ) : (
          <p className="opacity-70 p-4">Add songs to this lineup to start a live view.</p>
        )}
      </main>
    </div>
  );
}
