var originalKey = $('#selectBaseChord').attr('data-key').toLocaleLowerCase() || "";


function selectChordKey () {
   
    let index = 0;
    let html ='';
    let selectChordKey = $('#selectBaseChord');
    
    for (scale in scales){
        html +=`<option value=${scale} ${originalKey == scale ? "selected" : ''}> ${scale.toUpperCase()} </option>`
    }
    selectChordKey.html(html)
}


function calculateInterval (baseKey, transposeKey) {
    console.log(`base key ${baseKey}, tranpose key ${transposeKey}`)
    const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseIndexKey = chromaticScale.indexOf(baseKey);
    const tranposedKey = chromaticScale.indexOf(transposeKey);
    console.log(`base key ${baseIndexKey}, tranpose key ${tranposedKey}`)
    let interval = tranposedKey - baseIndexKey;

    console.log(interval)

    if (interval < 0 ) {
        interval += chromaticScale.length;
    }

    return interval;

}

