// src/pages/AdminPanel/components/MessageSection/MessageSection.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './MessageSection.css';
import Pagination from '../Pagination';
import { 
  FiSearch, FiFilter, FiDownload, FiPrinter, 
  FiEye, FiTrash2, FiX, FiCheck, FiClock, 
  FiAlertCircle, FiMail, FiCalendar, FiChevronDown, 
  FiRefreshCw, FiMessageSquare
} from 'react-icons/fi';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Token avtomatik əlavə et
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const MessageSection = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModal, setViewModal] = useState({ show: false, message: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, messageId: null });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({ unreadCount: 0, totalCount: 0, readCount: 0 });
  
  const dropdownRef = useRef(null);
  const messagesPerPage = 10;

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Mesajları yüklə
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', messagesPerPage);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      
      const response = await api.get(`/messages?${params.toString()}`);
      
      if (response.data.success) {
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg._id,
          name: msg.name,
          email: msg.email,
          phone: msg.phone,
          subject: msg.subject,
          message: msg.message,
          date: new Date(msg.createdAt).toISOString().split('T')[0],
          time: new Date(msg.createdAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
          status: msg.status,
          createdAt: msg.createdAt
        }));
        
        setMessages(formattedMessages);
        setPagination({
          page: response.data.pagination.page,
          pages: response.data.pagination.pages,
          total: response.data.pagination.total
        });
        setStats({
          unreadCount: response.data.stats.unreadCount,
          totalCount: response.data.stats.totalCount,
          readCount: response.data.stats.readCount
        });
      }
    } catch (error) {
      console.error('Mesajları yükləyərkən xəta:', error);
      showNotification(error.response?.data?.message || 'Mesajlar yüklənərkən xəta baş verdi', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, searchTerm]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ✅ Axtarış - hər simvol yazanda real-time axtarış
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Axtarış zamanı 1-ci səhifəyə qayıt
    // fetchMessages useEffect vasitəsilə avtomatik çağırılacaq
  };

  // ✅ Axtarışı təmizlə
  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Mesajı oxundu işarələ
  const markAsRead = async (messageId) => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      if (response.data.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        ));
        setStats(prev => ({
          ...prev,
          unreadCount: prev.unreadCount - 1,
          readCount: prev.readCount + 1
        }));
        showNotification('Mesaj oxundu olaraq işarələndi', 'info');
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Xəta baş verdi', 'error');
    }
  };

  // Bütün mesajları oxundu işarələ
  const markAllAsRead = async () => {
    try {
      const response = await api.put('/messages/read-all');
      if (response.data.success) {
        await fetchMessages();
        showNotification(response.data.message, 'info');
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Xəta baş verdi', 'error');
    }
  };

  // Mesajı sil
  const deleteMessage = async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      if (response.data.success) {
        const newMessages = messages.filter(msg => msg.id !== messageId);
        setMessages(newMessages);
        
        if (newMessages.length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          await fetchMessages();
        }
        showNotification('Mesaj uğurla silindi', 'success');
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Silinərkən xəta baş verdi', 'error');
    }
  };

  // Export CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', 1000);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      
      const response = await api.get(`/messages?${params.toString()}`);
      const exportData = response.data.messages;
      
      const csvData = exportData.map(msg => ({
        'ID': msg._id,
        'Ad Soyad': msg.name,
        'Email': msg.email,
        'Telefon': msg.phone,
        'Mövzu': msg.subject,
        'Mesaj': msg.message,
        'Tarix': new Date(msg.createdAt).toLocaleDateString('az-AZ'),
        'Saat': new Date(msg.createdAt).toLocaleTimeString('az-AZ'),
        'Status': msg.status === 'read' ? 'Oxundu' : 'Oxunmadı'
      }));
      
      if (csvData.length === 0) {
        showNotification('Export ediləcək məlumat yoxdur', 'error');
        return;
      }
      
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(obj => Object.values(obj).map(val => 
        typeof val === 'string' && (val.includes(',') || val.includes('"')) ? `"${val.replace(/"/g, '""')}"` : val
      ).join(','));
      const csv = [headers, ...rows].join('\n');
      
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mesajlar_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification(`${exportData.length} mesaj export edildi!`, 'success');
    } catch (error) {
      showNotification('Export edilərkən xəta baş verdi', 'error');
    }
  };

  const handleViewMessage = (message) => {
    if (message.status === 'unread') {
      markAsRead(message.id);
      message.status = 'read';
    }
    setViewModal({ show: true, message });
  };

  const closeViewModal = () => {
    setViewModal({ show: false, message: null });
  };

  const handleDeleteClick = (messageId) => {
    setDeleteModal({ show: true, messageId });
  };

  const confirmDelete = () => {
    deleteMessage(deleteModal.messageId);
    setDeleteModal({ show: false, messageId: null });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, messageId: null });
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchTerm('');
    setFilterStatus('all');
    fetchMessages();
    showNotification('Məlumatlar yeniləndi', 'info');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setCurrentPage(1);
    showNotification('Filtrlər təmizləndi', 'info');
  };

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'read') {
      return <span className="msg-status-badge msg-status-read"><FiCheck /> Oxundu</span>;
    }
    return <span className="msg-status-badge msg-status-unread"><FiClock /> Oxunmadı</span>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dünən';
    } else {
      return date.toLocaleDateString('az-AZ');
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="msg-container">
        <div className="msg-loading">
          <div className="msg-spinner"></div>
          <p>Mesajlar yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-container">
      {notification.show && (
        <div className={`msg-notification msg-notification-${notification.type}`}>
          <div className="msg-notification-content">
            {notification.type === 'success' && <FiCheck />}
            {notification.type === 'info' && <FiClock />}
            {notification.type === 'error' && <FiAlertCircle />}
            <span>{notification.message}</span>
          </div>
          <button className="msg-notification-close" onClick={() => setNotification({ show: false })}>
            <FiX />
          </button>
        </div>
      )}

      <div className="msg-header">
        <div>
          <h1 className="msg-title">Mesajlar</h1>
          <p className="msg-subtitle">Müştərilərdən gələn mesajların idarə edilməsi</p>
        </div>
        <div className="msg-header-actions">
          <button className="msg-action-btn msg-refresh-btn" onClick={handleRefresh}>
            <FiRefreshCw /> Yenilə
          </button>
          <button className="msg-action-btn msg-export-btn" onClick={handleExport}>
            <FiDownload /> Export
          </button>
          <button className="msg-action-btn msg-print-btn" onClick={() => window.print()}>
            <FiPrinter /> Çap et
          </button>
        </div>
      </div>

      <div className="msg-stats">
        <div className="msg-stat-card">
          <div className="stat-icon stat-total">
            <FiMail />
          </div>
          <div className="stat-info">
            <h3>{stats.totalCount}</h3>
            <p>Ümumi mesaj</p>
          </div>
        </div>
        <div className="msg-stat-card">
          <div className="stat-icon stat-unread">
            <FiClock />
          </div>
          <div className="stat-info">
            <h3>{stats.unreadCount}</h3>
            <p>Oxunmamış</p>
          </div>
        </div>
        <div className="msg-stat-card">
          <div className="stat-icon stat-today">
            <FiCalendar />
          </div>
          <div className="stat-info">
            <h3>{messages.filter(m => formatDate(m.date) === 'Bugün').length}</h3>
            <p>Bu gün gələn</p>
          </div>
        </div>
      </div>

      <div className="msg-filters" ref={dropdownRef}>
        <div className="msg-search-wrapper">
          <FiSearch className="msg-search-icon" />
          <input
            type="text"
            placeholder="Axtarış (ad, email, telefon, mesaj)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="msg-search-input"
          />
          {searchTerm && (
            <FiX className="msg-clear-search" onClick={handleClearSearch} />
          )}
        </div>

        <div className="msg-filter-buttons">
          <div className="msg-filter-dropdown">
            <button 
              className={`msg-filter-btn ${filterStatus !== 'all' ? 'active' : ''}`}
              onClick={() => toggleDropdown('status')}
            >
              <FiFilter />
              <span>
                {filterStatus === 'all' ? 'Bütün mesajlar' : 
                 filterStatus === 'read' ? 'Oxunanlar' : 'Oxunmayanlar'}
              </span>
              <FiChevronDown className={`msg-dropdown-arrow ${openDropdown === 'status' ? 'open' : ''}`} />
            </button>
            {openDropdown === 'status' && (
              <div className="msg-dropdown-menu">
                <div 
                  className={`msg-dropdown-item ${filterStatus === 'all' ? 'selected' : ''}`}
                  onClick={() => { setFilterStatus('all'); setOpenDropdown(null); setCurrentPage(1); }}
                >
                  Bütün mesajlar
                </div>
                <div 
                  className={`msg-dropdown-item ${filterStatus === 'read' ? 'selected' : ''}`}
                  onClick={() => { setFilterStatus('read'); setOpenDropdown(null); setCurrentPage(1); }}
                >
                  Oxunanlar
                </div>
                <div 
                  className={`msg-dropdown-item ${filterStatus === 'unread' ? 'selected' : ''}`}
                  onClick={() => { setFilterStatus('unread'); setOpenDropdown(null); setCurrentPage(1); }}
                >
                  Oxunmayanlar
                </div>
              </div>
            )}
          </div>

          {stats.unreadCount > 0 && (
            <button className="msg-action-btn msg-mark-read-all" onClick={markAllAsRead}>
              <FiCheck /> Hamısını oxundu işarələ
            </button>
          )}

          {(searchTerm || filterStatus !== 'all') && (
            <button className="msg-filter-btn msg-clear-all" onClick={clearFilters}>
              <FiX /> Təmizlə
            </button>
          )}
        </div>
      </div>

      <div className="msg-results-info">
        <p>Cəmi <strong>{pagination.total}</strong> mesaj tapıldı</p>
        {pagination.total > 0 && (
          <p className="msg-results-detail">Səhifə: {currentPage} / {pagination.pages}</p>
        )}
      </div>

      <div className="msg-table-wrapper">
        {messages.length === 0 ? (
          <div className="msg-no-data">
            <FiMessageSquare size={48} />
            <p>Heç bir mesaj tapılmadı</p>
            <button className="msg-clear-filters-btn" onClick={clearFilters}>
              Filtrləri təmizlə
            </button>
          </div>
        ) : (
          <table className="msg-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Göndərən</th>
                <th style={{ width: '200px' }}>Email</th>
                <th style={{ width: '350px' }}>Mesaj</th>
                <th style={{ width: '100px' }}>Tarix</th>
                <th style={{ width: '80px' }}>Saat</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '140px' }}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id} className={message.status === 'unread' ? 'msg-unread-row' : ''}>
                  <td className="msg-name-cell">
                    <span className="msg-sender-name">{message.name}</span>
                  </td>
                  <td className="msg-email-cell">{message.email}</td>
                  <td className="msg-preview-cell">
                    <span className="msg-preview-text" title={message.message}>
                      {message.message.length > 100 ? `${message.message.substring(0, 100)}...` : message.message}
                    </span>
                  </td>
                  <td className="msg-date-cell">{formatDate(message.date)}</td>
                  <td className="msg-time-cell">{message.time}</td>
                  <td className="msg-status-cell">{getStatusBadge(message.status)}</td>
                  <td className="msg-actions-cell">
                    <div className="msg-action-buttons">
                      <button 
                        className="msg-action-icon msg-view-btn" 
                        onClick={() => handleViewMessage(message)}
                        title="Mesaja bax"
                      >
                        <FiEye />
                      </button>
                      {message.status === 'unread' && (
                        <button 
                          className="msg-action-icon msg-mark-read-btn" 
                          onClick={() => markAsRead(message.id)}
                          title="Oxundu işarələ"
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button 
                        className="msg-action-icon msg-delete-btn" 
                        onClick={() => handleDeleteClick(message.id)}
                        title="Sil"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.pages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
          pageParamName="page"
          scrollToTop={true}
        />
      )}

      {/* View Modal */}
      {viewModal.show && (
        <div className="msg-modal-overlay" onClick={closeViewModal}>
          <div className="msg-modal msg-view-modal" onClick={e => e.stopPropagation()}>
            <div className="msg-modal-header">
              <h2>Mesaj Detalları</h2>
              <button className="msg-modal-close" onClick={closeViewModal}>
                <FiX />
              </button>
            </div>
            <div className="msg-modal-body">
              <div className="msg-detail-header">
                <div className="msg-detail-info">
                  <h3>{viewModal.message?.name}</h3>
                  <p>{viewModal.message?.email}</p>
                  <p className="msg-detail-phone">{viewModal.message?.phone}</p>
                </div>
                <div className="msg-detail-meta">
                  <span className="msg-detail-date">{viewModal.message?.date} {viewModal.message?.time}</span>
                  {getStatusBadge(viewModal.message?.status)}
                </div>
              </div>
              <div className="msg-detail-message">
                <label>Mesaj:</label>
                <div className="msg-detail-content">
                  {viewModal.message?.message}
                </div>
              </div>
            </div>
            <div className="msg-modal-footer">
              <button className="msg-modal-btn secondary" onClick={closeViewModal}>
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="msg-modal-overlay" onClick={closeDeleteModal}>
          <div className="msg-modal msg-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="msg-modal-header">
              <h2>Mesajı Sil</h2>
              <button className="msg-modal-close" onClick={closeDeleteModal}>
                <FiX />
              </button>
            </div>
            <div className="msg-modal-body">
              <FiAlertCircle size={48} className="delete-icon" />
              <p className="delete-warning">
                Bu mesajı silmək istədiyinizə əminsiniz?
              </p>
              <p className="delete-note">
                Bu əməliyyat geri qaytarıla bilməz.
              </p>
            </div>
            <div className="msg-modal-footer">
              <button className="msg-modal-btn secondary" onClick={closeDeleteModal}>
                Ləğv et
              </button>
              <button className="msg-modal-btn danger" onClick={confirmDelete}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSection;