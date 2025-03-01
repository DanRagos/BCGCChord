async function renderLyrics(song) {
    var songId = $('.lyricsSection').attr('data-songId') || song;
    
    try {
        const response = await axios.get(`/song/viewChords/chords/${songId}`);
        console.log(response.data);
        return response.data; // Return the fetched data
    } catch (error) {
        console.log(error);
        throw error; // Rethrow the error to handle it outside the function if needed
    }
}

function renderChords(song){
    let html = '';
    let lyricsSection = $('.lyricsSection');
    for (segments of song.segments ){
        html+=`
        <div class="lyricSection d-flex flex-column align-items-center mb-4 fw-bolder" data-section = "${segments.section}">${segments.section} </br> `;
        for (segment of segments.chords){
            html+=`<div class="lyric-container d-inline-flex bd-highlight text-start flex-wrap">`
            segment.chords.forEach((chord,index) => {
                    html+=`<div class="lyric-segment mx-1 col-sm-auto">
                    <div class="chords fw-bold fs-6">
                     ${chord || "&nbsp;" }  
                    </div>                     
                    <div class="lyrics fw-light ">
                      <span class="word">${segment.lyricSection[index] || "&nbsp;"} </span>
                  </div>  
                  </div>`;
            });

            html+=`</div>`;

        }
        html+=`</div>`;
    }
    
lyricsSection.html(html);
}