const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const BASE_URL = 'https://api.genius.com';

function client() {
  if (!env.geniusAccessToken) {
    throw ApiError.internal(
      'Genius API is not configured (missing GENIUS_ACCESS_TOKEN).',
      'GENIUS_NOT_CONFIGURED'
    );
  }
  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${env.geniusAccessToken}` },
    timeout: 10000,
  });
}

async function withRetry(fn, retries = 2) {
  try {
    return await fn();
  } catch (err) {
    const status = err.response && err.response.status;
    if (status === 429 && retries > 0) {
      const retryAfter = Number(err.response.headers['retry-after']) || 1;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

async function searchSongs(query) {
  if (!query || !query.trim()) {
    throw ApiError.badRequest('A search query is required.', 'MISSING_QUERY');
  }
  try {
    const res = await withRetry(() => client().get('/search', { params: { q: query } }));
    const hits = res.data.response.hits || [];
    return hits
      .filter((hit) => hit.type === 'song')
      .map((hit) => {
        const { id, artist_names: artist, release_date_for_display: releaseDate, title, url, header_image_url: imageUrl } =
          hit.result;
        return { geniusId: id, artist, releaseDate, title, url, imageUrl };
      });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.response && err.response.status === 401) {
      throw ApiError.internal('Genius API rejected the configured access token.', 'GENIUS_AUTH_FAILED');
    }
    throw ApiError.internal(`Genius search failed: ${err.message}`, 'GENIUS_SEARCH_FAILED');
  }
}

async function getSongById(geniusId) {
  try {
    const res = await withRetry(() => client().get(`/songs/${geniusId}`));
    const song = res.data.response && res.data.response.song;
    if (!song) throw ApiError.notFound('Song not found on Genius.', 'GENIUS_SONG_NOT_FOUND');
    return song;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.response && err.response.status === 404) {
      throw ApiError.notFound('Song not found on Genius.', 'GENIUS_SONG_NOT_FOUND');
    }
    throw ApiError.internal(`Genius lookup failed: ${err.message}`, 'GENIUS_LOOKUP_FAILED');
  }
}

module.exports = { searchSongs, getSongById };
