// Pure, immutable-style editing operations on an in-memory "editable song"
// object, plus the local key bookkeeping the editor needs.
//
// Why local keys: the server's update route re-parses the whole song
// through zod on every save (server/middleware/validate.js replaces
// req.body with the parsed result), which strips any field not declared in
// the route's schema — including _id. That means every save assigns fresh
// Mongoose _ids to every section/line/chordAnchor subdocument. That's fine
// for the data (nothing else keys off those ids), but it means React keys
// and drag-and-drop references can't rely on server _id being stable across
// saves. So every section/line/chordAnchor gets a client-only `_k` the
// moment a song is loaded into the editor; `_k` never leaves the browser.
import { tokenizeLine } from './tokenizeLine.js';

let keyCounter = 0;
export function makeLocalKey(prefix) {
  keyCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${keyCounter}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Adds a `_k` to every section/line/chordAnchor that doesn't already have
// one. Safe to call on a song that already has some `_k`s (e.g. after a
// local edit) — existing keys are left untouched.
export function hydrateSong(song) {
  const next = deepClone(song);
  next.sections = (next.sections || []).map((section) => {
    const sectionOut = { ...section, _k: section._k || makeLocalKey('sec') };
    sectionOut.lines = (section.lines || []).map((line) => {
      const lineOut = { ...line, _k: line._k || makeLocalKey('line') };
      lineOut.chordAnchors = (line.chordAnchors || []).map((a) => ({ ...a, _k: a._k || makeLocalKey('anchor') }));
      return lineOut;
    });
    return sectionOut;
  });
  return next;
}

// Strips every `_k` (recursively) before the song is sent to the server.
export function dehydrateSong(song) {
  const next = deepClone(song);
  next.sections = (next.sections || []).map((section) => {
    const { _k, ...sectionRest } = section;
    return {
      ...sectionRest,
      lines: (section.lines || []).map((line) => {
        const { _k: lineKey, ...lineRest } = line;
        return {
          ...lineRest,
          chordAnchors: (line.chordAnchors || []).map(({ _k: anchorKey, ...anchorRest }) => anchorRest),
        };
      }),
    };
  });
  return next;
}

function findSection(song, sectionKey) {
  return song.sections.findIndex((s) => s._k === sectionKey);
}
function findLine(section, lineKey) {
  return section.lines.findIndex((l) => l._k === lineKey);
}

export function addSection(song, { type = 'verse', label = '' } = {}) {
  const next = deepClone(song);
  next.sections.push({ _k: makeLocalKey('sec'), type, label, lines: [] });
  return next;
}

export function removeSection(song, sectionKey) {
  const next = deepClone(song);
  const idx = findSection(next, sectionKey);
  if (idx === -1) return song;
  next.sections.splice(idx, 1);
  return next;
}

export function updateSectionMeta(song, sectionKey, patch) {
  const next = deepClone(song);
  const idx = findSection(next, sectionKey);
  if (idx === -1) return song;
  next.sections[idx] = { ...next.sections[idx], ...patch };
  return next;
}

export function moveSection(song, sectionKey, direction) {
  const next = deepClone(song);
  const idx = findSection(next, sectionKey);
  const target = idx + direction;
  if (idx === -1 || target < 0 || target >= next.sections.length) return song;
  const [item] = next.sections.splice(idx, 1);
  next.sections.splice(target, 0, item);
  return next;
}

// Regenerates every `_k` in a cloned subtree so a duplicated section's
// lines/anchors don't collide (as React keys or drag references) with the
// section it was copied from.
function rekeySection(section) {
  return {
    ...section,
    _k: makeLocalKey('sec'),
    lines: (section.lines || []).map((line) => ({
      ...line,
      _k: makeLocalKey('line'),
      chordAnchors: (line.chordAnchors || []).map((a) => ({ ...a, _k: makeLocalKey('anchor') })),
    })),
  };
}

export function duplicateSection(song, sectionKey) {
  const next = deepClone(song);
  const idx = findSection(next, sectionKey);
  if (idx === -1) return song;
  const clone = rekeySection(next.sections[idx]);
  next.sections.splice(idx + 1, 0, clone);
  return next;
}

export function addLine(song, sectionKey, text) {
  const next = deepClone(song);
  const idx = findSection(next, sectionKey);
  if (idx === -1) return song;
  next.sections[idx].lines.push({ _k: makeLocalKey('line'), syllables: tokenizeLine(text), chordAnchors: [] });
  return next;
}

export function removeLine(song, sectionKey, lineKey) {
  const next = deepClone(song);
  const sIdx = findSection(next, sectionKey);
  if (sIdx === -1) return song;
  const lIdx = findLine(next.sections[sIdx], lineKey);
  if (lIdx === -1) return song;
  next.sections[sIdx].lines.splice(lIdx, 1);
  return next;
}

export function moveLine(song, sectionKey, lineKey, direction) {
  const next = deepClone(song);
  const sIdx = findSection(next, sectionKey);
  if (sIdx === -1) return song;
  const lines = next.sections[sIdx].lines;
  const lIdx = findLine(next.sections[sIdx], lineKey);
  const target = lIdx + direction;
  if (lIdx === -1 || target < 0 || target >= lines.length) return song;
  const [item] = lines.splice(lIdx, 1);
  lines.splice(target, 0, item);
  return next;
}

// Replaces a line's lyric text wholesale (re-tokenizes from scratch). Used
// by the "edit lyrics" affordance; callers are expected to confirm with the
// user first if the line already has chord anchors, since this clears them
// (there's no safe way to remap old anchors onto a freshly re-split line).
export function retextLine(song, sectionKey, lineKey, text) {
  const next = deepClone(song);
  const sIdx = findSection(next, sectionKey);
  if (sIdx === -1) return song;
  const lIdx = findLine(next.sections[sIdx], lineKey);
  if (lIdx === -1) return song;
  next.sections[sIdx].lines[lIdx] = {
    _k: next.sections[sIdx].lines[lIdx]._k,
    syllables: tokenizeLine(text),
    chordAnchors: [],
  };
  return next;
}

// Appends a zero-width chordSlot syllable to the end of a line, giving a
// place to anchor a chord with no lyric under it (e.g. an instrumental hit
// after the last word).
export function appendChordSlot(song, sectionKey, lineKey) {
  const next = deepClone(song);
  const sIdx = findSection(next, sectionKey);
  if (sIdx === -1) return song;
  const lIdx = findLine(next.sections[sIdx], lineKey);
  if (lIdx === -1) return song;
  next.sections[sIdx].lines[lIdx].syllables.push({
    text: '',
    wordId: null,
    isWordStart: false,
    isWordEnd: false,
    type: 'chordSlot',
  });
  return next;
}

// Adds a brand-new chord anchor on (sectionKey, lineKey) at syllableIndex/charOffset.
export function addChordAnchor(song, sectionKey, lineKey, { chord, syllableIndex, charOffset }) {
  const next = deepClone(song);
  const sIdx = findSection(next, sectionKey);
  if (sIdx === -1) return song;
  const lIdx = findLine(next.sections[sIdx], lineKey);
  if (lIdx === -1) return song;
  next.sections[sIdx].lines[lIdx].chordAnchors.push({
    _k: makeLocalKey('anchor'),
    chord,
    syllableIndex,
    charOffset,
  });
  return next;
}

export function updateChordAnchor(song, sectionKey, lineKey, anchorKey, patch) {
  const next = deepClone(song);
  const sIdx = findSection(next, sectionKey);
  if (sIdx === -1) return song;
  const lIdx = findLine(next.sections[sIdx], lineKey);
  if (lIdx === -1) return song;
  const anchors = next.sections[sIdx].lines[lIdx].chordAnchors;
  const aIdx = anchors.findIndex((a) => a._k === anchorKey);
  if (aIdx === -1) return song;
  anchors[aIdx] = { ...anchors[aIdx], ...patch };
  return next;
}

export function removeChordAnchor(song, sectionKey, lineKey, anchorKey) {
  const next = deepClone(song);
  const sIdx = findSection(next, sectionKey);
  if (sIdx === -1) return song;
  const lIdx = findLine(next.sections[sIdx], lineKey);
  if (lIdx === -1) return song;
  const anchors = next.sections[sIdx].lines[lIdx].chordAnchors;
  const aIdx = anchors.findIndex((a) => a._k === anchorKey);
  if (aIdx === -1) return song;
  anchors.splice(aIdx, 1);
  return next;
}

// Moves an existing chord anchor to a (possibly different) line — this is
// what drag-and-drop repositioning calls. The chord text travels with it;
// only where it's anchored changes.
export function moveChordAnchor(song, from, to) {
  const next = deepClone(song);
  const sFromIdx = findSection(next, from.sectionKey);
  if (sFromIdx === -1) return song;
  const lFromIdx = findLine(next.sections[sFromIdx], from.lineKey);
  if (lFromIdx === -1) return song;
  const fromAnchors = next.sections[sFromIdx].lines[lFromIdx].chordAnchors;
  const aIdx = fromAnchors.findIndex((a) => a._k === from.anchorKey);
  if (aIdx === -1) return song;
  const [anchor] = fromAnchors.splice(aIdx, 1);

  const sToIdx = findSection(next, to.sectionKey);
  if (sToIdx === -1) return song;
  const lToIdx = findLine(next.sections[sToIdx], to.lineKey);
  if (lToIdx === -1) return song;
  next.sections[sToIdx].lines[lToIdx].chordAnchors.push({
    ...anchor,
    syllableIndex: to.syllableIndex,
    charOffset: to.charOffset,
  });
  return next;
}
