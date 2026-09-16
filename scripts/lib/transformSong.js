// Pure transformation logic for migrating a pre-MERN Song document into the
// new syllable/chordAnchor schema (see server/models/Song.js and
// architecture/phase2-design.md). Deliberately has NO database access of its
// own — server/scripts/migrate.js does the I/O; this module is testable in
// total isolation, which matters because there was no way to verify the old
// schema against a live document while writing this (see migrate.js's
// --inspect mode, and the note in status/phase8-migration-status.md).
//
// The old model (documented in audit/phase1-audit.md, from directly reading
// the original source during Phase 1, before any of it was removed):
//   Song.segments = [{ section, chords: [{ lyricSection: [String], chords: [String], line }] }]
// i.e. one "segment" per section; each segment's `chords` array is really an
// array of LINES.
//
// IMPORTANT (corrected Sept 14, against real data + confirmed directly by
// the person who wrote the old app): each line's `lyricSection` is an array
// of CHUNKS, not one word each — a chunk can be several whitespace-separated
// words (e.g. "We live for "). And `chords` is deliberately ONE LONGER than
// `lyricSection`, by design, not a data error: chords[i] for
// i < lyricSection.length is the chord immediately BEFORE chunk i starts;
// the final, extra chords[lyricSection.length] is the chord immediately
// AFTER the last chunk ends (a trailing, end-of-line chord — e.g. a
// turnaround chord with no lyric under it). An earlier version of this
// script assumed same-length parallel arrays (one chord per word, same
// index) and silently dropped every trailing chord as "no matching word" —
// caught by running `migrate:inspect`/a dry run against real data, see
// status/phase8-migration-status.md.
const { splitWordIntoSyllables } = require('../../server/utils/syllabifier');
const { normalizeSectionType } = require('../../server/services/chordParserService');

function looksLikeNewShape(doc) {
  return Array.isArray(doc.sections);
}

function looksLikeOldShape(doc) {
  return Array.isArray(doc.segments);
}

let wordCounter = 0;
function nextMigrationWordId() {
  wordCounter += 1;
  return `mw${Date.now().toString(36)}${wordCounter}`;
}

