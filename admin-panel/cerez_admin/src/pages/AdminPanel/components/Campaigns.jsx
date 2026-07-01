import React, { useState, useRef, useEffect } from 'react';
import './Campaigns.css';
import Pagination from './Pagination';

// ✅ API URL - Environment variable ilə
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Campaigns = () => {
  // ========== STATE LƏR ==========
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [campaignToEnd, setCampaignToEnd] = useState(null);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const [isDiscountDropdownOpen, setIsDiscountDropdownOpen] = useState(false);
  const [isApplyToDropdownOpen, setIsApplyToDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  
  const discountDropdownRef = useRef(null);
  const applyToDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  
  const [customProduct, setCustomProduct] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 10;
  
  const [campaigns, setCampaigns] = useState([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const CLOUDINARY_CLOUD_NAME = 'dgqbzlqey';
  const CLOUDINARY_UPLOAD_PRESET = 'admin_uploads';
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    status: 'active',
    applyTo: 'all',
    products: [],
    banner: '',
    promoCode: '',
    usageLimit: '',
    hasPromoCode: false
  });

  const discountTypes = [
    { value: 'percentage', label: 'Faiz endirimi (%)', icon: 'fa-percent', description: 'Məhsul qiymətinə faizlə endirim' },
    { value: 'fixed', label: 'Sabit məbləğ (AZN)', icon: 'fa-money-bill-wave', description: 'Məhsul qiymətindən sabit məbləğ endirimi' }
  ];

  const applyToOptions = [
    { value: 'all', label: 'Bütün məhsullar', icon: 'fa-boxes', description: 'Bütün məhsullara eyni endirim tətbiq olunur' },
    { value: 'products', label: 'Məhsullar', icon: 'fa-cube', description: 'Yalnız seçilmiş məhsullara endirim' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Aktiv', icon: 'fa-check-circle', description: 'Kampaniya aktiv və istifadə edilə bilər' },
    { value: 'inactive', label: 'Deaktiv', icon: 'fa-pause-circle', description: 'Kampaniya müvəqqəti dayandırılıb' }
  ];

  const getAuthToken = () => {
    let token = localStorage.getItem('token');
    if (token === 'undefined' || token === 'null') {
      localStorage.removeItem('token');
      token = null;
    }
    if (!token) {
      token = sessionStorage.getItem('token');
      if (token === 'undefined' || token === 'null') {
        sessionStorage.removeItem('token');
        token = null;
      }
    }
    return token;
  };

  // ✅ DÜZƏLDİ - API_URL istifadə edir
  const loginAndGetToken = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
      });
      const data = await response.json();
      const token = data.token || data.accessToken;
      if (token) {
        localStorage.setItem('token', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Login xətası:', error);
      return null;
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let token = getAuthToken();
      
      if (!token) {
        token = await loginAndGetToken();
      }
      
      if (!token) {
        throw new Error('Token tapılmadı');
      }
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: campaignsPerPage,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`${API_URL}/campaigns?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        token = await loginAndGetToken();
        if (token) {
          const retryResponse = await fetch(`${API_URL}/campaigns?${params}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          if (!retryResponse.ok) throw new Error('Kampaniyalar yüklənərkən xəta baş verdi');
          const data = await retryResponse.json();
          setCampaigns(data.campaigns || []);
          setTotalCampaigns(data.total || 0);
          setTotalPages(data.totalPages || 1);
          return;
        }
      }
      
      if (!response.ok) {
        throw new Error('Kampaniyalar yüklənərkən xəta baş verdi');
      }
      
      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setTotalCampaigns(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/products?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableProducts(data.products || []);
      }
    } catch (err) {
      console.error('Products fetch error:', err);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Yalnız şəkil faylları (JPEG, PNG, GIF, WEBP) yüklənə bilər!');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Şəkil ölçüsü 5MB-dan böyük ola bilməz!');
      return;
    }
    
    setUploadingBanner(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'campaigns');
      
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Şəkil yüklənə bilmədi');
      }
      
      const data = await response.json();
      setNewCampaign({ ...newCampaign, banner: data.secure_url });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Şəkil yüklənərkən xəta baş verdi: ' + error.message);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleRemoveBanner = () => {
    setNewCampaign({ ...newCampaign, banner: '' });
  };

  const handleCreateCampaign = async () => {
    setIsSubmitting(true);
    try {
      let token = getAuthToken();
      if (!token) {
        token = await loginAndGetToken();
      }
      
      const campaignData = {
        name: newCampaign.name,
        description: newCampaign.description,
        discountType: newCampaign.discountType,
        discountValue: parseFloat(newCampaign.discountValue),
        startDate: newCampaign.startDate,
        endDate: newCampaign.endDate,
        status: newCampaign.status,
        applyTo: newCampaign.applyTo,
        products: newCampaign.products,
        banner: newCampaign.banner,
        promoCode: newCampaign.hasPromoCode ? newCampaign.promoCode : null,
        usageLimit: newCampaign.hasPromoCode && newCampaign.usageLimit ? parseInt(newCampaign.usageLimit) : null
      };
      
      const response = await fetch(`${API_URL}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kampaniya yaradılmadı');
      }
      
      await fetchCampaigns();
      closeCreateModal();
    } catch (err) {
      console.error('Create error:', err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCampaign = async () => {
    setIsSubmitting(true);
    try {
      let token = getAuthToken();
      if (!token) {
        token = await loginAndGetToken();
      }
      
      const campaignData = {
        name: newCampaign.name,
        description: newCampaign.description,
        discountType: newCampaign.discountType,
        discountValue: parseFloat(newCampaign.discountValue),
        startDate: newCampaign.startDate,
        endDate: newCampaign.endDate,
        status: newCampaign.status,
        applyTo: newCampaign.applyTo,
        products: newCampaign.products,
        banner: newCampaign.banner,
        promoCode: newCampaign.hasPromoCode ? newCampaign.promoCode : null,
        usageLimit: newCampaign.hasPromoCode && newCampaign.usageLimit ? parseInt(newCampaign.usageLimit) : null
      };
      
      const response = await fetch(`${API_URL}/campaigns/${selectedCampaign._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kampaniya yenilənmədi');
      }
      
      await fetchCampaigns();
      closeCreateModal();
    } catch (err) {
      console.error('Update error:', err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    
    setIsDeleting(true);
    try {
      let token = getAuthToken();
      if (!token) token = await loginAndGetToken();
      
      const response = await fetch(`${API_URL}/campaigns/${campaignToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Silinmə əməliyyatı uğursuz oldu');
      }
      
      await fetchCampaigns();
      setShowDeleteConfirmModal(false);
      setCampaignToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setIsTogglingStatus(id);
    try {
      let token = getAuthToken();
      if (!token) token = await loginAndGetToken();
      
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`${API_URL}/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Status dəyişdirilə bilmədi');
      }
      
      await fetchCampaigns();
    } catch (err) {
      console.error('Status change error:', err);
      alert(err.message);
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const handleEndNow = async () => {
    if (!campaignToEnd) return;
    
    setIsEnding(true);
    try {
      let token = getAuthToken();
      if (!token) token = await loginAndGetToken();
      
      const response = await fetch(`${API_URL}/campaigns/${campaignToEnd}/end-now`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Kampaniya bitirilə bilmədi');
      }
      
      await fetchCampaigns();
      setShowEndConfirmModal(false);
      setCampaignToEnd(null);
    } catch (err) {
      console.error('End now error:', err);
      alert(err.message);
    } finally {
      setIsEnding(false);
    }
  };

  const handleAddProduct = () => {
    if (customProduct.trim() && !newCampaign.products.includes(customProduct.trim())) {
      setNewCampaign({
        ...newCampaign,
        products: [...newCampaign.products, customProduct.trim()]
      });
      setCustomProduct('');
    }
  };

  const handleRemoveProduct = (productToRemove) => {
    setNewCampaign({
      ...newCampaign,
      products: newCampaign.products.filter(p => p !== productToRemove)
    });
  };

  const handleProductKeyPress = (e) => {
    if (e.key === 'Enter' && customProduct.trim()) {
      e.preventDefault();
      handleAddProduct();
    }
  };

  const openCreateModal = () => {
    setSelectedCampaign(null);
    setNewCampaign({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      status: 'active',
      applyTo: 'all',
      products: [],
      banner: '',
      promoCode: '',
      usageLimit: '',
      hasPromoCode: false
    });
    setShowCreateModal(true);
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setNewCampaign({
      name: campaign.name,
      description: campaign.description || '',
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
      status: campaign.status,
      applyTo: campaign.applyTo,
      products: campaign.products?.map(p => typeof p === 'object' ? p.name : p) || [],
      banner: campaign.banner || '',
      promoCode: campaign.promoCode || '',
      usageLimit: campaign.usageLimit || '',
      hasPromoCode: !!campaign.promoCode
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSelectedCampaign(null);
    setCustomProduct('');
  };

  const openEndConfirmModal = (id) => {
    setCampaignToEnd(id);
    setShowEndConfirmModal(true);
  };

  const closeEndModal = () => {
    setShowEndConfirmModal(false);
    setCampaignToEnd(null);
  };

  const openDeleteConfirmModal = (id) => {
    setCampaignToDelete(id);
    setShowDeleteConfirmModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteConfirmModal(false);
    setCampaignToDelete(null);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="status-badge active">Aktiv</span>;
      case 'inactive': return <span className="status-badge inactive">Deaktiv</span>;
      case 'completed': return <span className="status-badge completed">Bitmiş</span>;
      default: return null;
    }
  };

  const getDiscountDisplay = (campaign) => {
    if (campaign.discountType === 'percentage') {
      return `${campaign.discountValue}%`;
    } else {
      return `${campaign.discountValue} AZN`;
    }
  };

  const getSelectedDiscountLabel = () => {
    const selected = discountTypes.find(type => type.value === newCampaign.discountType);
    return selected ? selected.label : 'Endirim növü seçin';
  };

  const getSelectedApplyToLabel = () => {
    const selected = applyToOptions.find(opt => opt.value === newCampaign.applyTo);
    return selected ? selected.label : 'Tətbiq sahəsi seçin';
  };

  const getSelectedStatusLabel = () => {
    const selected = statusOptions.find(opt => opt.value === newCampaign.status);
    return selected ? selected.label : 'Status seçin';
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleFilterStatusChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectDiscountType = (value) => {
    setNewCampaign({...newCampaign, discountType: value});
    setIsDiscountDropdownOpen(false);
  };

  const handleSelectApplyTo = (value) => {
    setNewCampaign({...newCampaign, applyTo: value, products: []});
    setIsApplyToDropdownOpen(false);
  };

  const handleSelectStatus = (value) => {
    setNewCampaign({...newCampaign, status: value});
    setIsStatusDropdownOpen(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [currentPage, filterStatus, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (discountDropdownRef.current && !discountDropdownRef.current.contains(event.target)) {
        setIsDiscountDropdownOpen(false);
      }
      if (applyToDropdownRef.current && !applyToDropdownRef.current.contains(event.target)) {
        setIsApplyToDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <h1>Kampaniyalar</h1>
        <button type="button" className="create-button" onClick={openCreateModal}>
          <i className="fas fa-plus"></i>
          Yeni Kampaniya
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Kampaniya axtar..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoComplete="off"
          />
          {searchTerm && (
            <button type="button" className="search-clear" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="status-filters">
          <button className={filterStatus === 'all' ? 'active' : ''} onClick={() => handleFilterStatusChange('all')}>
            Hamısı ({totalCampaigns})
          </button>
          <button className={filterStatus === 'active' ? 'active' : ''} onClick={() => handleFilterStatusChange('active')}>
            Aktiv ({campaigns.filter(c => c.status === 'active').length})
          </button>
          <button className={filterStatus === 'inactive' ? 'active' : ''} onClick={() => handleFilterStatusChange('inactive')}>
            Deaktiv ({campaigns.filter(c => c.status === 'inactive').length})
          </button>
          <button className={filterStatus === 'completed' ? 'active' : ''} onClick={() => handleFilterStatusChange('completed')}>
            Bitmiş ({campaigns.filter(c => c.status === 'completed').length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Yüklənir...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={fetchCampaigns}>Yenidən cəhd et</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {searchTerm && (
            <div className="search-results-info">
              <p><i className="fas fa-search"></i> "{searchTerm}" üçün {totalCampaigns} nəticə tapıldı</p>
            </div>
          )}

          <div className="campaigns-results-info">
            <p>Cəmi <strong>{totalCampaigns}</strong> kampaniya tapıldı</p>
            {totalCampaigns > 0 && (
              <p className="campaigns-results-detail">Səhifə: {currentPage} / {totalPages}</p>
            )}
          </div>

          {totalCampaigns === 0 ? (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <h3>Heç bir kampaniya tapılmadı</h3>
              <p>Axtarış şərtlərinizi dəyişdirin və ya yeni kampaniya yaradın</p>
              <button className="create-button-small" onClick={openCreateModal}>
                <i className="fas fa-plus"></i> Yeni Kampaniya
              </button>
            </div>
          ) : (
            <>
              <div className="campaigns-grid">
                {campaigns.map(campaign => (
                  <div key={campaign._id} className="campaign-card">
                    <div className="campaign-banner" style={{backgroundImage: campaign.banner ? `url(${campaign.banner})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                      {campaign.promoCode && <div className="promo-code-badge">{campaign.promoCode}</div>}
                    </div>
                    <div className="campaign-content">
                      <div className="campaign-header">
                        <h3>{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="campaign-description">{campaign.description}</p>
                      <div className="campaign-details">
                        <div className="detail-item">
                          <i className="fas fa-tag"></i>
                          <span>Endirim: <strong>{getDiscountDisplay(campaign)}</strong></span>
                        </div>
                        <div className="detail-item">
                          <i className="far fa-calendar"></i>
                          <span>{new Date(campaign.startDate).toLocaleDateString('az-AZ')} - {new Date(campaign.endDate).toLocaleDateString('az-AZ')}</span>
                        </div>
                        <div className="detail-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>Tətbiq: {campaign.applyTo === 'all' ? 'Bütün məhsullar' : `${campaign.products?.length || 0} Məhsul`}</span>
                        </div>
                      </div>
                      <div className="campaign-actions">
                        <button className="edit-btn" onClick={() => handleEditCampaign(campaign)}>
                          <i className="fas fa-edit"></i> Redaktə
                        </button>
                        <button className="status-btn" onClick={() => handleToggleStatus(campaign._id, campaign.status)} disabled={isTogglingStatus === campaign._id}>
                          {isTogglingStatus === campaign._id ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas fa-${campaign.status === 'active' ? 'pause' : 'play'}`}></i>}
                          {isTogglingStatus === campaign._id ? 'Dəyişdirilir...' : (campaign.status === 'active' ? 'Deaktiv et' : 'Aktiv et')}
                        </button>
                        {campaign.status === 'active' && (
                          <button className="end-now-btn" onClick={() => openEndConfirmModal(campaign._id)}>
                            <i className="fas fa-clock"></i> Bitir
                          </button>
                        )}
                        <button className="delete-btn" onClick={() => openDeleteConfirmModal(campaign._id)}>
                          <i className="fas fa-trash"></i> Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} scrollToTop={true} />}
            </>
          )}
        </>
      )}

      {/* CREATE/EDIT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="campaign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="campaign-modal-header">
              <h2>{selectedCampaign ? 'Kampaniyanı redaktə et' : 'Yeni kampaniya yarat'}</h2>
              <button className="campaign-modal-close" onClick={closeCreateModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="campaign-modal-body">
              
              {/* BANNER UPLOAD */}
              <div className="banner-upload-section">
                <label className="banner-upload-label">Kampaniya şəkli</label>
                <div className="banner-upload-area">
                  {newCampaign.banner ? (
                    <div className="banner-preview">
                      <img src={newCampaign.banner} alt="Kampaniya banneri" />
                      <button type="button" className="remove-banner-btn" onClick={handleRemoveBanner} title="Şəkli sil">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <input 
                        type="file" 
                        id="banner-upload" 
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                        onChange={handleBannerUpload} 
                        disabled={uploadingBanner} 
                      />
                      <label htmlFor="banner-upload" className="upload-label">
                        {uploadingBanner ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>Yüklənir...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-cloud-upload-alt"></i>
                            <span>Şəkil yükləmək üçün klikləyin</span>
                            <span className="upload-hint">PNG, JPG, WEBP (max. 5MB)</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="campaign-form-grid">
                <div className="form-group full-width">
                  <label>Kampaniya adı *</label>
                  <input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})} placeholder="Məs: Yay Endirimi 2024" className="form-input" />
                </div>

                <div className="form-group full-width">
                  <label>Təsvir</label>
                  <textarea value={newCampaign.description} onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})} rows="3" placeholder="Kampaniya haqqında qısa məlumat" className="form-textarea" />
                </div>

                <div className="form-group">
                  <label>Başlama tarixi *</label>
                  <input type="date" value={newCampaign.startDate} onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})} className="form-input" />
                </div>

                <div className="form-group">
                  <label>Bitmə tarixi *</label>
                  <input type="date" value={newCampaign.endDate} onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})} className="form-input" />
                </div>

                {/* Endirim növü */}
                <div className="form-group">
                  <label>Endirim növü</label>
                  <div className="custom-dropdown" ref={discountDropdownRef}>
                    <button type="button" className={`dropdown-header ${isDiscountDropdownOpen ? 'active' : ''}`} onClick={() => setIsDiscountDropdownOpen(!isDiscountDropdownOpen)}>
                      <div className="selected-option">
                        <i className={`fas ${discountTypes.find(t => t.value === newCampaign.discountType)?.icon || 'fa-tag'}`}></i>
                        <span>{getSelectedDiscountLabel()}</span>
                      </div>
                      <i className={`fas fa-chevron-${isDiscountDropdownOpen ? 'up' : 'down'}`}></i>
                    </button>
                    {isDiscountDropdownOpen && (
                      <div className="dropdown-menu">
                        {discountTypes.map((type) => (
                          <button key={type.value} type="button" className={`dropdown-item ${newCampaign.discountType === type.value ? 'selected' : ''}`} onClick={() => handleSelectDiscountType(type.value)}>
                            <div className="option-icon"><i className={`fas ${type.icon}`}></i></div>
                            <div className="option-content">
                              <span className="option-title">{type.label}</span>
                              <span className="option-description">{type.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Endirim dəyəri */}
                <div className="form-group">
                  <label>Endirim dəyəri *</label>
                  <div className="input-with-suffix">
                    <input type="number" value={newCampaign.discountValue} onChange={(e) => setNewCampaign({...newCampaign, discountValue: e.target.value})} min="0" step={newCampaign.discountType === 'percentage' ? '1' : '0.01'} placeholder={newCampaign.discountType === 'percentage' ? '20' : '5'} className="form-input" />
                    <span className="input-suffix">{newCampaign.discountType === 'percentage' ? '%' : 'AZN'}</span>
                  </div>
                </div>

                {/* Tətbiq sahəsi */}
                <div className="form-group full-width">
                  <label>Tətbiq sahəsi</label>
                  <div className="custom-dropdown" ref={applyToDropdownRef}>
                    <button type="button" className={`dropdown-header ${isApplyToDropdownOpen ? 'active' : ''}`} onClick={() => setIsApplyToDropdownOpen(!isApplyToDropdownOpen)}>
                      <div className="selected-option">
                        <i className={`fas ${applyToOptions.find(opt => opt.value === newCampaign.applyTo)?.icon || 'fa-globe'}`}></i>
                        <span>{getSelectedApplyToLabel()}</span>
                      </div>
                      <i className={`fas fa-chevron-${isApplyToDropdownOpen ? 'up' : 'down'}`}></i>
                    </button>
                    {isApplyToDropdownOpen && (
                      <div className="dropdown-menu">
                        {applyToOptions.map((option) => (
                          <button key={option.value} type="button" className={`dropdown-item ${newCampaign.applyTo === option.value ? 'selected' : ''}`} onClick={() => handleSelectApplyTo(option.value)}>
                            <div className="option-icon"><i className={`fas ${option.icon}`}></i></div>
                            <div className="option-content">
                              <span className="option-title">{option.label}</span>
                              <span className="option-description">{option.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Məhsul seçimi */}
                {newCampaign.applyTo === 'products' && (
                  <div className="form-group full-width selection-section">
                    <label>Məhsulları əlavə edin</label>
                    <div className="product-input-group">
                      <input type="text" value={customProduct} onChange={(e) => setCustomProduct(e.target.value)} onKeyPress={handleProductKeyPress} placeholder="Məhsul adını yazın" className="product-input" list="products-list" />
                      <datalist id="products-list">
                        {availableProducts.map(product => <option key={product._id} value={product.name} />)}
                      </datalist>
                      <button type="button" onClick={handleAddProduct} className="add-product-btn" disabled={!customProduct.trim()}><i className="fas fa-plus"></i> Əlavə et</button>
                    </div>
                    {newCampaign.products.length > 0 && (
                      <div className="selected-products">
                        <div className="selected-products-title"><i className="fas fa-cubes"></i><span>Seçilmiş məhsullar ({newCampaign.products.length})</span></div>
                        <div className="products-tags">
                          {newCampaign.products.map((product, index) => (
                            <div key={index} className="product-tag">
                              <span className="product-tag-name">{product}</span>
                              <button type="button" className="remove-product-tag" onClick={() => handleRemoveProduct(product)}><i className="fas fa-times"></i></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Promo kod toggle */}
                <div className="form-group full-width">
                  <label className="toggle-label">
                    <input type="checkbox" checked={newCampaign.hasPromoCode} onChange={(e) => setNewCampaign({...newCampaign, hasPromoCode: e.target.checked})} className="toggle-checkbox" />
                    <span className="toggle-switch"></span>
                    <span className="toggle-text">Promo kod istifadə et</span>
                  </label>
                </div>

                {newCampaign.hasPromoCode && (
                  <>
                    <div className="form-group">
                      <label>Promo kod</label>
                      <input type="text" value={newCampaign.promoCode} onChange={(e) => setNewCampaign({...newCampaign, promoCode: e.target.value.toUpperCase()})} placeholder="Məs: YAY20" className="form-input" />
                    </div>
                    <div className="form-group">
                      <label>İstifadə limiti</label>
                      <input type="number" value={newCampaign.usageLimit} onChange={(e) => setNewCampaign({...newCampaign, usageLimit: e.target.value})} placeholder="Məs: 100" min="1" className="form-input" />
                    </div>
                  </>
                )}

                {/* Status */}
                <div className="form-group full-width">
                  <label>Status</label>
                  <div className="custom-dropdown" ref={statusDropdownRef}>
                    <button type="button" className={`dropdown-header ${isStatusDropdownOpen ? 'active' : ''}`} onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
                      <div className="selected-option">
                        <i className={`fas ${statusOptions.find(opt => opt.value === newCampaign.status)?.icon || 'fa-circle'}`}></i>
                        <span>{getSelectedStatusLabel()}</span>
                      </div>
                      <i className={`fas fa-chevron-${isStatusDropdownOpen ? 'up' : 'down'}`}></i>
                    </button>
                    {isStatusDropdownOpen && (
                      <div className="dropdown-menu">
                        {statusOptions.map((option) => (
                          <button key={option.value} type="button" className={`dropdown-item ${newCampaign.status === option.value ? 'selected' : ''}`} onClick={() => handleSelectStatus(option.value)}>
                            <div className="option-icon"><i className={`fas ${option.icon}`}></i></div>
                            <div className="option-content">
                              <span className="option-title">{option.label}</span>
                              <span className="option-description">{option.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="campaign-modal-footer">
              <button className="cancel-btn" onClick={closeCreateModal} disabled={isSubmitting}>Ləğv et</button>
              <button className="save-btn" onClick={selectedCampaign ? handleUpdateCampaign : handleCreateCampaign} disabled={!newCampaign.name || !newCampaign.startDate || !newCampaign.endDate || !newCampaign.discountValue || isSubmitting || uploadingBanner}>
                {isSubmitting ? (selectedCampaign ? 'Yadda saxlanılır...' : 'Kampaniya yaradılır...') : (selectedCampaign ? 'Yadda saxla' : 'Kampaniya yarat')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* END CONFIRM MODAL */}
      {showEndConfirmModal && (
        <div className="modal-overlay" onClick={closeEndModal}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon warning-icon"><i className="fas fa-exclamation-circle"></i></div>
            <h3>Kampaniyanı bitir</h3>
            <p>Bu kampaniyanı dərhal bitirmək istədiyinizə əminsiniz?</p>
            <div className="confirm-modal-actions">
              <button className="confirm-cancel-btn" onClick={closeEndModal} disabled={isEnding}>İmtina</button>
              <button className="confirm-ok-btn" onClick={handleEndNow} disabled={isEnding}>{isEnding ? 'Bitirilir...' : 'Bəli, bitir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon delete-icon"><i className="fas fa-trash-alt"></i></div>
            <h3>Kampaniyanı sil</h3>
            <p>Bu kampaniyanı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.</p>
            <div className="confirm-modal-actions">
              <button className="confirm-cancel-btn" onClick={closeDeleteModal} disabled={isDeleting}>İmtina</button>
              <button className="confirm-delete-btn" onClick={handleDeleteCampaign} disabled={isDeleting}>{isDeleting ? 'Silinir...' : 'Bəli, sil'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;