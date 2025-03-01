function transposeChords(songChords, sourceKey, targetKey) {
    const keyDistances = {
        'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5,
        'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11
    };

    const sourceDistance = keyDistances[sourceKey];
    const targetDistance = keyDistances[targetKey];
    const distance = (targetDistance - sourceDistance + 12) % 12;

    const transposedChords = [];
    for (let chord of songChords) {
        const index = (keyDistances[chord] + distance) % 12;
        const newChord = Object.keys(keyDistances).find(key => keyDistances[key] === index);
        transposedChords.push(newChord);
    }

    return transposedChords;
}


