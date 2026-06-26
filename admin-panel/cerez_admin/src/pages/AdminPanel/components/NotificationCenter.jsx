// src/components/AdminPanel/components/NotificationCenter.jsx
import React, { useState, useEffect, useRef } from 'react';
import './NotificationCenter.css';
import Pagination from './Pagination';
import {
  FiBell, FiX, FiAlertCircle, FiClock, FiTrash2, FiEye,
  FiFilter, FiShoppingCart, FiMessageSquare, FiUserPlus,
  FiSettings, FiRefreshCw, FiChevronDown, FiDownload,
  FiStar, FiFlag, FiInbox, FiSend, FiSearch, FiCheckCircle, FiInfo
} from 'react-icons/fi';

const NotificationCenter = () => {
  // ========== STATE ==========
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewModal, setViewModal] = useState({ show: false, notification: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, notificationId: null, multiple: false });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const dropdownRef = useRef(null);
  
  const notificationsPerPage = 10;

  // ========== MOCK BİLDİRİŞ MƏLUMATLARI ==========
  useEffect(() => {
    const demoNotifications = [
      {
        id: 1,
        title: 'Yeni sifariş',
        message: 'Əli Hüseynov 245 nömrəli sifarişi tamamladı. Ümumi məbləğ: 89.99 AZN',
        type: 'order',
        createdAt: new Date(2024, 2, 15, 9, 30),
        actionUrl: '/admin/orders/245'
      },
      {
        id: 2,
        title: 'Yeni mesaj',
        message: 'Günel Məmmədova sizə yeni mesaj göndərdi: "Sifarişimin statusu nədir?"',
        type: 'message',
        createdAt: new Date(2024, 2, 15, 10, 15),
        actionUrl: '/admin/messages'
      },
      {
        id: 3,
        title: 'Yeni istifadəçi qeydiyyatı',
        message: 'Rəşad Əliyev platformada qeydiyyatdan keçdi',
        type: 'user',
        createdAt: new Date(2024, 2, 14, 14, 20),
        actionUrl: '/admin/users'
      },
      {
        id: 4,
        title: 'Sistem yeniləməsi',
        message: 'Sistem 2.3.0 versiyasına yeniləndi. Yeni xüsusiyyətləri kəşf edin.',
        type: 'system',
        createdAt: new Date(2024, 2, 14, 8, 0),
        actionUrl: '/admin/settings'
      },
      {
        id: 5,
        title: 'Yeni rəy',
        message: 'Nigar Quliyeva "Badam 1 kq" məhsuluna 5 ulduzlu rəy yazdı',
        type: 'review',
        createdAt: new Date(2024, 2, 13, 16, 45),
        actionUrl: '/admin/reviews'
      },
      {
        id: 6,
        title: 'Kampaniya başa çatır',
        message: '"Yaz endirimi" kampaniyasının bitməsinə 3 gün qalıb',
        type: 'campaign',
        createdAt: new Date(2024, 2, 13, 11, 0),
        actionUrl: '/admin/campaigns'
      },
      {
        id: 7,
        title: 'Məhsul göndərildi',
        message: 'Sifariş #245 göndərildi. Track nömrəsi: AZ123456789',
        type: 'order',
        createdAt: new Date(2024, 2, 12, 9, 30),
        actionUrl: '/admin/orders/245'
      },
      {
        id: 8,
        title: 'Təhlükəsizlik xəbərdarlığı',
        message: 'Admin panelinə yeni cihazdan giriş edildi. Əgər bu siz deyilsinizsə, şifrənizi dəyişdirin.',
        type: 'security',
        createdAt: new Date(2024, 2, 10, 23, 45),
        actionUrl: '/admin/security'
      },
      {
        id: 9,
        title: 'Yeni bloq yazısı',
        message: 'Mərcanə Həsənova "Quru meyvələrin faydaları" adlı yeni məqalə yazdı',
        type: 'blog',
        createdAt: new Date(2024, 2, 11, 10, 0),
        actionUrl: '/admin/blog'
      },
      {
        id: 10,
        title: 'Məhsul yeniləndi',
        message: 'Siz "Qarışıq quru meyvə dəsti" məhsulunu yenilədiniz',
        type: 'system',
        createdAt: new Date(2024, 2, 10, 14, 30),
        actionUrl: '/admin/products'
      },
      {
        id: 11,
        title: 'Yeni endirim kodu',
        message: 'Yeni istifadəçilər üçün "WELCOME10" endirim kodu yaradıldı',
        type: 'campaign',
        createdAt: new Date(2024, 2, 9, 12, 0),
        actionUrl: '/admin/campaigns'
      },
      {
        id: 12,
        title: 'Ödəniş təsdiqləndi',
        message: 'Sifariş #244 üçün ödəniş təsdiqləndi. Məbləğ: 156.50 AZN',
        type: 'order',
        createdAt: new Date(2024, 2, 11, 15, 20),
        actionUrl: '/admin/orders/244'
      }
    ];
    
    setTimeout(() => {
      setNotifications(demoNotifications);
      setLoading(false);
    }, 500);
  }, []);

  // ========== CLICK OUTSIDE HANDLER ==========
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========== HELPER FUNCTIONS ==========
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'İndi';
    if (diffMins < 60) return `${diffMins} dəq əvvəl`;
    if (diffHours < 24) return `${diffHours} saat əvvəl`;
    if (diffDays === 1) return 'Dünən';
    if (diffDays < 7) return `${diffDays} gün əvvəl`;
    return date.toLocaleDateString('az-AZ');
  };

  const getIconByType = (type) => {
    const iconProps = { size: 18 };
    switch (type) {
      case 'order': return <FiShoppingCart {...iconProps} />;
      case 'message': return <FiMessageSquare {...iconProps} />;
      case 'user': return <FiUserPlus {...iconProps} />;
      case 'system': return <FiSettings {...iconProps} />;
      case 'review': return <FiStar {...iconProps} />;
      case 'campaign': return <FiFlag {...iconProps} />;
      case 'security': return <FiAlertCircle {...iconProps} />;
      case 'blog': return <FiSend {...iconProps} />;
      default: return <FiBell {...iconProps} />;
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      order: 'Sifariş',
      message: 'Mesaj',
      user: 'İstifadəçi',
      system: 'Sistem',
      review: 'Rəy',
      campaign: 'Kampaniya',
      security: 'Təhlükəsizlik',
      blog: 'Bloq'
    };
    return types[type] || 'Bildiriş';
  };

  const getTypeClass = (type) => {
    const classes = {
      order: 'type-order',
      message: 'type-message',
      user: 'type-user',
      system: 'type-system',
      review: 'type-review',
      campaign: 'type-campaign',
      security: 'type-security',
      blog: 'type-blog'
    };
    return classes[type] || 'type-default';
  };

  // ========== FILTER NOTIFICATIONS ==========
  const getFilteredNotifications = () => {
    let filtered = [...notifications];
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(notif => notif.type === filterType);
    }
    
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    
    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(indexOfFirstNotification, indexOfLastNotification);

  // ========== HANDLERS ==========
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDeleteSingle = (notificationId) => {
    setDeleteModal({ show: true, notificationId, multiple: false });
  };

  const handleDeleteSelected = () => {
    setDeleteModal({ show: true, notificationId: null, multiple: true });
  };

  const confirmDelete = () => {
    if (deleteModal.multiple) {
      setNotifications(prev => prev.filter(notif => !selectedNotifications.includes(notif.id)));
      showToast(`${selectedNotifications.length} bildiriş silindi`, 'success');
      setSelectedNotifications([]);
      setSelectAll(false);
      setBulkActionMode(false);
    } else {
      setNotifications(prev => prev.filter(notif => notif.id !== deleteModal.notificationId));
      showToast('Bildiriş silindi', 'success');
    }
    
    if (currentNotifications.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
    
    setDeleteModal({ show: false, notificationId: null, multiple: false });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, notificationId: null, multiple: false });
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Bildirişlər yeniləndi', 'info');
    }, 500);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setCurrentPage(1);
    showToast('Filtrlər təmizləndi', 'info');
  };

  const handleExport = () => {
    const exportData = filteredNotifications.map(notif => ({
      'ID': notif.id,
      'Başlıq': notif.title,
      'Mesaj': notif.message,
      'Tip': getTypeLabel(notif.type),
      'Tarix': notif.createdAt.toLocaleString('az-AZ')
    }));
    
    const headers = Object.keys(exportData[0] || {}).join(',');
    const rows = exportData.map(obj => Object.values(obj).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bildirisler_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`${exportData.length} bildiriş export edildi`, 'success');
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications([]);
      setSelectAll(false);
    } else {
      const allIds = currentNotifications.map(n => n.id);
      setSelectedNotifications(allIds);
      setSelectAll(true);
    }
  };

  const toggleSelectNotification = (id) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(prev => prev.filter(nId => nId !== id));
      setSelectAll(false);
    } else {
      setSelectedNotifications(prev => [...prev, id]);
      if (selectedNotifications.length + 1 === currentNotifications.length) {
        setSelectAll(true);
      }
    }
  };

  const handleViewDetails = (notification) => {
    setViewModal({ show: true, notification });
  };

  const closeViewModal = () => {
    setViewModal({ show: false, notification: null });
  };

  const typeOptions = [
    { value: 'all', label: 'Bütün tiplər' },
    { value: 'order', label: 'Sifarişlər' },
    { value: 'message', label: 'Mesajlar' },
    { value: 'user', label: 'İstifadəçilər' },
    { value: 'system', label: 'Sistem' },
    { value: 'review', label: 'Rəylər' },
    { value: 'campaign', label: 'Kampaniyalar' },
    { value: 'security', label: 'Təhlükəsizlik' },
    { value: 'blog', label: 'Bloq' }
  ];

  if (loading) {
    return (
      <div className="nc-container">
        <div className="nc-loading">
          <div className="nc-spinner"></div>
          <p>Bildirişlər yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nc-container">
      {/* TOAST BİLDİRİŞ */}
      {toast.show && (
        <div className={`nc-toast nc-toast-${toast.type}`}>
          <div className="nc-toast-content">
            {toast.type === 'success' && <FiCheckCircle size={18} />}
            {toast.type === 'info' && <FiInfo size={18} />}
            {toast.type === 'error' && <FiAlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
          <button className="nc-toast-close" onClick={() => setToast({ show: false, message: '', type: 'success' })}>
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="nc-header">
        <div>
          <h1 className="nc-title">Bildiriş Mərkəzi</h1>
          <p className="nc-subtitle">Bütün bildirişləri buradan idarə edin</p>
        </div>
        <div className="nc-header-actions">
          <button className="nc-action-btn nc-refresh-btn" onClick={handleRefresh}>
            <FiRefreshCw size={16} /> Yenilə
          </button>
          <button className="nc-action-btn nc-export-btn" onClick={handleExport}>
            <FiDownload size={16} /> Export
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="nc-stats">
        <div className="nc-stat-card">
          <div className="nc-stat-icon total">
            <FiBell size={22} />
          </div>
          <div className="nc-stat-info">
            <h3>{notifications.length}</h3>
            <p>Ümumi bildiriş</p>
          </div>
        </div>
        <div className="nc-stat-card">
          <div className="nc-stat-icon today">
            <FiClock size={22} />
          </div>
          <div className="nc-stat-info">
            <h3>{notifications.filter(n => {
              const today = new Date();
              return n.createdAt.toDateString() === today.toDateString();
            }).length}</h3>
            <p>Bu gün gələn</p>
          </div>
        </div>
      </div>

      {/* BULK ACTION BAR */}
      {bulkActionMode && selectedNotifications.length > 0 && (
        <div className="nc-bulk-bar">
          <span className="nc-bulk-count">{selectedNotifications.length} bildiriş seçilib</span>
          <div className="nc-bulk-actions">
            <button onClick={handleDeleteSelected} className="nc-bulk-btn nc-bulk-delete">
              <FiTrash2 size={14} /> Sil
            </button>
            <button onClick={() => { setBulkActionMode(false); setSelectedNotifications([]); setSelectAll(false); }} className="nc-bulk-btn">
              <FiX size={14} /> Ləğv et
            </button>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="nc-filters" ref={dropdownRef}>
        <div className="nc-search-wrapper">
          <FiSearch className="nc-search-icon" size={16} />
          <input
            type="text"
            placeholder="Axtarış (başlıq, mesaj)..."
            value={searchTerm}
            onChange={handleSearch}
            className="nc-search-input"
          />
          {searchTerm && (
            <FiX className="nc-clear-search" size={16} onClick={() => setSearchTerm('')} />
          )}
        </div>

        <div className="nc-filter-buttons">
          <div className="nc-filter-dropdown">
            <button 
              className={`nc-filter-btn ${filterType !== 'all' ? 'active' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
            >
              <FiFilter size={14} />
              <span>{typeOptions.find(t => t.value === filterType)?.label || 'Bütün tiplər'}</span>
              <FiChevronDown size={12} className={`nc-dropdown-arrow ${openDropdown === 'type' ? 'open' : ''}`} />
            </button>
            {openDropdown === 'type' && (
              <div className="nc-dropdown-menu">
                {typeOptions.map(option => (
                  <div 
                    key={option.value}
                    className={`nc-dropdown-item ${filterType === option.value ? 'selected' : ''}`}
                    onClick={() => { setFilterType(option.value); setOpenDropdown(null); setCurrentPage(1); }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {(searchTerm || filterType !== 'all') && (
            <button className="nc-filter-btn nc-clear-all" onClick={handleClearFilters}>
              <FiX size={14} /> Təmizlə
            </button>
          )}
        </div>
      </div>

      {/* RESULTS INFO */}
      <div className="nc-results-info">
        <p>Cəmi <strong>{filteredNotifications.length}</strong> bildiriş tapıldı</p>
        {filteredNotifications.length > 0 && (
          <div className="nc-results-right">
            <p className="nc-results-detail">Səhifə: {currentPage} / {totalPages}</p>
            <button 
              className="nc-bulk-mode-btn"
              onClick={() => setBulkActionMode(!bulkActionMode)}
            >
              <FiCheckCircle size={12} /> Kütləvi əməliyyatlar
            </button>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="nc-list-wrapper">
        {filteredNotifications.length === 0 ? (
          <div className="nc-no-data">
            <FiInbox size={48} />
            <p>Heç bir bildiriş tapılmadı</p>
            <button className="nc-clear-filters-btn" onClick={handleClearFilters}>
              Filtrləri təmizlə
            </button>
          </div>
        ) : (
          <div className="nc-list">
            {bulkActionMode && (
              <div className="nc-select-all-row">
                <label className="nc-select-all-label">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                  Hamısını seç
                </label>
              </div>
            )}
            {currentNotifications.map((notification) => (
              <div key={notification.id} className="nc-notification-item">
                {bulkActionMode && (
                  <div className="nc-item-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => toggleSelectNotification(notification.id)}
                    />
                  </div>
                )}
                
                <div className={`nc-item-icon ${getTypeClass(notification.type)}`}>
                  {getIconByType(notification.type)}
                </div>
                
                <div className="nc-item-content">
                  <div className="nc-item-header">
                    <div className="nc-item-title-wrapper">
                      <h4 className="nc-item-title">{notification.title}</h4>
                      <span className="nc-item-type">{getTypeLabel(notification.type)}</span>
                    </div>
                    <span className="nc-item-time">{formatTimeAgo(notification.createdAt)}</span>
                  </div>
                  <p className="nc-item-message">{notification.message}</p>
                </div>
                
                <div className="nc-item-actions">
                  <button 
                    className="nc-action-icon nc-view-btn" 
                    onClick={() => handleViewDetails(notification)}
                    title="Ətraflı bax"
                  >
                    <FiEye size={16} />
                  </button>
                  <button 
                    className="nc-action-icon nc-delete-btn" 
                    onClick={() => handleDeleteSingle(notification.id)}
                    title="Sil"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageParamName="page"
          scrollToTop={true}
        />
      )}

      {/* VIEW MODAL */}
      {viewModal.show && viewModal.notification && (
        <div className="nc-modal-overlay" onClick={closeViewModal}>
          <div className="nc-modal nc-view-modal" onClick={e => e.stopPropagation()}>
            <div className="nc-modal-header">
              <div className={`nc-modal-icon ${getTypeClass(viewModal.notification.type)}`}>
                {getIconByType(viewModal.notification.type)}
              </div>
              <h2>{viewModal.notification.title}</h2>
              <button className="nc-modal-close" onClick={closeViewModal}>
                <FiX size={18} />
              </button>
            </div>
            <div className="nc-modal-body">
              <div className="nc-modal-meta">
                <span className="nc-modal-type">{getTypeLabel(viewModal.notification.type)}</span>
                <span className="nc-modal-date">
                  {viewModal.notification.createdAt.toLocaleString('az-AZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="nc-modal-message">
                <label>Mesaj:</label>
                <div className="nc-modal-content">
                  {viewModal.notification.message}
                </div>
              </div>
              {viewModal.notification.actionUrl && (
                <div className="nc-modal-action">
                  <a href={viewModal.notification.actionUrl} className="nc-modal-link">
                    Ətraflı bax
                  </a>
                </div>
              )}
            </div>
            <div className="nc-modal-footer">
              <button className="nc-modal-btn secondary" onClick={closeViewModal}>
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal.show && (
        <div className="nc-modal-overlay" onClick={closeDeleteModal}>
          <div className="nc-modal nc-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="nc-modal-header">
              <h2>Bildirişi Sil</h2>
              <button className="nc-modal-close" onClick={closeDeleteModal}>
                <FiX size={18} />
              </button>
            </div>
            <div className="nc-modal-body">
              <FiAlertCircle size={40} className="nc-delete-icon" />
              <p className="nc-delete-warning">
                {deleteModal.multiple 
                  ? `${selectedNotifications.length} bildirişi silmək istədiyinizə əminsiniz?`
                  : 'Bu bildirişi silmək istədiyinizə əminsiniz?'
                }
              </p>
              <p className="nc-delete-note">
                Bu əməliyyat geri qaytarıla bilməz.
              </p>
            </div>
            <div className="nc-modal-footer">
              <button className="nc-modal-btn secondary" onClick={closeDeleteModal}>
                Ləğv et
              </button>
              <button className="nc-modal-btn danger" onClick={confirmDelete}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;