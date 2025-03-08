const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const ejsMate =  require("ejs-mate")
const path = require("path")
const extractLyrics = require('./functions/extractLyrics')
const Song = require('./models/song')
const Lineup = require('./models/lineup');
const Org = require('./models/org');
const User = require('./models/user');
 const mongoose = require("mongoose");
const ChordSheetJS = require('chordsheetjs').default;
const { Chord } = require('chordsheetjs');
const bodyParser = require('body-parser');
// require('dotenv').config()


app.engine('ejs',ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

function parseSongData(songData) {
    const lines = songData.split('\n');
    let sections = [];

    let currentSection = null;

    for (const line of lines) {
        if (line.startsWith('[')) {
            // Extract the section type (e.g., [Verse], [Chorus])
            const sectionType = line.substring(1, line.indexOf(']'));
            // Initialize a new section object

            currentSection = {
                section: sectionType,
                lyrics: ''
            };
            // Add the section object to the sections array
            sections.push(currentSection);
        } else if (currentSection) {
            // Append the line to the lyrics of the current section
            currentSection.lyrics += line.trim() + '\n ';
        } else{
            currentSection = {
                section: 'Song',
                lyrics:  line.trim() + '\n '
            };
            sections.push(currentSection);
        }
    }

    return sections;
}


const uri = "mongodb+srv://admin:admin@cluster0.rogomdl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri, {

  });
  const db = mongoose.connection;

  db.on('error', (error) => {
    console.error("MongoDB connection error:", error);
  });

  db.once('open', () => {
    console.log("Connected to MongoDB Atlas");
  });

// Define your Genius API access token
const accessToken = 'nSRqZwQuQh7q2lTEN6cdCYocgkMDygFdN8nffMIXC1xekB-KwIKhZc095kcA0P3x';
app.get('/', (req,res)=>{
    res.render('home')
});

// Start the server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/song', async (req, res) => {
    try {
        console.log("sd");
        const response = await axios.get(`https://api.genius.com/search?q=${encodeURIComponent(req.query.songTitle)}`, {
            headers: {
                Authorization: `Bearer T4aiTcmsatGLj4U66lYW8LZ9XlGAwasfuDisO5po8A_eX8p046HDt5TiAXeFBlhs`
            },
            rejectUnauthorized: false

        }).catch(function (error) { console.log(error)});
        console.log("sd");

        const hits = response.data.response.hits;
            const existingSongs  = await Promise.all(hits.map(async(hit)=>{
                const { id, artist_names, release_date_for_display, title, url ="", header_image_url } = hit.result;
            const existingSong = await Song.findOne({songId:id});

                return { id, artist_names, release_date_for_display, title, url,  header_image_url, haveChords: !!existingSong }
       }));

       res.render('songs/index', { hits: existingSongs }); // Passing hits as an object to the view
    } catch (error) {
        res.status(500).send('Internal Server Error' + error);
    }
});

app.post('/song/:id', async (req, res) => {
    try {
        const segment = req.body;
        const key = req.body.baseKey;
        const chordSegments = [];
        console.log(segment);

        for (const sectionName in segment.chordObj) {
            const sectionSegments = segment.chordObj[sectionName].map(chordObj => ({
                lyricSection: chordObj.lyricSection,
                chords: chordObj.chords,
                line: chordObj.line
            }));

            chordSegments.push({
                section: sectionName,
                chords: sectionSegments
            });
        }


        // Fetch song data from Genius API
        const { data: songObj } = await axios.get(`https://api.genius.com/songs/${req.params.id}`, {
            headers: {
                Authorization: `Bearer T4aiTcmsatGLj4U66lYW8LZ9XlGAwasfuDisO5po8A_eX8p046HDt5TiAXeFBlhs`
            }
        });

        const mediaUrl = songObj.response.song.media.filter((med)=>{
            return med.provider === 'youtube';
        });

        if (songObj) {
            // Create a new Song instance
            const song = new Song({
                songId: songObj.response.song.id,
                title: songObj.response.song.title,
                artist: songObj.response.song.artist_names,
                segments: chordSegments, // Pass the reformatted chordSegments
                baseKey : key,
                yearReleased: songObj.response.song.release_date_for_display,
                urlMedia : "test",
                songArt : songObj.response.song.song_art_image_url
            });

            // Save the song to the database
            await song.save();

            // Send a success response
            res.send("Song saved successfully.");
        } else {
            // Send a 404 response if song data is not found
            res.status(404).send("Song not found.");
        }
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).send("Internal server error.");
    }
});

