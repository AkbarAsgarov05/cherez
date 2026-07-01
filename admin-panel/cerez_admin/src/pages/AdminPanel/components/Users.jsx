import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Users.css';
import Pagination from './Pagination';
import api from '../../../services/api';
import { 
  FiSearch, FiUser, FiMail, FiPhone, FiCalendar, 
  FiMoreVertical, FiEye, FiEdit, FiTrash2, FiX,
  FiCheck, FiClock, FiAlertCircle, FiUserCheck,
  FiUserX, FiFilter, FiDownload, FiRefreshCw,
  FiChevronLeft, FiKey
} from 'react-icons/fi';

const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, blocked: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModal, setViewModal] = useState({ show: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null });
  const [editModal, setEditModal] = useState({ show: false, user: null });
  const [statusModal, setStatusModal] = useState({ show: false, user: null });
  const [resetPasswordModal, setResetPasswordModal] = useState({ show: false, user: null, tempPassword: null });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  
  // ✅ YENİ - Email dəyişmə modalı üçün state
  const [emailChangeModal, setEmailChangeModal] = useState({ show: false, user: null, newEmail: '' });
  
  const usersPerPage = 20;

  // ========== HADİSƏ DİNLƏYİCİLƏRİ ==========
  useEffect(() => {
    const handleOrderCompleted = async (event) => {
      console.log('📢 orderCompleted hadisəsi alındı:', event.detail);
      await fetchUsers();
      await fetchStats();
      showNotification('Sifariş tamamlandı, istifadəçi xərci yeniləndi!', 'info');
    };
    
    const handleOrderStatusChanged = async () => {
      console.log('📢 orderStatusChanged hadisəsi alındı');
      await fetchUsers();
      await fetchStats();
    };
    
    window.addEventListener('orderCompleted', handleOrderCompleted);
    window.addEventListener('orderStatusChanged', handleOrderStatusChanged);
    
    return () => {
      window.removeEventListener('orderCompleted', handleOrderCompleted);
      window.removeEventListener('orderStatusChanged', handleOrderStatusChanged);
    };
  }, []);

  // URL-dən filter parametrlərini oxu
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl && ['active', 'inactive', 'blocked'].includes(statusFromUrl)) {
      setFilterStatus(statusFromUrl);
    }
  }, []);

  // ========== FƏTCH FUNKSİYALARI ==========
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      params.page = 1;
      params.limit = 1000;
      
      const response = await api.get('/users', { params });
      
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('İstifadəçilər yüklənərkən xəta:', error);
      showNotification('İstifadəçilər yüklənərkən xəta baş verdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterStatus]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/stats/all');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Statistika yüklənərkən xəta:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // ========== LOCAL FILTER FUNKSIYASI ==========
  const getFilteredUsers = () => {
    let filtered = [...users];
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.phone.includes(term)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }
    
    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // ========== AXTARIŞ ==========
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setOpenDropdown(null);
    
    const newParams = new URLSearchParams();
    if (status !== 'all') newParams.set('status', status);
    setSearchParams(newParams, { replace: true });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewUser = (user) => {
    setViewModal({ show: true, user });
  };

  // ✅ DÜZƏLDİLDİ - Email inputu redaktə modalından ÇIXARILDI
  const handleEditUser = (user) => {
    setEditModal({ show: true, user: { ...user } });
  };

  const handleEditChange = (field, value) => {
    setEditModal({
      ...editModal,
      user: {
        ...editModal.user,
        [field]: value
      }
    });
  };

  // ✅ DÜZƏLDİLDİ - Email göndərilmir
  const saveEdit = async () => {
    try {
      const response = await api.put(`/users/${editModal.user.id}`, {
        name: editModal.user.name,
        phone: editModal.user.phone,
        status: editModal.user.status
      });
      
      if (response.data.success) {
        setUsers(prev => prev.map(user => 
          user.id === editModal.user.id ? editModal.user : user
        ));
        await fetchStats();
        setEditModal({ show: false, user: null });
        showNotification('İstifadəçi məlumatları uğurla yeniləndi!', 'success');
      }
    } catch (error) {
      console.error("Yenilənərkən xəta:", error);
      showNotification("Məlumatlar yenilənərkən xəta baş verdi", "error");
    }
  };

  const handleDeleteClick = (userId) => {
    setDeleteModal({ show: true, userId });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${deleteModal.userId}`);
      
      setUsers(prev => prev.filter(user => user.id !== deleteModal.userId));
      if (filteredUsers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      await fetchStats();
      
      setDeleteModal({ show: false, userId: null });
      showNotification('İstifadəçi uğurla silindi!', 'success');
    } catch (error) {
      console.error("Silinərkən xəta:", error);
      showNotification("İstifadəçi silinərkən xəta baş verdi", "error");
    }
  };

  const handleStatusModalOpen = (user) => {
    setStatusModal({ show: true, user: { ...user } });
  };

  const handleStatusSelect = async (newStatus) => {
    try {
      const response = await api.patch(`/users/${statusModal.user.id}/status`, { 
        status: newStatus 
      });
      
      if (response.data.success) {
        setUsers(prev => prev.map(user => 
          user.id === statusModal.user.id ? { ...user, status: newStatus } : user
        ));
        
        await fetchStats();
        
        setStatusModal({ show: false, user: null });
        showNotification(`İstifadəçi statusu "${newStatus === 'active' ? 'Aktiv' : newStatus === 'inactive' ? 'Deaktiv' : 'Bloklanmış'}" olaraq dəyişdirildi!`, 'success');
      }
    } catch (error) {
      console.error("Status dəyişərkən xəta:", error);
      showNotification("Status dəyişdirilərkən xəta baş verdi", "error");
    }
  };

  const closeStatusModal = () => {
    setStatusModal({ show: false, user: null });
  };

  const handleResetPassword = async (user) => {
    try {
      const response = await api.post(`/users/${user.id}/reset-password`);
      
      if (response.data.success) {
        setResetPasswordModal({
          show: true,
          user: user,
          tempPassword: response.data.tempPassword
        });
        showNotification(`${user.name} üçün şifrə sıfırlandı!`, 'success');
      }
    } catch (error) {
      console.error("Şifrə sıfırlanarkən xəta:", error);
      showNotification("Şifrə sıfırlanarkən xəta baş verdi", "error");
    }
  };

  const closeResetPasswordModal = () => {
    setResetPasswordModal({ show: false, user: null, tempPassword: null });
  };

  // ========== ✅ YENİ - EMAİL DƏYİŞMƏ FUNKSİYASI ==========
  const handleRequestEmailChange = async () => {
    try {
      const response = await api.post(`/users/${emailChangeModal.user.id}/request-email-change`, {
        newEmail: emailChangeModal.newEmail
      });
      
      if (response.data.success) {
        showNotification(response.data.message, 'success');
        setEmailChangeModal({ show: false, user: null, newEmail: '' });
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Xəta baş verdi', 'error');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showNotification('Şifrə kopyalandı!', 'success');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Şifrə kopyalandı!', 'success');
      }
    } catch (err) {
      console.error('Kopyalama xətası:', err);
      showNotification('Şifrə kopyalanarkən xəta baş verdi', 'error');
    }
  };

  const handleRefresh = async () => {
    await fetchUsers();
    await fetchStats();
    showNotification('Məlumatlar yeniləndi!', 'info');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
    showNotification('Filtrlər təmizləndi!', 'info');
  };

  const handleExport = () => {
    const exportData = filteredUsers.map(user => ({
      'ID': user.id,
      'Ad Soyad': user.name,
      'Email': user.email,
      'Telefon': user.phone,
      'Qeydiyyat tarixi': user.registerDate,
      'Status': user.status === 'active' ? 'Aktiv' : user.status === 'inactive' ? 'Deaktiv' : 'Bloklanmış',
      'Sifariş sayı': user.orders,
      'Ümumi xərc': `${user.totalSpent} AZN`
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
    link.setAttribute('download', `istifadeciler_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification(`${exportData.length} istifadəçi export edildi!`, 'success');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="users-status-badge users-status-active">Aktiv</span>;
      case 'inactive':
        return <span className="users-status-badge users-status-inactive">Deaktiv</span>;
      case 'blocked':
        return <span className="users-status-badge users-status-blocked">Bloklanmış</span>;
      default:
        return <span className="users-status-badge">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ');
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="users-loading">
          <div className="users-spinner"></div>
          <p className="users-loading-text">İstifadəçilər yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      {/* Bildiriş */}
      {notification.show && (
        <div className={`users-notification users-notification-${notification.type}`}>
          <div className="users-notification-content">
            {notification.type === 'success' && <FiCheck />}
            {notification.type === 'info' && <FiClock />}
            {notification.type === 'error' && <FiAlertCircle />}
            <span>{notification.message}</span>
          </div>
          <button className="users-notification-close" onClick={() => setNotification({ show: false, message: '', type: 'success' })}>
            <FiX />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="users-header">
        <div>
          <h1 className="users-title">İstifadəçilər</h1>
          <p className="users-subtitle">Sistemdə qeydiyyatdan keçən istifadəçilərin idarə edilməsi</p>
        </div>
        <div className="users-header-actions">
          <button className="users-action-btn users-refresh-btn" onClick={handleRefresh}>
            <FiRefreshCw /> Yenilə
          </button>
          <button className="users-action-btn users-export-btn" onClick={handleExport}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="users-stats">
        <div className="users-stat-card">
          <div className="stat-icon stat-total"><FiUser /></div>
          <div className="stat-info"><h3>{stats.total}</h3><p>Ümumi istifadəçi</p></div>
        </div>
        <div className="users-stat-card">
          <div className="stat-icon stat-active"><FiUserCheck /></div>
          <div className="stat-info"><h3>{stats.active}</h3><p>Aktiv istifadəçi</p></div>
        </div>
        <div className="users-stat-card">
          <div className="stat-icon stat-inactive"><FiClock /></div>
          <div className="stat-info"><h3>{stats.inactive}</h3><p>Deaktiv istifadəçi</p></div>
        </div>
        <div className="users-stat-card">
          <div className="stat-icon stat-blocked"><FiUserX /></div>
          <div className="stat-info"><h3>{stats.blocked}</h3><p>Bloklanmış istifadəçi</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="users-filters" ref={dropdownRef}>
        <div className="users-search-wrapper">
          <FiSearch className="users-search-icon" />
          <input type="text" placeholder="Axtarış (ad, email, telefon)..." value={searchTerm} onChange={handleSearch} className="users-search-input" />
          {searchTerm && <FiX className="users-clear-search" onClick={() => { setSearchTerm(''); setCurrentPage(1); }} />}
        </div>

        <div className="users-filter-buttons">
          <div className="users-filter-dropdown">
            <button className={`users-filter-btn ${filterStatus !== 'all' ? 'active' : ''}`} onClick={() => toggleDropdown('status')}>
              <FiFilter />
              <span>{filterStatus === 'all' ? 'Bütün statuslar' : filterStatus === 'active' ? 'Aktiv' : filterStatus === 'inactive' ? 'Deaktiv' : 'Bloklanmış'}</span>
              <FiChevronLeft className={`users-dropdown-arrow ${openDropdown === 'status' ? 'open' : ''}`} />
            </button>
            {openDropdown === 'status' && (
              <div className="users-dropdown-menu">
                <div className={`users-dropdown-item ${filterStatus === 'all' ? 'selected' : ''}`} onClick={() => handleFilterChange('all')}>Bütün statuslar</div>
                <div className={`users-dropdown-item ${filterStatus === 'active' ? 'selected' : ''}`} onClick={() => handleFilterChange('active')}>Aktiv</div>
                <div className={`users-dropdown-item ${filterStatus === 'inactive' ? 'selected' : ''}`} onClick={() => handleFilterChange('inactive')}>Deaktiv</div>
                <div className={`users-dropdown-item ${filterStatus === 'blocked' ? 'selected' : ''}`} onClick={() => handleFilterChange('blocked')}>Bloklanmış</div>
              </div>
            )}
          </div>

          {(searchTerm || filterStatus !== 'all') && (
            <button className="users-filter-btn users-clear-all" onClick={clearFilters}><FiX /> Təmizlə</button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="users-results-info">
        <p>Cəmi <strong>{filteredUsers.length}</strong> istifadəçi tapıldı</p>
        {filteredUsers.length > 0 && <p className="users-results-detail">Səhifə: {currentPage} / {totalPages}</p>}
      </div>

      {/* Users Table */}
      <div className="users-table-wrapper">
        {filteredUsers.length === 0 ? (
          <div className="users-no-data">
            <FiUser size={48} />
            <p>Heç bir istifadəçi tapılmadı</p>
            <button className="users-clear-filters-btn" onClick={clearFilters}>Filtrləri təmizlə</button>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th className="users-th-center">#</th>
                <th className="users-th-left">Ad Soyad</th>
                <th className="users-th-left">Email</th>
                <th className="users-th-left">Telefon</th>
                <th className="users-th-center">Qeydiyyat tarixi</th>
                <th className="users-th-center">Status</th>
                <th className="users-th-center">Sifariş sayı</th>
                <th className="users-th-center">Ümumi xərc</th>
                <th className="users-th-center">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user, index) => (
                <tr key={user.id}>
                  <td className="users-index">{(currentPage - 1) * usersPerPage + index + 1}</td>
                  <td className="users-name-cell">
                    <div className="users-avatar">
                      {user.avatar ? <img src={user.avatar} alt={user.name} /> : <div className="avatar-placeholder">{user.name.charAt(0).toUpperCase()}</div>}
                    </div>
                    <span className="user-name-text" title={user.name}>{user.name}</span>
                  </td>
                  <td className="users-email-cell"><span className="user-email-text" title={user.email}>{user.email}</span></td>
                  <td className="users-phone-cell"><span className="user-phone-text">{user.phone}</span></td>
                  <td className="users-date-cell">{formatDate(user.registerDate)}</td>
                  <td className="users-status-cell">{getStatusBadge(user.status)}</td>
                  <td className="users-orders-count">{user.orders}</td>
                  <td className="users-spent">₼{user.totalSpent.toFixed(2)}</td>
                  <td className="users-actions-cell">
                    <div className="users-action-buttons">
                      <button className="users-action-btn users-view-btn" onClick={() => handleViewUser(user)} title="Bax"><FiEye /></button>
                      <button className="users-action-btn users-edit-btn" onClick={() => handleEditUser(user)} title="Redaktə et"><FiEdit /></button>
                      <button className="users-action-btn users-status-btn" onClick={() => handleStatusModalOpen(user)} title="Status dəyiş"><FiFilter /></button>
                      {/* ✅ YENİ - EMAİL DƏYİŞ DÜYMƏSİ */}
                      <button className="users-action-btn users-email-btn" onClick={() => setEmailChangeModal({ show: true, user, newEmail: '' })} title="Email dəyiş"><FiMail /></button>
                      <button className="users-action-btn users-reset-pwd-btn" onClick={() => handleResetPassword(user)} title="Şifrəni sıfırla"><FiKey /></button>
                      <button className="users-action-btn users-delete-btn" onClick={() => handleDeleteClick(user.id)} title="Sil"><FiTrash2 /></button>
                    </div>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="page" scrollToTop={true} />}

      {/* View Modal */}
      {viewModal.show && (
        <div className="users-modal-overlay" onClick={() => setViewModal({ show: false, user: null })}>
          <div className="users-modal users-view-modal" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header"><h2>İstifadəçi Məlumatları</h2><button className="users-modal-close" onClick={() => setViewModal({ show: false, user: null })}><FiX /></button></div>
            <div className="users-modal-body">
              <div className="users-view-avatar">{viewModal.user?.avatar ? <img src={viewModal.user.avatar} alt={viewModal.user.name} /> : <div className="avatar-large">{viewModal.user?.name?.charAt(0).toUpperCase()}</div>}</div>
              <div className="users-view-info">
                <div className="info-row"><label>Ad Soyad:</label><span>{viewModal.user?.name}</span></div>
                <div className="info-row"><label>Email:</label><span>{viewModal.user?.email}</span></div>
                <div className="info-row"><label>Telefon:</label><span>{viewModal.user?.phone}</span></div>
                <div className="info-row"><label>Qeydiyyat tarixi:</label><span>{formatDate(viewModal.user?.registerDate)}</span></div>
                <div className="info-row"><label>Status:</label><span>{getStatusBadge(viewModal.user?.status)}</span></div>
                <div className="info-row"><label>Sifariş sayı:</label><span>{viewModal.user?.orders}</span></div>
                <div className="info-row"><label>Ümumi xərc:</label><span className="spent-amount">₼{viewModal.user?.totalSpent.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="users-modal-footer"><button className="users-modal-btn primary" onClick={() => setViewModal({ show: false, user: null })}>Bağla</button></div>
          </div>
        </div>
      )}

      {/* Edit Modal - EMAİL INPUTU ÇIXARILDI */}
      {editModal.show && (
        <div className="users-modal-overlay" onClick={() => setEditModal({ show: false, user: null })}>
          <div className="users-modal users-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header"><h2>İstifadəçini Redaktə Et</h2><button className="users-modal-close" onClick={() => setEditModal({ show: false, user: null })}><FiX /></button></div>
            <div className="users-modal-body">
              <div className="users-form-group"><label>Ad Soyad</label><input type="text" value={editModal.user?.name || ''} onChange={(e) => handleEditChange('name', e.target.value)} className="users-modal-input" placeholder="Ad Soyad" /></div>
              {/* ✅ EMAİL INPUTU SİLİNDİ */}
              <div className="users-form-group"><label>Telefon</label><input type="tel" value={editModal.user?.phone || ''} onChange={(e) => handleEditChange('phone', e.target.value)} className="users-modal-input" placeholder="Telefon" /></div>
            </div>
            <div className="users-modal-footer">
              <button className="users-modal-btn secondary" onClick={() => setEditModal({ show: false, user: null })}>Ləğv et</button>
              <button className="users-modal-btn primary" onClick={saveEdit}><FiCheck /> Yadda saxla</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal.show && (
        <div className="users-modal-overlay" onClick={closeStatusModal}>
          <div className="users-modal users-status-modal" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header"><h2>Status Dəyiş</h2><button className="users-modal-close" onClick={closeStatusModal}><FiX /></button></div>
            <div className="users-modal-body">
              <p className="users-status-info">İstifadəçi: <strong>{statusModal.user?.name}</strong></p>
              <p className="users-status-info">Cari status: {getStatusBadge(statusModal.user?.status)}</p>
              <div className="users-status-options">
                <button className={`users-status-option ${statusModal.user?.status === 'active' ? 'active' : ''}`} onClick={() => handleStatusSelect('active')}><FiCheck /> Aktiv</button>
                <button className={`users-status-option ${statusModal.user?.status === 'inactive' ? 'active' : ''}`} onClick={() => handleStatusSelect('inactive')}><FiClock /> Deaktiv</button>
                <button className={`users-status-option ${statusModal.user?.status === 'blocked' ? 'active' : ''}`} onClick={() => handleStatusSelect('blocked')}><FiUserX /> Blokla</button>
              </div>
            </div>
            <div className="users-modal-footer"><button className="users-modal-btn secondary" onClick={closeStatusModal}>Bağla</button></div>
          </div>
        </div>
      )}

      {/* ✅ YENİ - EMAİL DƏYİŞMƏ MODALI - DÜZƏLDİLDİ */}
      {emailChangeModal.show && (
        <div className="users-modal-overlay" onClick={() => setEmailChangeModal({ show: false, user: null, newEmail: '' })}>
          <div className="users-modal users-email-change-modal" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <h2>Email Dəyiş</h2>
              <button className="users-modal-close" onClick={() => setEmailChangeModal({ show: false, user: null, newEmail: '' })}>
                <FiX />
              </button>
            </div>
            <div className="users-modal-body">
              <p className="email-change-user-info">İstifadəçi: <strong>{emailChangeModal.user?.name}</strong></p>
              <p className="email-change-user-info">Cari email: <strong>{emailChangeModal.user?.email}</strong></p>
              <div className="users-form-group">
                <label className="email-change-label">Yeni email ünvanı</label>
                <input
                  type="email"
                  value={emailChangeModal.newEmail}
                  onChange={(e) => setEmailChangeModal(prev => ({ ...prev, newEmail: e.target.value }))}
                  placeholder="yeni@email.com"
                  className="users-modal-input"
                />
              </div>
              <p className="email-change-warning">
                ⚠️ Yeni emailə təsdiq linki göndəriləcək. İstifadəçi təsdiq etdikdən sonra email dəyişəcək.
              </p>
            </div>
            <div className="users-modal-footer">
              <button className="users-modal-btn secondary" onClick={() => setEmailChangeModal({ show: false, user: null, newEmail: '' })}>Ləğv et</button>
              <button className="users-modal-btn primary" onClick={handleRequestEmailChange}>Təsdiq linki göndər</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal.show && (
        <div className="users-modal-overlay" onClick={closeResetPasswordModal}>
          <div className="users-modal users-reset-password-modal" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header"><h2>Şifrə Sıfırlandı</h2><button className="users-modal-close" onClick={closeResetPasswordModal}><FiX /></button></div>
            <div className="users-modal-body">
              <FiKey size={48} className="reset-password-icon" />
              <p className="reset-password-warning"><strong>{resetPasswordModal.user?.name}</strong> üçün şifrə sıfırlandı!</p>
              <div className="temp-password-box">
                <label>Müvəqqəti şifrə:</label>
                <div className="temp-password-value">
                  <code>{resetPasswordModal.tempPassword}</code>
                  <button className="copy-password-btn" onClick={() => copyToClipboard(resetPasswordModal.tempPassword)}>Kopyala</button>
                </div>
              </div>
              <p className="reset-password-note">⚠️ Bu şifrəni istifadəçiyə göndərin. İstifadəçi daxil olduqdan sonra şifrəsini dəyişə bilər.</p>
            </div>
            <div className="users-modal-footer"><button className="users-modal-btn primary" onClick={closeResetPasswordModal}>Bağla</button></div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="users-modal-overlay" onClick={() => setDeleteModal({ show: false, userId: null })}>
          <div className="users-modal users-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header"><h2>İstifadəçini Sil</h2><button className="users-modal-close" onClick={() => setDeleteModal({ show: false, userId: null })}><FiX /></button></div>
            <div className="users-modal-body">
              <FiAlertCircle size={48} className="delete-icon" />
              <p className="delete-warning">Bu istifadəçini silmək istədiyinizə əminsiniz?</p>
              <p className="delete-note">Bu əməliyyat geri qaytarıla bilməz.</p>
            </div>
            <div className="users-modal-footer">
              <button className="users-modal-btn secondary" onClick={() => setDeleteModal({ show: false, userId: null })}>Ləğv et</button>
              <button className="users-modal-btn danger" onClick={confirmDelete}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;