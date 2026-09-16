const ChordSheetJS = require('chordsheetjs');
const { splitWordIntoSyllables } = require('../utils/syllabifier');
const { nextWordId } = require('../utils/lineTokenizer');

// --- Bridges ChordSheetJS's per-item chord/lyric pairs into our
// syllable + chordAnchor line model (see models/Song.js). ChordSheetJS
// already tells us exactly which character offset each chord sat at in the
// source text; this function maps that offset onto one of our syllables
// instead of collapsing everything into "one chord per word" like the old
// app did. ---
function buildLineFromItems(items) {
  let rawText = '';
  const marks = []; // { offset, chord }

  items.forEach((item) => {
    const lyrics = item.lyrics || '';
    const chord = (item.chords || '').trim();
    if (chord) marks.push({ offset: rawText.length, chord });
    rawText += lyrics;
  });

  // Pure instrumental / chords-only line: nothing to anchor to, so give each
  // chord its own zero-width chordSlot syllable in order.
  if (rawText.trim().length === 0) {
    const syllables = marks.map(() => ({
      text: '',
      wordId: null,
      isWordStart: false,
      isWordEnd: false,
      type: 'chordSlot',
    }));
    const chordAnchors = marks.map((m, i) => ({ chord: m.chord, syllableIndex: i, charOffset: 0 }));
    return { syllables, chordAnchors };
  }

  const syllables = [];
  const starts = [];
  let cursor = 0;

  rawText
    .split(/(\s+)/)
    .filter((p) => p.length > 0)
    .forEach((part) => {
      if (/^\s+$/.test(part)) {
        starts.push(cursor);
        syllables.push({ text: part, wordId: null, isWordStart: false, isWordEnd: false, type: 'space' });
        cursor += part.length;
        return;
      }
      const wordId = nextWordId();
      const pieces = splitWordIntoSyllables(part);
      pieces.forEach((piece, i) => {
        starts.push(cursor);
        syllables.push({
          text: piece,
          wordId,
          isWordStart: i === 0,
          isWordEnd: i === pieces.length - 1,
          type: 'lyric',
        });
        cursor += piece.length;
      });
    });

  const totalLength = cursor;

  function locate(offset) {
    // Prefer landing exactly on a syllable boundary (the common case: a
    // chord placed right before a word or a syllable).
    for (let i = 0; i < syllables.length; i += 1) {
      if (starts[i] === offset) return { index: i, charOffset: 0 };
    }
    // Otherwise the chord falls inside a syllable's text (mid-syllable /
    // mid-word placement).
    for (let i = 0; i < syllables.length; i += 1) {
      const start = starts[i];
      const end = start + syllables[i].text.length;
      if (offset > start && offset < end) return { index: i, charOffset: offset - start };
    }
    // Chord placed at or past the end of the line's text.
    const last = syllables.length - 1;
    return { index: last, charOffset: syllables[last].text.length };
  }

  const chordAnchors = marks.map((m) => {
    const loc = locate(Math.min(m.offset, totalLength));
    return { chord: m.chord, syllableIndex: loc.index, charOffset: loc.charOffset };
  });

  return { syllables, chordAnchors };
}

const SECTION_NAME_MAP = {
  verse: 'verse',
  chorus: 'chorus',
  'pre-chorus': 'prechorus',
  prechorus: 'prechorus',
  'post-chorus': 'postchorus',
  postchorus: 'postchorus',
  bridge: 'bridge',
  intro: 'intro',
  outro: 'outro',
  interlude: 'interlude',
  instrumental: 'instrumental',
  solo: 'solo',
  tab: 'instrumental',
};

function normalizeSectionType(name) {
  const key = (name || '').trim().toLowerCase();
  return SECTION_NAME_MAP[key] || 'custom';
}

// Parses a pasted chord sheet (Ultimate-Guitar-tagged or plain
// chords-over-words text) into our sections/lines/syllables/chordAnchors
// shape. Returns { sections } — callers are responsible for wrapping this
// into an import preview before anything is saved.
function parsePastedChordSheet(rawText) {
  let song;
  try {
    song = new ChordSheetJS.UltimateGuitarParser({ preserveWhitespace: false }).parse(rawText);
  } catch (e) {
    song = null;
  }
  if (!song || !song.lines || song.lines.length === 0) {
    // Fall back to generic "chords above/over words" plain text — the most
    // common copy-paste format from lyric sites that aren't Ultimate Guitar.
    song = new ChordSheetJS.ChordsOverWordsParser().parse(rawText);
  }

  const sections = [];
  const counters = {};
  let current = { type: 'verse', label: '', lines: [] };
  let currentHasContent = false;

  function pushCurrent() {
    if (currentHasContent) sections.push(current);
  }

  function startSection(rawName) {
    pushCurrent();
    const type = normalizeSectionType(rawName);
    const displayName = rawName && rawName.trim() ? rawName.trim() : type;
    const countKey = displayName.toLowerCase();
    counters[countKey] = (counters[countKey] || 0) + 1;
    current = { type, label: `${displayName[0].toUpperCase()}${displayName.slice(1)} ${counters[countKey]}`, lines: [] };
    currentHasContent = false;
  }

  song.lines.forEach((line) => {
    const items = line.items || [];
    const first = items[0];
    const originalName = first && first._originalName;

    if (originalName === 'start_of_verse') return startSection('Verse');
    if (originalName === 'start_of_chorus') return startSection('Chorus');
    if (originalName === 'start_of_tab') return startSection('Instrumental');
    if (originalName === 'comment' || originalName === 'section') {
      return startSection((first && (first._value || first.value)) || 'Section');
    }
    if (
      originalName === 'end_of_verse' ||
      originalName === 'end_of_chorus' ||
      originalName === 'end_of_tab'
    ) {
      return; // section body already accumulated; next start_of_* / EOF closes it
    }

    // A regular content line: only ChordLyricsPair-ish items carry .chords/.lyrics.
    const contentItems = items.filter((it) => it.lyrics !== undefined || it.chords !== undefined);
    if (contentItems.length === 0) return;

    const { syllables, chordAnchors } = buildLineFromItems(contentItems);
    // Skip fully-blank lines (no text, no chords) rather than storing empty spacer lines.
    if (syllables.length === 0) return;

    current.lines.push({ syllables, chordAnchors });
    currentHasContent = true;
  });

  pushCurrent();

  return { sections };
}

module.exports = { parsePastedChordSheet, buildLineFromItems, normalizeSectionType };
