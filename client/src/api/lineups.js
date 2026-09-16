import api from './client';

export const fetchLineups = async () => {
  const { data } = await api.get('/lineups');
  return data.data; // array of lineups, songs.song populated with title/artist/originalKey/currentKey
};

export const fetchLineup = async (id) => {
  const { data } = await api.get(`/lineups/${id}`);
  return data.data; // songs.song populated with title/artist/originalKey/currentKey/capo/sections
};

export const createLineup = async (payload) => {
  const { data } = await api.post('/lineups', payload);
  return data.data;
};

export const updateLineup = async (id, payload) => {
  const { data } = await api.put(`/lineups/${id}`, payload);
  return data.data;
};

export const deleteLineup = async (id) => {
  await api.delete(`/lineups/${id}`);
};
