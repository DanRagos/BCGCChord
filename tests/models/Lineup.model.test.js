const mongoose = require('mongoose');
const Lineup = require('../../server/models/Lineup');

describe('Lineup schema validation', () => {
  test('an empty lineup validates cleanly (all fields optional)', () => {
    const lineup = new Lineup({});
    expect(lineup.validateSync()).toBeUndefined();
    expect(lineup.songs).toEqual([]);
  });

  test('accepts every documented songType', () => {
    const { SONG_TYPES } = Lineup;
    const lineup = new Lineup({
      songs: SONG_TYPES.map((songType) => ({ song: new mongoose.Types.ObjectId(), songType })),
    });
    expect(lineup.validateSync()).toBeUndefined();
  });

  test('rejects an unrecognized songType', () => {
    const lineup = new Lineup({
      songs: [{ song: new mongoose.Types.ObjectId(), songType: 'not-a-real-type' }],
    });
    const err = lineup.validateSync();
    expect(err).toBeTruthy();
  });

  test('a song entry without an explicit songType is still valid (optional field)', () => {
    const lineup = new Lineup({ songs: [{ song: new mongoose.Types.ObjectId(), keyUsed: 'D' }] });
    expect(lineup.validateSync()).toBeUndefined();
  });
});
