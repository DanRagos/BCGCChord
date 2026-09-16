// Self-test for the migration's transform logic (scripts/lib/transformSong.js).
// Run this with `npm run migrate:selftest` — it touches no database at all,
// just exercises the pure transform function against fixtures built from the
// documented old schema, plus validates the result against the real
// Mongoose Song schema. Worth running yourself before trusting `migrate.js
// --apply` against your real data, since this was written without the
// ability to inspect a live document from this environment (see the header
// comment in migrate.js).
const { transformOldSongToNew, looksLikeOldShape, looksLikeNewShape } = require('./lib/transformSong');

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok - ' + msg);
}

// A fixture built directly from the documented old shape:
// Song.segments = [{ section, chords: [{ lyricSection: [String], chords: [String], line }] }]
const oldDoc = {
  _id: 'fake-id-123',
  title: 'Amazing Grace',
  artist: 'Traditional',
  key: 'A', // a lower-priority fallback field name — `baseKey` below should win
  baseKey: 'G', // the CONFIRMED real old-schema field name (via migrate:inspect against live data)
  songId: 12345, // confirmed real field name for what migrates to source.geniusId
  urlMedia: 'https://youtu.be/example', // confirmed real field name -> source.mediaUrl
  songArt: 'https://example.com/art.jpg', // confirmed real field name -> source.imageUrl
  yearReleased: 1779, // confirmed real field, no schema home -> folded into metadata.notes
  createdAt: new Date('2020-01-01'),
  // NOTE: chords[] is one entry longer than lyricSection[] throughout, BY
  // DESIGN — confirmed directly against real data and by the person who
  // wrote the old app. chords[i] is the chord before chunk i starts; the
  // final extra entry is a trailing chord after the whole line. Here every
  // line's trailing slot is left empty ('') except the dedicated Bridge
  // fixture below, which exercises a real trailing chord plus a real
  // multi-word chunk.
  segments: [
    {
      section: 'Verse 1',
      chords: [
        {
          lyricSection: ['Amazing', 'grace,', 'how', 'sweet', 'the', 'sound'],
          chords: ['G', '', '', 'C', '', 'G', ''],
          line: 1,
        },
        {
          lyricSection: ['That', 'saved', 'a', 'wretch', 'like', 'me'],
          chords: ['G', '', '', 'D', '', 'G', ''],
          line: 2,
        },
      ],
    },
    {
      section: 'Chorus',
      chords: [
        {
          lyricSection: ['beautiful'],
          chords: ['C', ''],
          line: 1,
        },
      ],
    },
    {
      // The exact shape confirmed against real data: a multi-word chunk
      // ("We live for ") followed by a one-word chunk ("You "), with a
      // chord before "You" and a genuine trailing chord after it.
      section: 'Bridge',
      chords: [
        {
          lyricSection: ['We live for ', 'You '],
          chords: [null, 'D', 'G'],
          line: 1,
        },
      ],
    },
  ],
};

assert(looksLikeOldShape(oldDoc) === true, 'looksLikeOldShape recognizes a document with segments[]');
assert(looksLikeNewShape(oldDoc) === false, 'the same old-shape doc does not look like new-shape');
assert(looksLikeNewShape({ sections: [] }) === true, 'a document with sections[] looks new-shape');

const { migrated, warnings } = transformOldSongToNew(oldDoc);

assert(migrated.title === 'Amazing Grace', 'title carried over');
assert(migrated.artist === 'Traditional', 'artist carried over');
assert(migrated.originalKey === 'G', 'originalKey recovered from the real `baseKey` field, taking priority over the `key` fallback');
assert(migrated.source.type === 'migrated', 'source.type is set to migrated');
assert(migrated.source.geniusId === 12345, 'source.geniusId recovered from the real `songId` field and coerced to a number');
assert(migrated.source.mediaUrl === 'https://youtu.be/example', 'source.mediaUrl recovered from the real `urlMedia` field');
assert(migrated.source.imageUrl === 'https://example.com/art.jpg', 'source.imageUrl recovered from the real `songArt` field');
assert(migrated.metadata.notes.includes('Released: 1779.'), 'yearReleased (no schema home) folded into metadata.notes');
assert(migrated.sections.length === 3, 'three segments became three sections');
assert(migrated.sections[0].label === 'Verse 1', 'section label preserved verbatim');
assert(migrated.sections[0].type === 'verse', 'section type normalized from the label');
assert(migrated.sections[1].type === 'chorus', 'Chorus normalized to type "chorus"');

