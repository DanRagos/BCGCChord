import api from './client';

export const signup = async (payload) => (await api.post('/auth/signup', payload)).data.data;
export const login = async (payload) => (await api.post('/auth/login', payload)).data.data;
export const logout = async () => (await api.post('/auth/logout')).data.data;
export const fetchMe = async () => (await api.get('/auth/me')).data.data;
