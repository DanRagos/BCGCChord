// One-time migration: converts existing Song documents from the pre-MERN
// "one chord per word slot" schema (segments[].chords[].{lyricSection,chords})
// into the new syllable/chordAnchor schema (server/models/Song.js). Lineups
// are NOT touched — they already reference songs by _id, which this script
// preserves, so every existing Lineup keeps working with no changes of its
// own once its songs are migrated.
//
// Usage (from the repo root):
//   npm run migrate:selftest        no database needed — runs the transform logic against
//                                    fixtures and validates the result against the real
//                                    Mongoose schema. Worth running this first.
//   npm run migrate                 dry run — reports what WOULD change, writes nothing
//   npm run migrate -- --inspect    prints the top-level keys of each document so you can
//                                    sanity-check this script's field-name assumptions
//                                    against your actual data before trusting the rest
//   npm run migrate -- --apply      writes a JSON backup of every document about to be
//                                    changed, then actually migrates them in place
//   npm run migrate -- --apply --limit 5   migrate only the first 5 matching documents —
//                                    good for a spot-check before running the full set
//
// IMPORTANT — read this before running --apply:
// This script was written from the Phase 1 audit's documented old schema
// (verified at the time by directly reading the original source, before any
// of it was removed in Phase 3's cleanup). I have not been able to connect
// to your actual MongoDB or inspect a real document while writing this —
// this sandbox's network egress blocks MongoDB's wire protocol (the same
// restriction noted in every phase so far), so the exact field names for
// things like originalKey/tempo/geniusId on YOUR documents are a tolerant
// best guess with fallbacks, not something I've confirmed. Run
// `npm run migrate -- --inspect` first and read its output before trusting
// anything past `segments` (which the transform logic — the part this
// affects most — was verified with a scripted test using the documented
// shape; see scripts/lib/transformSong.js).
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const env = require('../server/config/env');
const { transformOldSongToNew, looksLikeOldShape, looksLikeNewShape } = require('./lib/transformSong');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const INSPECT = args.includes('--inspect');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;

async function main() {
  console.log(`Connecting to ${env.mongoUri.replace(/\/\/[^@]+@/, '//<redacted>@')} ...`);
  await mongoose.connect(env.mongoUri);
  console.log('Connected.');

  const collection = mongoose.connection.db.collection('songs');
  const docs = await collection.find({}).toArray();
  console.log(`Found ${docs.length} document(s) in 'songs'.`);

  if (INSPECT) {
    const toShow = LIMIT ? docs.slice(0, LIMIT) : docs;
    toShow.forEach((doc, i) => {
      const shape = looksLikeOldShape(doc)
        ? 'OLD shape (has segments[])'
        : looksLikeNewShape(doc)
        ? 'NEW shape (has sections[]) — already migrated, would be skipped'
        : 'UNRECOGNIZED shape — neither segments[] nor sections[] found';
      console.log(`\n--- Document ${i + 1}/${toShow.length} (_id: ${doc._id}) ---`);
      console.log('Top-level keys:', Object.keys(doc).join(', '));
      console.log('Shape:', shape);
    });
    await mongoose.disconnect();
    return;
  }

  let migratedCount = 0;
  let skippedAlready = 0;
  const skippedUnrecognized = [];
  const allWarnings = [];
  const backup = [];

  const toProcess = LIMIT ? docs.slice(0, LIMIT) : docs;

  for (const doc of toProcess) {
    if (looksLikeNewShape(doc)) {
      skippedAlready += 1;
      continue;
    }
    if (!looksLikeOldShape(doc)) {
      skippedUnrecognized.push(doc._id.toString());
      continue;
    }

    const { migrated, warnings } = transformOldSongToNew(doc);
    warnings.forEach((w) => allWarnings.push(`[${doc._id}] ${w}`));

    console.log(
      `${APPLY ? 'Migrating' : '[dry-run] Would migrate'}: "${migrated.title}" (${doc._id}) — ` +
        `${migrated.sections.length} section(s), ` +
        `${migrated.sections.reduce((n, s) => n + s.lines.length, 0)} line(s)`
    );

    if (APPLY) {
      backup.push(doc);
      await collection.replaceOne({ _id: doc._id }, { _id: doc._id, ...migrated });
    }
    migratedCount += 1;
  }

  if (APPLY && backup.length > 0) {
    const backupDir = path.join(__dirname, 'migration-backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `songs-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`\nBacked up ${backup.length} original document(s) to:\n  ${backupPath}\nbefore writing anything.`);
  }

  console.log(`\n${APPLY ? 'Migrated' : '[DRY RUN] Would migrate'}: ${migratedCount}`);
  console.log(`Already new-shape (skipped): ${skippedAlready}`);
  console.log(`Unrecognized shape (skipped — needs manual review): ${skippedUnrecognized.length}`);
  if (skippedUnrecognized.length) console.log('  _ids:', skippedUnrecognized.join(', '));
  if (allWarnings.length) {
    console.log(`\n${allWarnings.length} warning(s) — none of these block the migration, but review them:`);
    allWarnings.forEach((w) => console.log('  -', w));
  }
  if (!APPLY) {
    console.log('\nThis was a DRY RUN. Nothing was written.');
    console.log('Run `npm run migrate -- --inspect` if any of the above looks off, or `npm run migrate -- --apply` to actually write these changes (a backup is taken first).');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\nMigration failed:', err);
  process.exitCode = 1;
});
