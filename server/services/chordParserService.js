const ChordSheetJS = require('chordsheetjs');
const { splitWordIntoSyllables } = require('../utils/syllabifier');
const { nextWordId } = require('../utils/lineTokenizer');
const { looksLikeChordToken, looksLikeChordLine } = require('../utils/chordRegex');

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
  // "Chorus 3", "Verse 1", "Outro x2", "Bridge (2x)" are all still a
  // chorus / verse / outro / bridge — drop the trailing number or repeat
  // marker before looking the name up.
  const key = (name || '')
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/[\s:]*(?:\d+|x\d+)$/, '')
    .trim();
  return SECTION_NAME_MAP[key] || 'custom';
}

// --- Plain "chords over words" text (the usual copy-paste from lyric/chord
// sites). We pair chord lines with lyric lines ourselves instead of leaving
// it to ChordSheetJS, because ChordSheetJS decides "is this a chord line?" by
// asking whether every word can be parsed as a chord, and that goes wrong
// both ways:
//   - It parses ordinary words that start with A-G ("Again", "and", "day")
//     as chords, so a lyric line like "Again and again and again" is treated
//     as a chord line and gets laid over the NEXT line.
//   - It can't parse "N.C." at all, so a real chord line like
//     "N.C.  D/F#  G" is treated as lyrics, and the lyric line under it is
//     then mistaken for chords by the previous point.
//   - A chord line followed directly by ANOTHER chord line pairs them, and the
//     second chord line comes out as "lyrics" ("D#m B E" printed as text).
// utils/chordRegex.js classifies lines with a strict chord vocabulary
// instead. ---
const SECTION_TAG_RE = /^\s*\[([^\]]{1,60})\]\s*$/;

// Text that carries explicit chord markup (Ultimate Guitar [ch]..[/ch] /
// [tab], ChordPro {directives}, or inline "[C]Amazing [G]grace" chords) still
// goes through ChordSheetJS, which understands those formats natively.
function hasInlineChordMarkup(text) {
  if (/\[\/?(?:ch|tab)\]/i.test(text)) return true;
  if (/^\s*\{\s*[a-z_]+/im.test(text)) return true;
  const bracketRe = /\[([^\]\n]+)\]/g;
  let m = bracketRe.exec(text);
  while (m !== null) {
    if (looksLikeChordToken(m[1])) return true;
    m = bracketRe.exec(text);
  }
  return false;
}

function leadingSpaces(s) {
  return s.length - s.trimStart().length;
}

function chordMarks(line) {
  const marks = [];
  const re = /\S+/g;
  let m = re.exec(line);
  while (m !== null) {
    marks.push({ col: m.index, chord: m[0] });
    m = re.exec(line);
  }
  return marks;
}

// Lays each chord on `chordLine` over the lyric text at the same column,
// returning ChordSheetJS-style { chords, lyrics } items.
function pairChordLineWithLyrics(chordLine, lyricLine) {
  const marks = chordMarks(chordLine);
  const shift = leadingSpaces(lyricLine);
  const lyric = lyricLine.slice(shift).trimEnd();
  if (marks.length === 0) return [{ chords: '', lyrics: lyric }];
  const cols = marks.map((mk) => Math.min(Math.max(mk.col - shift, 0), lyric.length));
  const items = [];
  if (cols[0] > 0) items.push({ chords: '', lyrics: lyric.slice(0, cols[0]) });
  marks.forEach((mk, i) => {
    const end = i + 1 < cols.length ? cols[i + 1] : lyric.length;
    items.push({ chords: mk.chord, lyrics: lyric.slice(cols[i], end) });
  });
  return items;
}

function sectionTagName(line) {
  const m = SECTION_TAG_RE.exec(line);
  if (!m) return null;
  const name = m[1].trim();
  // "[G]" on its own line is a chord, not a section called "G".
  return name && !looksLikeChordToken(name) ? name : null;
}

// Returns { lines } in the same shape parsePastedChordSheet reads off a
// ChordSheetJS song (section tags become `comment` items).
function parseChordsOverWordsText(rawText) {
  const lines = rawText.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
    } else {
      const tag = sectionTagName(line);
      if (tag) {
        out.push({ items: [{ _originalName: 'comment', _value: tag }] });
        i += 1;
      } else if (looksLikeChordLine(line)) {
        const next = lines[i + 1];
        const pairable =
          next !== undefined && next.trim() && !sectionTagName(next) && !looksLikeChordLine(next);
        if (pairable) {
          out.push({ items: pairChordLineWithLyrics(line, next) });
          i += 2;
        } else {
          out.push({ items: chordMarks(line).map((mk) => ({ chords: mk.chord, lyrics: '' })) });
          i += 1;
        }
      } else {
        out.push({ items: [{ chords: '', lyrics: line.trim() }] });
        i += 1;
      }
    }
  }
  return { lines: out };
}

// Parses a pasted chord sheet (Ultimate-Guitar-tagged or plain
// chords-over-words text) into our sections/lines/syllables/chordAnchors
// shape. Returns { sections } — callers are responsible for wrapping this
// into an import preview before anything is saved.
function parsePastedChordSheet(rawText) {
  let song;
  if (!hasInlineChordMarkup(rawText)) {
    // Plain chords-over-words text: classify and pair the lines ourselves
    // (see the note above parseChordsOverWordsText for why).
    song = parseChordsOverWordsText(rawText);
  } else {
    // [ch]..[/ch] / [tab] is Ultimate Guitar's own markup; inline "[C]Amazing"
    // chords and {directives} are ChordPro. (The UG parser reads ChordPro
    // inline chords as a comment and returns nothing, so pick by markup.)
    const usesUgTags = /\[\/?(?:ch|tab)\]/i.test(rawText);
    const Primary = usesUgTags ? ChordSheetJS.UltimateGuitarParser : ChordSheetJS.ChordProParser;
    try {
      song = new Primary({ preserveWhitespace: false }).parse(rawText);
    } catch (e) {
      song = null;
    }
    if (!song || !song.lines || song.lines.length === 0) {
      song = new ChordSheetJS.ChordsOverWordsParser().parse(rawText);
    }
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
    const pretty = `${displayName[0].toUpperCase()}${displayName.slice(1)}`;
    // A tag that already carries its own number ("Chorus 3") keeps it;
    // appending our running count too gave labels like "Chorus 3 1".
    const label = /\d\s*$/.test(displayName) ? pretty : `${pretty} ${counters[countKey]}`;
    current = { type, label, lines: [] };
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

module.exports = {
  parsePastedChordSheet,
  buildLineFromItems,
  normalizeSectionType,
  parseChordsOverWordsText,
};
