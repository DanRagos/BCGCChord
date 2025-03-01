const cMajor = ["C", "D", "em", "F", "G", "am", "bdim"]; // array of chords in a scale

const scales = {
    c: {
        major: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
        minor: ["Cm", "Ddim", "Eb", "Fm", "Gm", "Ab", "Bb" ]
    },

    'c#': {
        major: ['C#', 'D#m', 'Fm', 'F#', 'G#', 'A#m', 'Cdim'],
        minor: ['C#m', 'D#dim', 'E', 'F#m', 'G#m', 'A', 'B']
    },

    d: {
        major: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
        minor: ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C']
    },
    
    'd#': {
        major: ['D#', 'F', 'Gm', 'G#', 'A#', 'Cm', 'Ddim'],
        minor: ['D#m', 'Fdim', 'F#', 'G#m', 'A#m', 'B', 'C#']
    },

    e: {
        major: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
        minor: ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D']
    },

    f: {
        major: ['F', 'Gm', 'Am', 'A#', 'C', 'Dm', 'Edim'],
        minor: ['Fm', 'Gdim', 'G#', 'A#m', 'Cm', 'C#', 'D#']
    },

    'f#': {
        major: ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'Fdim'],
        minor: ['F#m', 'G#dim', 'A', 'Bm', 'C#m', 'D', 'E']
    },

    g: {
        major: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
        minor: ['Gm', 'Adim', 'A#', 'Cm', 'Dm', 'D#', 'F']
    },

    'g#': {
        major: ['G#', 'A#m', 'Cm', 'C#', 'D#', 'Fm', 'Gdim'],
        minor: ['G#m', 'A#dim', 'B', 'C#m', 'D#m', 'E', 'F#']
    },

    a: {
        major: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
        minor: ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']
    },

    'a#': {
        major: ['A#', 'Cm', 'Dm', 'D#', 'F', 'Gm', 'Adim'],
        minor: ['A#m', 'Cdim', 'C#', 'D#m', 'Fm', 'F#', 'G#']
    },

    b: {
        major: ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
        minor: ['Bm', 'C#dim', 'D', 'Em', 'F#m', 'G', 'A']
    }
}

