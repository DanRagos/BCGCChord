import api from './client';

export const searchGenius = async (q) => {
  const { data } = await api.get('/import/genius/search', { params: { q } });
  return data.data; // [{ geniusId, artist, releaseDate, title, url, imageUrl }]
};

export const previewGeniusImport = async (geniusId) => {
  const { data } = await api.get(`/import/genius/${geniusId}/preview`);
  return data.data; // preview payload: { title, artist, album, originalKey, currentKey, sections, metadata, source, preview }
};

export const previewPasteImport = async ({ chordSheetText, title, artist }) => {
  const { data } = await api.post('/import/paste/preview', { chordSheetText, title, artist });
  return data.data; // preview payload, same shape (source.type: 'paste-import')
};

// Persists a preview payload returned by either function above. Nothing is
// ever saved from a scrape/paste except through this explicit call.
export const saveImport = async (previewPayload) => {
  const { preview, ...songData } = previewPayload; // server strips `preview` too; stripped here as well for a clean payload
  const { data } = await api.post('/songs/import', songData);
  return data.data; // the saved Song
};
