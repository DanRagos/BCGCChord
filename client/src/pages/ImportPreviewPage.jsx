import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGenius, previewGeniusImport, previewPasteImport, saveImport } from '../api/imports';
import ChordLyricLine from '../components/chord/ChordLyricLine.jsx';

function lineCount(sections) {
  return (sections || []).reduce((n, s) => n + (s.lines?.length || 0), 0);
}

export default function ImportPreviewPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('search'); // 'search' | 'paste'

  // Genius search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Paste import
  const [pasteText, setPasteText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteArtist, setPasteArtist] = useState('');

  // Preview (shared by both modes once generated)
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const hits = await searchGenius(query.trim());
      setResults(hits);
    } catch (e2) {
      setSearchError(e2.message);
    } finally {
      setSearching(false);
    }
  };

  const handlePickGeniusResult = async (geniusId) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const p = await previewGeniusImport(geniusId);
      setPreview(p);
    } catch (e) {
      setPreviewError(e.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleParsePaste = async (e) => {
    e.preventDefault();
    if (!pasteText.trim()) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const p = await previewPasteImport({
        chordSheetText: pasteText,
        title: pasteTitle || undefined,
        artist: pasteArtist || undefined,
      });
      setPreview(p);
    } catch (e2) {
      setPreviewError(e2.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const discardPreview = () => {
    setPreview(null);
    setPreviewError(null);
    setSaveError(null);
  };

  const updatePreviewField = (field, value) => setPreview((cur) => ({ ...cur, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const song = await saveImport(preview);
      navigate(`/songs/${song._id}/edit`);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (preview) {
    const lyricsFound = preview.preview?.lyricsFound;
    return (
      <div>
        <button onClick={discardPreview} className="underline text-sm mb-4">← Start over</button>

        <h1 className="text-2xl font-bold mb-1">Review before saving</h1>
        <p className="text-sm opacity-60 mb-4">
          Nothing has been saved yet. Check the details below, then save to add it to your library — you'll land in
          the full editor afterward to place or adjust chords.
        </p>

        {lyricsFound === false && (
          <p className="text-sm mb-4 rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            Lyrics couldn't be automatically pulled from Genius for this song. It's been added with no lyrics yet —
            you can type them in once you're in the editor, or go back and try pasting a chord sheet instead.
          </p>
        )}

        {saveError && <p className="text-red-500 text-sm mb-3">{saveError}</p>}

        <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm">
          <label className="flex flex-col gap-1">
            Title
            <input
              value={preview.title || ''}
              onChange={(e) => updatePreviewField('title', e.target.value)}
              className="border rounded px-2 py-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </label>
          <label className="flex flex-col gap-1">
            Artist
            <input
              value={preview.artist || ''}
              onChange={(e) => updatePreviewField('artist', e.target.value)}
              className="border rounded px-2 py-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </label>
          <label className="flex flex-col gap-1">
            Album
            <input
              value={preview.album || ''}
              onChange={(e) => updatePreviewField('album', e.target.value)}
              className="border rounded px-2 py-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </label>
          <label className="flex flex-col gap-1">
            Original key
            <input
              value={preview.originalKey || ''}
              onChange={(e) => updatePreviewField('originalKey', e.target.value)}
              placeholder="e.g. C, F#m — Genius doesn't provide this"
              className="border rounded px-2 py-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
          </label>
        </div>

        {preview.preview?.imageUrl && (
          <img src={preview.preview.imageUrl} alt="" className="w-24 h-24 object-cover rounded-lg mb-4" />
        )}
        {preview.preview?.mediaUrl && (
          <p className="text-sm mb-4">
            <a href={preview.preview.mediaUrl} target="_blank" rel="noreferrer" className="underline">
              Reference video ↗
            </a>
          </p>
        )}

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm uppercase tracking-wide font-bold opacity-60">
            Parsed content — {preview.sections.length} section{preview.sections.length === 1 ? '' : 's'},{' '}
            {lineCount(preview.sections)} line{lineCount(preview.sections) === 1 ? '' : 's'}
          </h2>
          <button
            onClick={handleSave}
            disabled={saving || !preview.title?.trim()}
            className="px-3 py-1 rounded font-medium disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            {saving ? 'Saving…' : 'Save to library'}
          </button>
        </div>

        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          {preview.sections.length === 0 && <p className="opacity-50 text-sm italic">No lyrics parsed yet.</p>}
          {preview.sections.map((section, sIdx) => (
            <section key={sIdx} className="mb-6 last:mb-0">
              <h3 className="text-xs uppercase tracking-wide font-bold opacity-60 mb-1">
                {section.label || section.type}
              </h3>
              {section.lines.map((line, lIdx) => (
                <ChordLyricLine key={lIdx} line={line} />
              ))}
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Import a song</h1>
      <p className="text-sm opacity-60 mb-4">Search Genius, or paste a chord sheet — either way, you'll review it before anything's saved.</p>

      <div className="flex gap-2 mb-4 text-sm">
        <button
          onClick={() => setMode('search')}
          className={`px-3 py-1.5 rounded-full border ${mode === 'search' ? 'font-semibold' : 'opacity-60'}`}
          style={{ borderColor: 'var(--color-border)', backgroundColor: mode === 'search' ? 'var(--color-surface)' : 'transparent' }}
        >
          Search Genius
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`px-3 py-1.5 rounded-full border ${mode === 'paste' ? 'font-semibold' : 'opacity-60'}`}
          style={{ borderColor: 'var(--color-border)', backgroundColor: mode === 'paste' ? 'var(--color-surface)' : 'transparent' }}
        >
          Paste chord sheet
        </button>
      </div>

      {previewLoading && <p className="opacity-70 text-sm mb-3">Parsing…</p>}
      {previewError && <p className="text-red-500 text-sm mb-3">{previewError}</p>}

      {mode === 'search' && (
        <div>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4 max-w-lg">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Song title or artist…"
              className="flex-1 border rounded px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
            <button
              type="submit"
              disabled={searching}
              className="px-3 py-2 rounded font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>

          {searchError && <p className="text-red-500 text-sm mb-3">{searchError}</p>}
          {results && results.length === 0 && <p className="opacity-70 text-sm">No results.</p>}

          <div className="flex flex-col gap-2">
            {results?.map((hit) => (
              <button
                key={hit.geniusId}
                onClick={() => handlePickGeniusResult(hit.geniusId)}
                className="flex items-center gap-3 text-left rounded-lg border p-3 hover:shadow-md transition"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                {hit.imageUrl && <img src={hit.imageUrl} alt="" className="w-12 h-12 rounded object-cover shrink-0" />}
                <div className="min-w-0">
                  <div className="font-medium truncate">{hit.title}</div>
                  <div className="text-sm opacity-70 truncate">
                    {hit.artist}
                    {hit.releaseDate ? ` · ${hit.releaseDate}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'paste' && (
        <form onSubmit={handleParsePaste} className="max-w-2xl">
          <div className="grid sm:grid-cols-2 gap-3 mb-3 text-sm">
            <label className="flex flex-col gap-1">
              Title (optional)
              <input
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                className="border rounded px-2 py-1"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              />
            </label>
            <label className="flex flex-col gap-1">
              Artist (optional)
              <input
                value={pasteArtist}
                onChange={(e) => setPasteArtist(e.target.value)}
                className="border rounded px-2 py-1"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              />
            </label>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={12}
            placeholder={'Paste an Ultimate-Guitar-style or chords-over-words chord sheet here, e.g.\n\n[Verse 1]\nG                D\nAmazing grace, how sweet the sound'}
            className="w-full border rounded px-3 py-2 text-sm font-mono mb-3"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          />
          <button
            type="submit"
            disabled={previewLoading || !pasteText.trim()}
            className="px-3 py-2 rounded font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            {previewLoading ? 'Parsing…' : 'Parse'}
          </button>
        </form>
      )}
    </div>
  );
}