const line1 = migrated.sections[0].lines[0];
// "Amazing grace, how sweet the sound" with chords ['G','','','C','','G','']
// Words: Amazing(G) grace,() how() sweet(C) the() sound(G), no trailing chord
const wordSyllables = line1.syllables.filter((s) => s.type === 'lyric');
const spaceSyllables = line1.syllables.filter((s) => s.type === 'space');
assert(spaceSyllables.length === 5, 'five spaces between six words');
assert(line1.chordAnchors.length === 3, 'exactly 3 non-empty chords carried over out of 6 word slots');
assert(line1.chordAnchors[0].chord === 'G', 'first chord (G) preserved');
assert(line1.chordAnchors[0].charOffset === 0, 'chord anchors at charOffset 0 — the only position the old model ever recorded');

// Confirm the first chord anchors to the FIRST syllable of "Amazing", not just index 0 blindly —
// find which word each anchored syllableIndex belongs to.
const amazingWordId = line1.syllables[0].wordId;
const anchoredSyllable = line1.syllables[line1.chordAnchors[0].syllableIndex];
assert(anchoredSyllable.wordId === amazingWordId, 'the G anchors to a syllable that is part of the word "Amazing"');
assert(anchoredSyllable.isWordStart === true, 'and specifically its first syllable');

// "sweet" is the 4th word (index 3, 0-based) and got chord 'C' — confirm it anchors to "sweet", not "how".
const sweetChordAnchor = line1.chordAnchors[1];
const sweetSyllable = line1.syllables[sweetChordAnchor.syllableIndex];
// Reconstruct which word each syllable belongs to by wordId grouping, and confirm the chord's word text
// (rather than just its first character, since a word can split into more than one syllable).
const wordTexts = {};
line1.syllables.forEach((s) => {
  if (s.type !== 'lyric') return;
  wordTexts[s.wordId] = (wordTexts[s.wordId] || '') + s.text;
});
assert(wordTexts[sweetSyllable.wordId] === 'sweet', '"C" anchors to the word "sweet", matching its position in chords[]');

// "beautiful" -> multiple syllables, single chord "C" should anchor to its FIRST syllable only.
const chorusLine = migrated.sections[1].lines[0];
assert(chorusLine.chordAnchors.length === 1, 'beautiful line has exactly one chord anchor');
const beautifulSyllables = chorusLine.syllables.filter((s) => s.type === 'lyric');
assert(beautifulSyllables.length === 3, '"beautiful" split into 3 syllables during migration too (beau-ti-ful)');
assert(chorusLine.chordAnchors[0].syllableIndex === 0, 'the chord anchors to the first of the 3 syllables, not a later one');

