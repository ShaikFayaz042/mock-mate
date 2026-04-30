import axios from 'axios';

const api = axios.create({
  baseURL: 'https://mock-mate-api.onrender.com/api', // backend URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockmate_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('mockmate_token');
      localStorage.removeItem('mockmate_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;