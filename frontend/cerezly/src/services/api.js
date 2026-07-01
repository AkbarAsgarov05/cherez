// services/api.js - ACCESS + REFRESH TOKEN (DÜZGÜN İŞLƏYİR)
import axios from 'axios';

// ✅ DÜZGÜN - Environment variable ilə
const API_URL = import.meta.env.VITE_API_URL || 'https://cherez.onrender.com/api';
const REQUEST_TIMEOUT = 30000;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      return config;
    }
    
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // ✅ CRITICAL: LOGIN VƏ REGISTER ENDPOINT-LƏRİNİ KEÇ
    if (originalRequest.url?.includes('/auth/login') || 
        originalRequest.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userData');
        if (window.location.pathname.includes('/admin')) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }
      
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('Refresh token tapılmadı');
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });
        
        if (response.data.success && response.data.accessToken) {
          const { accessToken: newAccessToken } = response.data;
          
          localStorage.setItem('accessToken', newAccessToken);
          
          processQueue(null, newAccessToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('Token yenilənmədi');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export const apiGet = async (endpoint, options = {}) => {
  try {
    const response = await apiClient.get(endpoint, options);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const apiPost = async (endpoint, data, options = {}) => {
  try {
    const response = await apiClient.post(endpoint, data, options);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const apiPut = async (endpoint, data, options = {}) => {
  try {
    const response = await apiClient.put(endpoint, data, options);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const apiDelete = async (endpoint, options = {}) => {
  try {
    const response = await apiClient.delete(endpoint, options);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const authAPI = {
  login: async (email, password) => {
    // ✅ BİRBAŞA AXIOS İLƏ – interceptor problemi yaşamamaq üçün
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    if (response.data.success) {
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch (e) {}
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  }
};

export default apiClient;