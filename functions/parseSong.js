module.exports = function parseSongData(songData) {
    const lines = songData.split('\n');
    let sections = [];

    let currentSection = null;

    for (const line of lines) {
        if (line.startsWith('[')) {
            // Extract the section type (e.g., [Verse], [Chorus])
            const sectionType = line.substring(1, line.indexOf(']'));
            // Initialize a new section object
            currentSection = {
                type: sectionType,
                lyrics: ''
            };
            // Add the section object to the sections array
            sections.push(currentSection);
        } else if (currentSection) {
            // Append the line to the lyrics of the current section
            currentSection.lyrics += line.trim() + '\n';
        }
    }

    return sections;
}