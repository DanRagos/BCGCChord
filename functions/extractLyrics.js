const axios = require('axios');
const puppeteer = require("puppeteer")

/**
 * @param {string} url - Genius URL
 */
module.exports = async function (url) {
    try {
        const browser = await puppeteer.launch({ headless: true }); // Headless mode
        const page = await browser.newPage();

        // Set a realistic user agent
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        );

        await page.goto(url, { waitUntil: "networkidle2" }); // Wait for page to fully load

        // Extract lyrics using the proper CSS selectors
        const lyrics = await page.evaluate(() => {
            let lyricsContainer = document.querySelector('div[class^="Lyrics__Container"], div[class^="Lyrics-sc-"]');
            return lyricsContainer ? lyricsContainer.innerText : "Lyrics not found.";
        });

        await browser.close();
        return lyrics.trim();
    } catch (error) {
        console.error("Error extracting lyrics:", error.message);
        return null;
    }
}