const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the segment schema
const ChordSegmentSchema = new Schema({
    lyricSection: [String], // Array of lyric sections
    chords: [String], // Array of chords
    line: Number
});

// Define the main schema for the song
const SongSchema = new Schema({
    songId: { type: Number, required: true }, // Song ID
    title: { type: String, required: true }, // Song title
    artist: { type: String }, // Song author
    segments: [{
        section: { type: String }, // Section name (e.g., 'Verse 1', 'Chorus')
        chords: [ChordSegmentSchema] // Array of chord segment schemas
    }],
    yearReleased: { type: String }, // Year the song was released
    baseKey : {type: String, required: true},
    urlMedia : {type: String, required: true},
    songArt: {type : String, required: true}

});

module.exports = mongoose.model('Song', SongSchema);
