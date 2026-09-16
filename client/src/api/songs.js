import api from './client';

export const fetchSongs = async (params = {}) => {
  const { data } = await api.get('/songs', { params });
  return data.data; // { songs, total, page, limit }
};

export const fetchSong = async (id) => {
  const { data } = await api.get(`/songs/${id}`);
  return data.data;
};

export const transposeSong = async (id, targetKey) => {
  const { data } = await api.post(`/songs/${id}/transpose`, { targetKey });
  return data.data;
};

export const createSong = async (payload) => {
  const { data } = await api.post('/songs', payload);
  return data.data;
};

export const updateSong = async (id, payload) => {
  const { data } = await api.put(`/songs/${id}`, payload);
  return data.data;
};

export const deleteSong = async (id) => {
  await api.delete(`/songs/${id}`);
};
