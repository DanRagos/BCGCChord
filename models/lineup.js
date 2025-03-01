const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Song = require('./song');

const LineupSchema = new Schema({
    songs: [{
        song: { type: Schema.Types.ObjectId, ref: 'Song' },
        keyUsed: { type: String },
        songType: {
            type: String,
            enum: ['opening', 'praise', 'worship', 'response', 'offering', 'closing']
        },
    }],
    lineupDate: { type: Date },
}, {
    timestamps: true // Add this line to enable timestamps
});

module.exports = mongoose.model("Lineup", LineupSchema);

