const mongoose = require('mongoose');
const { Schema } = mongoose;

const SONG_TYPES = [
  'opening',
  'praise',
  'worship',
  'response',
  'offering',
  'communion',
  'closing',
];

const LineupSchema = new Schema(
  {
    songs: [
      {
        song: { type: Schema.Types.ObjectId, ref: 'Song' },
        keyUsed: { type: String },
        songType: { type: String, enum: SONG_TYPES },
      },
    ],
    lineupDate: { type: Date },
    org: { type: Schema.Types.ObjectId, ref: 'Org' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

LineupSchema.index({ org: 1, lineupDate: -1 });

module.exports = mongoose.model('Lineup', LineupSchema);
module.exports.SONG_TYPES = SONG_TYPES;