app.get('/song/viewChords/:id', async (req, res)=>{
    const song = await Song.findOne(
        { songId: req.params.id }
      );
    if (song){
        res.render('chords/index',{song})
    }
    else {
        res.redirect('/home');
    }
});

app.get('/song/viewChords', async (req, res)=>{
    try{
        const {songTitle} = req.query;
        const regex = new RegExp(songTitle, 'i');

        const chords = await Song.find({
            title: {$regex: regex},
        });

        res.json(chords);
        console.log(chords);
    }catch(error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

});


app.get('/song/viewChords/chords/:id', async (req, res)=>{
    const song = await Song.findOne(
        { songId: req.params.id }
      );
    if (song){
        res.json(song)
    }
    else {
        res.redirect('/home');
    }

});



//Lyrics

app.get('/song/viewLyrics/:id', async (req, res) => {
    try {
        const songId = req.params.id;
        console.log("Fetching song with ID:", songId); // Log ID for debugging

        const response = await axios.get(`https://api.genius.com/songs/${songId}`, {
            headers: {
                Authorization: `Bearer T4aiTcmsatGLj4U66lYW8LZ9XlGAwasfuDisO5po8A_eX8p046HDt5TiAXeFBlhs`
            }
        });

        if (!response || !response.data || !response.data.response.song) {
            return res.status(404).send("Error: Song not found");
        }

        const songData = response.data.response.song;
        console.log("Fetched song:", songData.title); // Log song title for debugging

        // Extract lyrics from the song URL
        try {
            const lyrics = await extractLyrics(songData.url);
            console.log("Extracted Lyrics URL:", songData.url);

            const yearReleased = songData.release_date ? new Date(songData.release_date).getFullYear() : "Unknown";

            const sections = parseSongData(lyrics);

            const newSong = new Song({
                songId: songData.id,
                title: songData.title,
                author: songData.primary_artist.name,
                genre: songData.id, // Shouldn't genre be different from song ID?
                yearReleased: yearReleased,
                chords: null,
                lyrics: sections
            });

            console.log("Rendering song view...");
            res.render('songs/show', {
                song: {
                    details: songData,
                    lyrics: sections
                }
            });

        } catch (err) {
            console.error("Error extracting lyrics:", err.message);
            res.status(500).send("Error extracting lyrics");
        }

    } catch (error) {
        console.error("Error fetching song data:", error.message);

        if (error.response) {
            console.error("Status Code:", error.response.status);
            console.error("Response Data:", error.response.data);
            return res.status(error.response.status).send(error.response.data);
        }

        res.status(500).send("Internal Server Error");
    }
});



//lineup

app.get('/lineup', async (req, res)=>{
    const lineup = await Lineup.find().sort({
        lineupDate : 'desc',
    }).populate('songs.song');
    console.log(lineup)
    res.json(lineup);
});

app.get('/lineup/show', async (req, res)=>{
    const lineup = await Lineup.find({})
    .populate({
        path: 'songs.song',
        model: 'Song',
        select: 'title' // Select only the title and baseKey fields of the Song
    }).sort({lineupDate : 'desc'});
    console.log(lineup)
    res.render('lineup/index', {lineup});
});
app.get('/lineup/live', async (req,res)=>{
    const lineup = await Lineup.findById(req.query.id)
        .populate({
            path: 'songs.song',
            model: 'Song',
            select: 'title songId' // Select only the title field of the Song
        });

        if (!lineup || lineup.length === 0) {
            return res.status(404).json({ error: 'Lineup not found' });
        }

            res.render('lineup/live', {lineup});


})

app.get('/lineup/new', async (req, res)=>{
    res.render('lineup/new');
});

app.post('/lineup', async (req, res) => {
    try {
        const body = req.body;
        const lineUp = new Lineup(body);
        const savedLineUp = await lineUp.save(); // Use a different variable name here
        res.send("Success");
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

//Orgs
app.get('/org/', async (req, res) =>{
    const org = await Org.find({});
    res.json(org);
});
// Users

app.get('/users/signup', (req, res)=> {
    res.render('users/new');
});

app.get('/users/login', (req, res)=> {
    res.render('users/login');
});

app.post('/users/signup', async (req, res) => {
    try {
        // Extract form data from req.body
        const { firstname, lastname, role, church, username, password } = req.body;
        // Create a new user instance
        const newUser = new User({
            name: `${firstname} ${lastname}`,
            username,
            password,
            role,
            organization: church // Assuming church is the organization ID
        });

        // Save the new user to the database
        const savedUser = await newUser.save();

        // Respond with success message
        res.status(201).json({ message: 'User created successfully', user: savedUser });
    } catch (error) {
        // Respond with error message if there's an error
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});