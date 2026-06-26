// hooks/useOrders.js - Tam versiya (paymentMethod düzəldildi + hadisə göndərmə əlavə edildi)
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    headers: {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    }
  };
};

// ✅ Sifarişləri formatlayan funksiya - DÜZƏLDİLDİ
const formatOrders = (ordersData) => {
  return ordersData.map(order => ({
    id: order.orderNumber || order._id,
    _id: order._id,
    orderNumber: order.orderNumber,
    customer: order.customer || `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Adsız',
    firstName: order.firstName,
    lastName: order.lastName,
    phone: order.phone,
    date: order.date,
    time: order.time,
    amount: order.amount,
    status: order.status,
    items: order.items || order.products?.length || 0,
    // ✅ KRİTİK: Orijinal paymentMethod dəyərini SAXLAYIRIQ (cash, card, online)
    paymentMethod: order.paymentMethod || 'cash',
    // ✅ Göstərmək üçün (istəsəniz istifadə edin)
    paymentMethodDisplay: order.paymentMethod === 'cash' ? 'Nağd pul' : 
                          order.paymentMethod === 'card' ? 'Kart ilə ödəniş' : 
                          order.paymentMethod === 'online' ? 'Online ödəniş' : 'Nağd pul',
    address: order.address || 'Daxil edilməyib',
    note: order.note || '',
    products: order.products || []
  }));
};

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [todayOrders, setTodayOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    processing: 0,
    cancelled: 0,
    totalAmount: 0
  });

  const today = new Date();
  const todayStr = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;

  const filterTodayOrders = useCallback((ordersList) => {
    return ordersList.filter(order => order.date === todayStr);
  }, [todayStr]);

  // Sifarişləri backend-dən yüklə
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/orders`, getAuthHeaders());
      console.log('Backend cavabı:', response.data);
      const formattedOrders = formatOrders(response.data);
      console.log('Formatted orders:', formattedOrders.map(o => ({ id: o.id, paymentMethod: o.paymentMethod })));
      setOrders(formattedOrders);
      setTodayOrders(filterTodayOrders(formattedOrders));
    } catch (err) {
      console.error('Sifarişlər yüklənərkən xəta:', err);
      setError(err.response?.data?.message || 'Sifarişlər yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, [filterTodayOrders]);

  // Statistikanı backend-dən yüklə
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/stats/summary`, getAuthHeaders());
      setStats(response.data);
    } catch (err) {
      console.error('Statistika yüklənərkən xəta:', err);
    }
  }, []);

  const refreshOrders = useCallback(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  // Yeni sifariş əlavə et (sayt tərəfdən)
  const addOrder = useCallback(async (orderData) => {
    try {
      const response = await axios.post(`${API_URL}/orders`, orderData);
      const formattedOrders = formatOrders([response.data]);
      const newOrder = formattedOrders[0];
      
      setOrders(prev => [newOrder, ...prev]);
      if (newOrder.date === todayStr) {
        setTodayOrders(prev => [newOrder, ...prev]);
      }
      
      await fetchStats();
      return newOrder;
    } catch (err) {
      console.error('Sifariş əlavə edilərkən xəta:', err);
      throw err;
    }
  }, [todayStr, fetchStats]);

  // ✅ Sifarişi yenilə - HADİSƏ GÖNDƏRİR
  const updateOrder = useCallback(async (orderId, updatedData) => {
    try {
      // 🔍 Köhnə sifarişi tap (əvvəlki statusu bilmək üçün)
      const oldOrder = orders.find(order => order.id === orderId || order._id === orderId);
      const oldStatus = oldOrder?.status;
      const newStatus = updatedData.status;
      
      // Optimistic update
      setOrders(prev => prev.map(order => 
        (order.id === orderId || order._id === orderId) 
          ? { ...order, ...updatedData } 
          : order
      ));
      
      setTodayOrders(prev => prev.map(order => 
        (order.id === orderId || order._id === orderId) 
          ? { ...order, ...updatedData } 
          : order
      ));
      
      await axios.put(`${API_URL}/orders/${orderId}`, updatedData, getAuthHeaders());
      await fetchStats();
      
      // ✅ HADİSƏ GÖNDƏR - Status dəyişibsə
      if (oldStatus !== newStatus) {
        // Ümumi status dəyişmə hadisəsi
        window.dispatchEvent(new CustomEvent('orderStatusChanged', { 
          detail: { orderId, oldStatus, newStatus, phone: oldOrder?.phone }
        }));
        
        // Əgər yeni status 'completed'dirsə, xüsusi hadisə
        if (newStatus === 'completed') {
          window.dispatchEvent(new CustomEvent('orderCompleted', { 
            detail: { orderId, phone: oldOrder?.phone, amount: updatedData.amount || oldOrder?.amount }
          }));
          console.log('✅ orderCompleted hadisəsi göndərildi:', orderId);
        }
        
        // Əgər köhnə status 'completed' idisə və dəyişibsə (geri çəkilib)
        if (oldStatus === 'completed' && newStatus !== 'completed') {
          window.dispatchEvent(new CustomEvent('orderUncompleted', { 
            detail: { orderId, phone: oldOrder?.phone }
          }));
        }
      }
      
    } catch (err) {
      console.error('Sifariş yenilənərkən xəta:', err);
      fetchOrders();
      throw err;
    }
  }, [fetchOrders, fetchStats, orders]);

  // ✅ Sifariş statusunu yenilə - HADİSƏ GÖNDƏRİR
  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      // 🔍 Köhnə sifarişi tap
      const oldOrder = orders.find(order => order.id === orderId || order._id === orderId);
      const oldStatus = oldOrder?.status;
      
      setOrders(prev => prev.map(order => 
        (order.id === orderId || order._id === orderId) 
          ? { ...order, status } 
          : order
      ));
      
      setTodayOrders(prev => prev.map(order => 
        (order.id === orderId || order._id === orderId) 
          ? { ...order, status } 
          : order
      ));
      
      await axios.patch(`${API_URL}/orders/${orderId}/status`, { status }, getAuthHeaders());
      await fetchStats();
      
      // ✅ HADİSƏ GÖNDƏR
      window.dispatchEvent(new CustomEvent('orderStatusChanged', { 
        detail: { orderId, oldStatus, newStatus: status, phone: oldOrder?.phone }
      }));
      
      if (status === 'completed') {
        window.dispatchEvent(new CustomEvent('orderCompleted', { 
          detail: { orderId, phone: oldOrder?.phone, amount: oldOrder?.amount }
        }));
        console.log('✅ orderCompleted hadisəsi göndərildi:', orderId);
      }
      
      if (oldStatus === 'completed' && status !== 'completed') {
        window.dispatchEvent(new CustomEvent('orderUncompleted', { 
          detail: { orderId, phone: oldOrder?.phone }
        }));
      }
      
    } catch (err) {
      console.error('Status yenilənərkən xəta:', err);
      fetchOrders();
      throw err;
    }
  }, [fetchOrders, fetchStats, orders]);

  // Sifarişi sil
  const deleteOrder = useCallback(async (orderId) => {
    try {
      // Silinən sifarişin məlumatını tap
      const deletedOrder = orders.find(order => order.id === orderId || order._id === orderId);
      
      setOrders(prev => prev.filter(order => order.id !== orderId && order._id !== orderId));
      setTodayOrders(prev => prev.filter(order => order.id !== orderId && order._id !== orderId));
      await axios.delete(`${API_URL}/orders/${orderId}`, getAuthHeaders());
      await fetchStats();
      
      // ✅ Sifariş silindikdə də hadisə göndər (istifadəçi xərci yenilənsin)
      if (deletedOrder && deletedOrder.status === 'completed') {
        window.dispatchEvent(new CustomEvent('orderDeleted', { 
          detail: { orderId, phone: deletedOrder.phone }
        }));
      }
      
    } catch (err) {
      console.error('Sifariş silinərkən xəta:', err);
      fetchOrders();
      throw err;
    }
  }, [fetchOrders, fetchStats, orders]);

  // Lokal statistika (backup)
  const calculateStats = useCallback(() => {
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalAmount = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    return { total, completed, pending, processing, cancelled, totalAmount };
  }, [orders]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  return {
    orders,
    todayOrders,
    loading,
    error,
    stats,
    refreshOrders,
    addOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    calculateStats,
    todayStr
  };
};