

$(document).ready(function() {
    let chordCollection = {};
  
    let currentLine;


    selectChordKey();
    var selectedKey = $('#selectBaseChord').val();

   function selectChordKey () {
    let index = 0;
    let html ='';
    let selectChordKey = $('#selectBaseChord');
    for (scale in scales){
        html +=`<option value=${scale} ${index == 0 ? "selected" : ''}> ${scale.toUpperCase()} </option>`
    }
    selectChordKey.html(html)
}

    function renderHtml(arr, section){
      
        let html = '';
        arr[0].chords.forEach((chord, index)=>{
            html += `
            <div class="lyric-segment mx-1">
            <div class="chords"><span class="fw-bold">${(chord)? chord : "&nbsp;"}</span>
            </div>                     
            <div class="lyrics">
              <span class="word" data-line="${arr[0].line}" data-section="${section}">  ${(arr[0].lyricSection[index]) ? arr[0].lyricSection[index] : "&nbsp;"} </span>
          </div>  
          </div>`;
            });
        return html;
    }


    $(document).on('change', '#selectBaseChord', function (){
        selectedKey = $(this).val();
    });    


    $(document).on('change', '#baseChord', async function (){
        let chordSHtml = '';
        let baseChord = $(this).val() || selectedKey;
        let chordS = $('.chordScale');
        chordSHtml += `<option value=null selected></option><optgroup label="Major">`;
        scales[baseChord].major.forEach((chord)=>{
            chordSHtml += `<option value=${chord}>${chord}</option>`
        });
        chordSHtml+=`</optgroup>`;
        chordSHtml += `<optgroup label="Minor">`;
        scales[baseChord].minor.forEach((chord)=>{
            chordSHtml += `<option value=${chord}>${chord}</option>`
        });
        chordSHtml+=`</optgroup>`;
        chordS.html(chordSHtml);

    });

    
    $(document).on('click', '.lyric-container', async function() {
        let htmlbaseC = '';
        let htmlText = '';
        let htmlDiv = '';
        let text = '';
        let chords = [];
        $(this).find('.lyric-segment').each(function (el) {
            const chord = $(this).find('.chords').text();
            if (chord != null){
                    console.log(el);
                    chords[el]=chord.trim();
                    console.log(chords);
            }
            text+= $(this).find('.lyrics').text().trim();
            text+= ' ';
    });
       
        const line = $(this).find(".word");
        let dataLine = line.attr('data-line');
      
        let dataSection = line.attr('data-section');    
        $('.chordModalTitle').text(`Add chord for: ${text}`);  
        const sectionDiv = $('#chordModalForm .chordModalLyrics'); // Removed the + character
        htmlText += '<div class="row justify-content-center">'
        let trimText = text.trim();
        ` ${trimText} `.split(' ').forEach((word, index) => {
            htmlDiv += `<div class="col-auto">  <div class="lyricContainer d-flex flex-column align-items-center ">
            <div class="chords">
            <select val =  " ${chords[0] ? chords[0] : null} " class="chordScale"data-section = "${dataSection}" data-word="${word}" data-line = ${dataLine} data-index= ${index}>
            </select>
            </div>
            <div class="word" >${word}</div> </div> </div>`
        });
 
        htmlText += `${htmlDiv}</div">`
        sectionDiv.html(htmlText);
        $('#chordModalSaveBtn').val(dataLine);
        $('#chordModalSaveBtn').attr("data-section", dataSection );
        currentLine = ` ${text.trim()} `;
        let baseCHtml = $('#baseChord');
        let keys = Object.keys(scales);
        keys.forEach((key)=>{
            htmlbaseC+=`<option value=${key} ${key == selectedKey ? "selected": ""}> ${key.toUpperCase()} </option>`;
        })

        $('#baseChord').trigger('change');

        baseCHtml.html(htmlbaseC);
        $("#chordModal").modal('show');
    });
    

    $(document).on('click', '#chordModalSaveBtn', function () {
        const line = parseInt($(this).val());
        const section = $(this).attr("data-section");
        let lyrics = [];
        let chords = [];
        let lyricSection = "";
    
        $('.col-auto').each(function(index) {
            const currentChord = $(this).find('.chordScale').val();
            const lyric = $(this).find('.word').text();
    
            if (index === 0) {
                // Handling the first element
                chords.push(currentChord !== 'null' ? currentChord : null);
            } else {
                // Handling subsequent elements
                if (currentChord !== 'null') {
                    chords.push(currentChord);
                    lyrics.push(lyricSection);
                    lyricSection = "";
                }
                lyricSection += lyric + ' ';
            }
        });
    
        if (lyricSection.trim() !== '') {
            // Push the last lyric section
            lyrics.push(lyricSection.trim());
        }
        const chordObj = {
            lyricSection: lyrics,
            chords: chords,
            line: line
        };
    
        if (!chordCollection.hasOwnProperty(section)) {
            // If it doesn't exist, create it as an empty array
            chordCollection[section] = [];
        }

        const sectionObj = chordCollection[section];
        const indexOfObj= sectionObj.findIndex(obj => obj.line === line);
        console.log(sectionObj);
        console.log(indexOfObj);
        if (indexOfObj != -1) {
            sectionObj[indexOfObj] = chordObj;
           
        }
        else {
            chordCollection[section].push(Object.assign({}, chordObj));
        }

        
        // Push a copy of chordObj to chordCollection
        // chordCollection[section].push(Object.assign({}, chordObj));
        console.log(chordCollection);
        // Render HTML based on chordCollection
        const lyricContainer = $('div.lyricSection').filter(function (){
            return $(this).attr("data-section") === section;
        }).eq(0);
       
        const html = renderHtml(chordCollection[section].filter((el) => el.line === line), section);
        lyricContainer.find('.lyric-container').eq(line).html(html);

        $('#chordModal').modal('hide');
    });
    

    $(document).on('click', '#saveChordsBtn', function(){
        let songId = $('.lyricsSection').attr('data-songId')
        let baseKey = $('#selectBaseChord').val();
        axios.post(`/song/${songId}`, {
            chordObj : chordCollection,
            baseKey
        }).then(function (response){
            Swal.fire({
                title: "Status",
                text: "Chords added successfully",
                icon: "success"
              });
        }).catch(function(error){
            Swal.fire({
                title: "Status",
                text: "Something went wrong",
                icon: "error"
              });
        });
    });

    
    


    
});
