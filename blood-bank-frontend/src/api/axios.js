import axios from 'axios';

function getApiBaseUrl() {
  // In the browser on Vercel, always use the current site (avoids stale localhost in builds)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      return window.location.origin;
    }
  }

  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }

  if (import.meta.env.PROD) {
    return '';
  }

  return 'http://localhost:3001';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
