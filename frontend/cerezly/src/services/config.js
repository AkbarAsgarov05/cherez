// services/config.js (müştəri tərəf)

// API URL - environment variable-dan götür
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Real API istifadə edilsin? (backend hazır olana qədər false)
export const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

// Request timeout (ms)
export const REQUEST_TIMEOUT = 10000;

// Default headers
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Şəbəkə xətası. İnternet bağlantınızı yoxlayın.',
  SERVER_ERROR: 'Server xətası. Zəhmət olmasa sonra təkrar cəhd edin.',
  NOT_FOUND: 'Məlumat tapılmadı.',
  DEFAULT: 'Xəta baş verdi. Zəhmət olmasa təkrar cəhd edin.',
};