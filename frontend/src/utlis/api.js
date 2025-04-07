// src/utils/api.js
import axios from 'axios';
import { showSessionExpiredModal } from './modalUtils';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir token a cada petición
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Solo manejar si no es la ruta de login para evitar bucles
      if (!error.config.url.includes('/login')) {
        showSessionExpiredModal();
      }
    }
    return Promise.reject(error);
  }
);

export default api;