// Converts one old-model line into the new { syllables, chordAnchors }
// shape. See the header comment above for the (corrected) old layout:
// lyricSection is an array of chunks (each possibly multiple words), and
// chords is exactly one longer than lyricSection — a pre-chunk chord for
// each chunk, plus one trailing chord after the whole line.
//
// Word spacing is normalized to exactly one space syllable between any two
// consecutive words, whether the gap fell within a chunk's own text or at a
// chunk boundary — the old data's literal whitespace (e.g. a chunk ending
// in a trailing space) isn't preserved verbatim, since it was only ever
// there to serve this same one-word-gap purpose.
function transformOldLine(oldLine) {
  const chunksRaw = Array.isArray(oldLine.lyricSection) ? oldLine.lyricSection : [];
  const chordsRaw = Array.isArray(oldLine.chords) ? oldLine.chords : [];
  const warnings = [];

  const syllables = [];
  const chordAnchors = [];
  let hasContent = false; // whether any lyric/chordSlot syllable has been emitted yet (for spacing)
  let lastContentSyllableIndex = -1; // last lyric/chordSlot syllable emitted (for the trailing chord)

  function addSpaceIfNeeded() {
    if (hasContent) {
      syllables.push({ text: ' ', wordId: null, isWordStart: false, isWordEnd: false, type: 'space' });
    }
  }

  chunksRaw.forEach((rawChunk, cIdx) => {
    const chunkText = typeof rawChunk === 'string' ? rawChunk : String(rawChunk ?? '');
    const words = chunkText.split(/\s+/).filter((w) => w.length > 0);
    const preChord = (chordsRaw[cIdx] || '').toString().trim();

    if (words.length === 0) {
      // An empty chunk that still has a chord attached is a chord with no
      // lyric under it at all — exactly the case the schema's zero-width
      // "chordSlot" syllable type exists for. An empty chunk with no chord
      // contributes nothing.
      if (preChord) {
        addSpaceIfNeeded();
        syllables.push({ text: '', wordId: null, isWordStart: false, isWordEnd: false, type: 'chordSlot' });
        const slotIndex = syllables.length - 1;
        chordAnchors.push({ chord: preChord, syllableIndex: slotIndex, charOffset: 0 });
        hasContent = true;
        lastContentSyllableIndex = slotIndex;
      }
      return;
    }

    words.forEach((word, wIdxInChunk) => {
      addSpaceIfNeeded();
      const wordId = nextMigrationWordId();
      const firstSyllableIndexOfWord = syllables.length;
      const pieces = splitWordIntoSyllables(word);
      pieces.forEach((piece, i) => {
        syllables.push({
          text: piece,
          wordId,
          isWordStart: i === 0,
          isWordEnd: i === pieces.length - 1,
          type: 'lyric',
        });
      });
      hasContent = true;
      lastContentSyllableIndex = syllables.length - 1;

      // The chord recorded for this chunk anchors immediately BEFORE the
      // chunk's first word only — the old model only ever recorded one
      // chord position per chunk, at its start.
      if (wIdxInChunk === 0 && preChord) {
        chordAnchors.push({ chord: preChord, syllableIndex: firstSyllableIndexOfWord, charOffset: 0 });
      }
    });
  });

  // The final, extra entry in chords[] (see header comment) is a trailing
  // chord that anchors right AFTER the last syllable in the line — the only
  // "after" position charOffset supports (matching how the editor's
  // click-right-half-of-syllable placement already works).
  const trailingChord = (chordsRaw[chunksRaw.length] || '').toString().trim();
  if (trailingChord) {
    if (lastContentSyllableIndex >= 0) {
      chordAnchors.push({
        chord: trailingChord,
        syllableIndex: lastContentSyllableIndex,
        charOffset: syllables[lastContentSyllableIndex].text.length,
      });
    } else {
      warnings.push(`trailing chord "${trailingChord}" had no preceding lyric to attach to and was dropped`);
    }
  }

  // Anything beyond that documented length-plus-one is genuinely
  // unexpected — not part of the by-design layout — so it's warned about
  // and dropped rather than guessed at.
  const expectedLength = chunksRaw.length + 1;
  if (chordsRaw.length > expectedLength) {
    warnings.push(
      `${chordsRaw.length - expectedLength} unexpected extra chord(s) beyond the documented before/after-chunk layout were dropped`
    );
  }

  chordAnchors.sort((a, b) => a.syllableIndex - b.syllableIndex || a.charOffset - b.charOffset);

  return { line: { syllables, chordAnchors }, warnings };
}

