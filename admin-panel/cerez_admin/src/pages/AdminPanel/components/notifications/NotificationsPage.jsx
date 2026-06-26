import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../../../contexts/NotificationContext';
import NotificationDetails from './NotificationDetails';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { notifications, markAsRead, deleteNotification } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Reflər
  const filterRef = useRef(null);
  const filterButtonRef = useRef(null);

  // Mətn qısaltma funksiyası
  const truncateText = (text, maxLength = 60) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Xaricə klikləndikdə dropdown-u bağla
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showFilters && 
        filterRef.current && 
        !filterRef.current.contains(event.target) &&
        filterButtonRef.current && 
        !filterButtonRef.current.contains(event.target)
      ) {
        setShowFilters(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showFilters) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showFilters]);

  // Filtrə əsasən bildirişləri süz
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  // Bildiriş növünə görə ikon qaytar
  const getTypeIcon = (type) => {
    switch(type) {
      case 'order': return '🛒';
      case 'user': return '👤';
      case 'message': return '✉️';
      default: return '🔔';
    }
  };

  // Prioritetə görə badge qaytar
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'high': return <span className="priority-badge priority-high">Yüksək</span>;
      case 'medium': return <span className="priority-badge priority-medium">Orta</span>;
      case 'low': return <span className="priority-badge priority-low">Aşağı</span>;
      default: return null;
    }
  };

  // Bildirişə kliklədikdə
  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const getFilterIcon = (filterType) => {
    switch(filterType) {
      case 'all': return '📋';
      case 'unread': return '🔔';
      case 'order': return '🛒';
      case 'user': return '👤';
      case 'message': return '✉️';
      default: return '📋';
    }
  };

  const getFilterLabel = (filterType) => {
    switch(filterType) {
      case 'all': return 'Bütün bildirişlər';
      case 'unread': return 'Oxunmamış';
      case 'order': return 'Sifariş';
      case 'user': return 'İstifadəçi';
      case 'message': return 'Mesaj';
      default: return filterType;
    }
  };

  const getFilterCount = (filterType) => {
    if (filterType === 'all') return notifications.length;
    if (filterType === 'unread') return notifications.filter(n => !n.read).length;
    return notifications.filter(n => n.type === filterType).length;
  };

  const handleFilterSelect = (selectedFilter) => {
    setFilter(selectedFilter);
    setShowFilters(false);
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>Bildirişlər</h1>
        
        {/* YIĞCAM FİLTR */}
        <div className="filter-compact">
          <button 
            ref={filterButtonRef}
            className={`filter-main-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="filter-icon">{getFilterIcon(filter)}</span>
            <span className="filter-label">{getFilterLabel(filter)}</span>
            <span className="filter-count">{getFilterCount(filter)}</span>
            <span className="filter-arrow">{showFilters ? '▲' : '▼'}</span>
          </button>
          
          {showFilters && (
            <div className="filter-dropdown" ref={filterRef}>
              <button 
                className={`filter-option ${filter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterSelect('all')}
              >
                <span className="filter-option-icon">📋</span>
                <span className="filter-option-label">Bütün bildirişlər</span> {/* DÜZƏLDİLDİ */}
                <span className="filter-option-count">{notifications.length}</span>
              </button>
              
              <button 
                className={`filter-option ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => handleFilterSelect('unread')}
              >
                <span className="filter-option-icon">🔔</span>
                <span className="filter-option-label">Oxunmamış</span>
                <span className="filter-option-count">{notifications.filter(n => !n.read).length}</span>
              </button>
              
              <div className="filter-divider"></div>
              
              <button 
                className={`filter-option ${filter === 'order' ? 'active' : ''}`}
                onClick={() => handleFilterSelect('order')}
              >
                <span className="filter-option-icon">🛒</span>
                <span className="filter-option-label">Sifarişlər</span>
                <span className="filter-option-count">{notifications.filter(n => n.type === 'order').length}</span>
              </button>
              
              <button 
                className={`filter-option ${filter === 'user' ? 'active' : ''}`}
                onClick={() => handleFilterSelect('user')}
              >
                <span className="filter-option-icon">👤</span>
                <span className="filter-option-label">İstifadəçilər</span>
                <span className="filter-option-count">{notifications.filter(n => n.type === 'user').length}</span>
              </button>
              
              <button 
                className={`filter-option ${filter === 'message' ? 'active' : ''}`}
                onClick={() => handleFilterSelect('message')}
              >
                <span className="filter-option-icon">✉️</span>
                <span className="filter-option-label">Mesajlar</span>
                <span className="filter-option-count">{notifications.filter(n => n.type === 'message').length}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="notifications-container">
        {/* Sol panel - Bildiriş siyahısı */}
        <div className="notifications-list">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-card ${!notification.read ? 'unread' : ''} ${selectedNotification?.id === notification.id ? 'selected' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-card-icon">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="notification-card-content">
                  <div className="notification-card-header">
                    <h4>{notification.title}</h4>
                    {getPriorityBadge(notification.priority)}
                  </div>
                  <p className="notification-card-message" title={notification.message}>
                    {truncateText(notification.message)}
                  </p>
                  <div className="notification-card-footer">
                    <span className="notification-card-user">{notification.user}</span>
                    <span className="notification-card-time">{notification.time}</span>
                  </div>
                </div>
                {!notification.read && <span className="unread-indicator" />}
              </div>
            ))
          ) : (
            <div className="no-notifications">
              <div className="no-notifications-icon">📭</div>
              <h3>Bildiriş yoxdur</h3>
              <p>Seçilmiş filtrə uyğun bildiriş tapılmadı</p>
            </div>
          )}
        </div>

        {/* Sağ panel - Bildiriş detalları */}
        <div className="notification-details-panel">
          <NotificationDetails 
            notification={selectedNotification}
            onDelete={deleteNotification}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;