// The Bridge fixture: a real multi-word chunk ("We live for ") followed by
// a one-word chunk ("You "), chords [null, 'D', 'G'] — confirms chunks are
// split into their individual words (not treated as one unsyllabifiable
// blob), that a chunk's chord anchors only to ITS first word, and that the
// genuine trailing chord anchors after the very last word rather than being
// dropped as a "mismatch".
const bridgeLine = migrated.sections[2].lines[0];
const bridgeWordTexts = {};
bridgeLine.syllables.forEach((s) => {
  if (s.type !== 'lyric') return;
  bridgeWordTexts[s.wordId] = (bridgeWordTexts[s.wordId] || '') + s.text;
});
const bridgeWordOrder = [...new Set(bridgeLine.syllables.filter((s) => s.type === 'lyric').map((s) => s.wordId))].map(
  (id) => bridgeWordTexts[id]
);
assert(
  bridgeWordOrder.join(' ') === 'We live for You',
  'a multi-word lyricSection chunk ("We live for ") is split into its individual words, not treated as one unsyllabifiable blob'
);
assert(
  bridgeLine.chordAnchors.length === 2,
  'both the pre-chunk "D" (before "You") and the trailing "G" (after "You") survive — neither is dropped'
);
const dAnchor = bridgeLine.chordAnchors.find((a) => a.chord === 'D');
const dSyllable = bridgeLine.syllables[dAnchor.syllableIndex];
assert(
  bridgeWordTexts[dSyllable.wordId] === 'You' && dAnchor.charOffset === 0,
  '"D" anchors at charOffset 0 of "You" — the chord immediately before its own chunk starts, not before "We"'
);
const gAnchor = bridgeLine.chordAnchors.find((a) => a.chord === 'G');
const gSyllable = bridgeLine.syllables[gAnchor.syllableIndex];
assert(
  bridgeWordTexts[gSyllable.wordId] === 'You' && gAnchor.charOffset === gSyllable.text.length,
  '"G" (the by-design trailing chord) anchors right after the last word of the line'
);

// A document with a GENUINELY mismatched chords/lyricSection length — one
// more than even the documented before/after-chunk layout accounts for —
// should still warn and drop only the truly unexplained extra, not crash
// and not drop the legitimate trailing chord along with it.
const mismatchedDoc = {
  title: 'Broken Song',
  segments: [
    { section: 'Verse', chords: [{ lyricSection: ['one', 'two'], chords: ['C', 'D', 'G', 'X'] }] },
  ],
};
const { migrated: migrated2, warnings: warnings2 } = transformOldSongToNew(mismatchedDoc);
assert(
  migrated2.sections[0].lines[0].chordAnchors.length === 3,
  '"C" (before "one"), "D" (before "two"), and "G" (trailing, after "two") are all kept — only the genuinely unexplained 4th chord is dropped'
);
assert(
  warnings2.some((w) => w.includes('unexpected extra')),
  'a warning is raised about the genuinely unexpected extra chord, not the by-design trailing one'
);

// A document with no title at all should still migrate but warn.
const noTitleDoc = { segments: [] };
const { migrated: migrated3, warnings: warnings3 } = transformOldSongToNew(noTitleDoc);
assert(migrated3.title === 'Untitled (migrated)', 'a missing title falls back to a clearly-flagged placeholder instead of crashing');
assert(warnings3.some((w) => w.includes('title')), 'missing title is warned about so it can be found and fixed manually');

// A document with a non-numeric songId should warn and drop it, not miscast
// a bad value into the schema's Number field or crash.
const badSongIdDoc = { title: 'Weird Doc', songId: 'not-a-number', segments: [] };
const { migrated: migrated4, warnings: warnings4 } = transformOldSongToNew(badSongIdDoc);
assert(migrated4.source.geniusId === undefined, 'a non-numeric songId is not carried over as geniusId');
assert(warnings4.some((w) => w.includes('songId/geniusId')), 'a non-numeric songId is warned about, not silently dropped or miscast');

console.log(`\n${warnings.length} warning(s) on the main fixture (expected 0):`, warnings);
assert(warnings.length === 0, 'the well-formed main fixture produces zero warnings');

console.log('\nALL MIGRATION TRANSFORM TESTS PASSED');

// Extra safety net: validate the migrated shape against the REAL Mongoose
// Song schema (server/models/Song.js), without saving anything — this is
// exactly the kind of check that would catch an enum mismatch or a type
// error before it ever reaches a live database.
const mongoose = require('mongoose');
const Song = require('../server/models/Song');

const candidate = new Song(migrated);
const validationError = candidate.validateSync();
assert(!validationError, 'the migrated document validates cleanly against the real Mongoose Song schema' + (validationError ? ': ' + validationError.message : ''));

const candidate2 = new Song(migrated2);
assert(!candidate2.validateSync(), 'the mismatched-chords fixture also validates cleanly once migrated');

console.log('\nALL SCHEMA VALIDATION CHECKS PASSED');
process.exit(0);