// Converts one full old-shape Song document into the new shape. Keeps the
// same _id deliberately: Lineup documents reference songs by _id
// (songs[].song), and preserving it means every existing Lineup keeps
// pointing at the right (now-migrated) song with no Lineup-side migration
// needed at all.
function transformOldSongToNew(oldDoc) {
  const warnings = [];
  const segments = Array.isArray(oldDoc.segments) ? oldDoc.segments : [];
  const sectionCounters = {};

  const sections = segments.map((segment, sIdx) => {
    const rawName = (segment && segment.section ? segment.section : '').toString().trim() || `Section ${sIdx + 1}`;
    const type = normalizeSectionType(rawName.replace(/\s*\d+$/, ''));
    const countKey = rawName.toLowerCase();
    sectionCounters[countKey] = (sectionCounters[countKey] || 0) + 1;

    const oldLines = Array.isArray(segment && segment.chords) ? segment.chords : [];
    const lines = oldLines.map((oldLine, lIdx) => {
      const { line, warnings: lineWarnings } = transformOldLine(oldLine || {});
      lineWarnings.forEach((w) => warnings.push(`section "${rawName}" line ${lIdx + 1}: ${w}`));
      return line;
    });

    return { type, label: rawName, lines };
  });

  // Best-effort carry-over of top-level fields. Only `segments` is
  // documented with certainty (see header comment) — everything below has a
  // tolerant fallback and a warning when even that comes up empty, rather
  // than silently guessing wrong and shipping bad data.
  const title = (oldDoc.title || oldDoc.name || '').toString().trim();
  if (!title) warnings.push('no recognizable title field found on this document — check it manually after migrating');

  // geniusId: confirmed via `migrate:inspect` against real data that the old
  // schema's field is `songId`, not `geniusId`/`genius_id` (those were only
  // guesses before live data was available — see
  // status/phase8-migration-status.md). Carried over defensively: the target
  // schema field is typed Number, so this only sets it when the value
  // actually coerces to a finite number, and warns instead of miscasting
  // something that would otherwise fail validateSync() silently downstream.
  let geniusId;
  const rawGeniusId = oldDoc.geniusId ?? oldDoc.genius_id ?? oldDoc.songId;
  if (rawGeniusId !== undefined && rawGeniusId !== null && rawGeniusId !== '') {
    const n = Number(rawGeniusId);
    if (Number.isFinite(n)) {
      geniusId = n;
    } else {
      warnings.push(`songId/geniusId value "${rawGeniusId}" is not a valid number — dropped`);
    }
  }

  // yearReleased (confirmed real field, e.g. "2018") has no home in the new
  // schema — it isn't part of the chord/lyric editing feature set — so
  // rather than silently dropping it, fold it into metadata.notes as a
  // human-readable breadcrumb.
  const notesParts = ['Migrated from the pre-MERN schema.'];
  if (oldDoc.yearReleased) notesParts.push(`Released: ${oldDoc.yearReleased}.`);

  const migrated = {
    title: title || 'Untitled (migrated)',
    artist: oldDoc.artist || oldDoc.artist_names || '',
    album: oldDoc.album || '',
    // baseKey is the confirmed real old-schema field name for this (found via
    // migrate:inspect); `key` is kept as a lower-priority fallback in case an
    // older or differently-shaped document used that name instead.
    originalKey: oldDoc.originalKey || oldDoc.baseKey || oldDoc.key || '',
    currentKey: oldDoc.currentKey || oldDoc.originalKey || oldDoc.baseKey || oldDoc.key || '',
    ...(typeof oldDoc.tempo === 'number' ? { tempo: oldDoc.tempo } : {}),
    capo: typeof oldDoc.capo === 'number' ? oldDoc.capo : 0,
    sections,
    metadata: { genre: '', tags: [], timeSignature: '', notes: notesParts.join(' ') },
    source: {
      type: 'migrated',
      ...(geniusId !== undefined ? { geniusId } : {}),
      ...(oldDoc.sourceUrl || oldDoc.url ? { sourceUrl: oldDoc.sourceUrl || oldDoc.url } : {}),
      // urlMedia/songArt are the confirmed real old-schema field names for
      // these (see server/models/Song.js's source.mediaUrl/imageUrl, added
      // alongside this fix once migrate:inspect showed the old app HAD been
      // persisting them long-term, unlike the current import flow which only
      // ever showed them transiently until this same change).
      ...(oldDoc.urlMedia || oldDoc.mediaUrl ? { mediaUrl: oldDoc.urlMedia || oldDoc.mediaUrl } : {}),
      ...(oldDoc.songArt || oldDoc.imageUrl ? { imageUrl: oldDoc.songArt || oldDoc.imageUrl } : {}),
      importedAt: oldDoc.createdAt || new Date(),
    },
    ...(oldDoc.org ? { org: oldDoc.org } : {}),
    ...(oldDoc.createdBy || oldDoc.user ? { createdBy: oldDoc.createdBy || oldDoc.user } : {}),
    createdAt: oldDoc.createdAt || new Date(),
    updatedAt: new Date(),
  };

  return { migrated, warnings };
}

module.exports = { transformOldSongToNew, transformOldLine, looksLikeOldShape, looksLikeNewShape };
