import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - token əlavə et
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - xəta idarəetməsi
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin: Bütün mesajları getir
export const getMessages = async (page = 1, limit = 10, status = 'all', search = '') => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await api.get(`/messages?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Mesajları yükləyərkən xəta:', error);
    return { success: false, messages: [], pagination: { pages: 1, total: 0 }, stats: { unreadCount: 0, totalCount: 0, readCount: 0 } };
  }
};

// Admin: Mesajı oxundu işarələ
export const markAsRead = async (messageId) => {
  try {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  } catch (error) {
    console.error('Xəta:', error);
    return error.response?.data || { success: false };
  }
};

// Admin: Bütün mesajları oxundu işarələ
export const markAllAsRead = async () => {
  try {
    const response = await api.put('/messages/read-all');
    return response.data;
  } catch (error) {
    console.error('Xəta:', error);
    return error.response?.data || { success: false };
  }
};

// Admin: Mesajı sil
export const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Xəta:', error);
    return error.response?.data || { success: false };
  }
};

// Admin: Çoxlu mesaj sil
export const bulkDeleteMessages = async (ids) => {
  try {
    const response = await api.post('/messages/bulk-delete', { ids });
    return response.data;
  } catch (error) {
    console.error('Xəta:', error);
    return error.response?.data || { success: false };
  }
};

// Admin: Spam olaraq işarələ
export const markAsSpam = async (messageId) => {
  try {
    const response = await api.put(`/messages/${messageId}/spam`);
    return response.data;
  } catch (error) {
    console.error('Xəta:', error);
    return error.response?.data || { success: false };
  }
};