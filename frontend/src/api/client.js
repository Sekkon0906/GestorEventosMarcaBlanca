import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('gestek_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Error desconocido';

    if (err.response?.status === 401) {
      localStorage.removeItem('gestek_token');
      localStorage.removeItem('gestek_user');
      window.location.href = '/login';
    }

    return Promise.reject(new Error(msg));
  }
);

export default client;
