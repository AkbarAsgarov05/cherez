import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bildirişləri yüklə
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Mock məlumatlar - real tətbiqdə API-dən gələcək
        setTimeout(() => {
          const mockNotifications = [
            { 
              id: 1, 
              type: 'order', 
              icon: '🛒', 
              title: 'Yeni Sifariş',
              message: 'Yeni sifariş gəldi #12349', 
              time: '5 dəqiqə əvvəl',
              read: false,
              priority: 'high',
              user: 'Əli Məmmədov',
              details: {
                orderId: 'ORD-2024-001',
                customer: 'Əli Məmmədov',
                amount: 450,
                products: [
                  { name: 'Məhsul 1', quantity: 2, price: 150 },
                  { name: 'Məhsul 2', quantity: 1, price: 150 }
                ],
                customerInfo: {
                  name: 'Əli Məmmədov',
                  phone: '+994 50 123 45 67',
                  email: 'ali@email.com',
                  address: 'Bakı, Nərimanov rayonu'
                }
              }
            },
            { 
              id: 2, 
              type: 'user', 
              icon: '👤', 
              title: 'Yeni İstifadəçi',
              message: 'Aygün Həsənova platformaya qeydiyyatdan keçdi', 
              time: '15 dəqiqə əvvəl',
              read: false,
              priority: 'medium',
              user: 'Aygün Həsənova',
              details: {
                userId: 'USR-2024-156',
                name: 'Aygün Həsənova',
                email: 'aygun@email.com',
                phone: '+994 70 987 65 43',
                registeredAt: '2024-01-15 10:30'
              }
            },
            { 
              id: 3, 
              type: 'message', 
              icon: '✉️', 
              title: 'Yeni Mesaj',
              message: 'Kamil Əliyev dəstək xidmətinə mesaj göndərdi', 
              time: '2 saat əvvəl',
              read: true,
              priority: 'low',
              user: 'Kamil Əliyev',
              details: {
                messageId: 'MSG-2024-089',
                from: 'Kamil Əliyev',
                subject: 'Məhsul haqqında sual',
                content: 'Məhsulun çatdırılma müddəti nə qədərdir?',
                email: 'kamil@email.com'
              }
            },
            { 
              id: 4, 
              type: 'order', 
              icon: '🛒', 
              title: 'Yeni Sifariş',
              message: 'Yeni sifariş gəldi #12350', 
              time: '3 saat əvvəl',
              read: true,
              priority: 'medium',
              user: 'Nigar Hüseynova',
              details: {
                orderId: 'ORD-2024-002',
                customer: 'Nigar Hüseynova',
                amount: 780,
                products: [
                  { name: 'Məhsul 3', quantity: 3, price: 260 }
                ],
                customerInfo: {
                  name: 'Nigar Hüseynova',
                  phone: '+994 55 987 65 43',
                  email: 'nigar@email.com',
                  address: 'Bakı, Xətai rayonu'
                }
              }
            }
          ];
          setNotifications(mockNotifications);
          setUnreadCount(mockNotifications.filter(n => !n.read).length);
          setLoading(false);
        }, 700);
      } catch (err) {
        setError('Bildirişlər yüklənərkən xəta baş verdi');
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Bildirişi oxundu kimi işarələ
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Bütün bildirişləri oxundu kimi işarələ
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Bildirişi sil
  const deleteNotification = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };

  // Yeni bildiriş əlavə et (real-time üçün)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};