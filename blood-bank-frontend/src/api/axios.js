import axios from 'axios';

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();

  // Never use localhost in production builds
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }

  if (import.meta.env.PROD) {
    return ''; // same-origin: /api/... on Vercel
  }

  return 'http://localhost:3001';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
