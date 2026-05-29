import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/** Nearby hospitals may call external map APIs; allow more time than default. */
export const NEARBY_HOSPITALS_TIMEOUT_MS = 15000;

export default api;
