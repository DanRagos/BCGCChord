import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message || err.message || 'Something went wrong';
    const wrapped = new Error(message);
    wrapped.code = err.response?.data?.error?.code;
    wrapped.status = err.response?.status;
    return Promise.reject(wrapped);
  }
);

export default api;
