const axios = require('axios');
const cheerio = require('cheerio');
const sanitizeHtml = require('sanitize-html');

const USER_AGENT = 'Mozilla/5.0 (compatible; ChordbookImporter/1.0; +https://github.com/DanRagos/BCGCChord)';

// Genius does not expose lyrics through its public API (only metadata and
// search), so this remains the one place the app depends on page structure
// rather than a stable API. Kept as resilient as practical: several known
// container selectors are tried, ads/annotation chrome is stripped first,
// and this fails closed (returns null) instead of returning garbage when
// none of them match — the caller then asks the user to paste lyrics
// manually rather than saving something wrong.
async function fetchHtml(url) {
  const { data } = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 10000 });
  return data;
}

function extractLyricsFromHtml(html) {
  const $ = cheerio.load(html);

  $('[class*="LyricsHeader"], [class*="InreadAd"], [class*="StickyAd"], [class*="Footer"], script, style').remove();

  const containers = $(
    'div[class^="Lyrics__Container"], div[data-lyrics-container="true"], div[class^="lyrics"]'
  );
  if (containers.length === 0) return null;

  const blocks = [];
  containers.each((_, el) => {
    const $el = $(el);
    $el.find('br').replaceWith('\n');
    const withLineBreaks = $el.html() || '';
    const plain = sanitizeHtml(withLineBreaks, { allowedTags: [], allowedAttributes: {} });
    const text = plain.replace(/\n{2,}/g, '\n').trim();
    if (text) blocks.push(text);
  });

  if (blocks.length === 0) return null;
  return blocks.join('\n\n').trim();
}

async function scrapeLyricsFromGeniusUrl(url) {
  const html = await fetchHtml(url);
  return extractLyricsFromHtml(html);
}

module.exports = { scrapeLyricsFromGeniusUrl, extractLyricsFromHtml };
