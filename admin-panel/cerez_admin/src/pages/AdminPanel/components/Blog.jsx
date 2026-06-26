// admin-panel/src/components/Blog.jsx
import React, { useState, useRef, useEffect } from 'react';
import './Blog.css';
import Pagination from './Pagination';
import { blogService } from '../../../services/blogService';

// Kateqoriya Dropdown
const CategoryDropdown = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const categories = [
    { value: 'Sağlamlıq', label: 'Sağlamlıq', icon: 'fa-heartbeat', description: 'Sağlamlıq tövsiyələri, xəstəliklərdən qorunma, immunitet' },
    { value: 'Qidalanma', label: 'Qidalanma', icon: 'fa-apple-alt', description: 'Balanslı qidalanma, qida dəyərləri, sağlam qida seçimləri' },
    { value: 'Təbii Qarışıqlar', label: 'Təbii Qarışıqlar', icon: 'fa-blender', description: 'Evdə hazırlanan təbii qarışıqlar, detoks içkiləri, şərbətlər' },
    { value: 'Gözəllik', label: 'Gözəllik', icon: 'fa-spa', description: 'Dəri baxımı, saç baxımı, təbii gözəllik məhsulları' },
    { value: 'Reseptlər', label: 'Reseptlər', icon: 'fa-utensils', description: 'Sağlam yemək reseptləri, quru meyvəli xörəklər, desertlər' },
    { value: 'İdman', label: 'İdman', icon: 'fa-running', description: 'İdman qidalanması, enerji qarışıqları, idmançılar üçün tövsiyələr' },
    { value: 'Uşaqlar', label: 'Uşaqlar', icon: 'fa-child', description: 'Uşaqlar üçün sağlam qəlyanaltılar, uşaq qidalanması' },
    { value: 'Vegan', label: 'Vegan', icon: 'fa-leaf', description: 'Vegan qidalanma, bitki əsaslı reseptlər, alternativ qidalar' }
  ];

  const selectedCategory = categories.find(c => c.value === selected);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="blog-custom-dropdown" ref={dropdownRef}>
      <div 
        className={`blog-dropdown-header ${isOpen ? 'blog-dropdown-header--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected ? (
          <div className="blog-selected-option">
            <i className={`fas ${selectedCategory?.icon}`}></i>
            <span>{selected}</span>
          </div>
        ) : (
          <span className="blog-dropdown-placeholder">Kateqoriya seçin</span>
        )}
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </div>
      
      {isOpen && (
        <div className="blog-dropdown-menu">
          {categories.map(category => (
            <div
              key={category.value}
              className={`blog-dropdown-item ${selected === category.value ? 'blog-dropdown-item--selected' : ''}`}
              onClick={() => {
                onSelect(category.value);
                setIsOpen(false);
              }}
            >
              <div className="blog-option-icon">
                <i className={`fas ${category.icon}`}></i>
              </div>
              <div className="blog-option-content">
                <span className="blog-option-title">{category.label}</span>
                <span className="blog-option-description">{category.description}</span>
              </div>
              {selected === category.value && (
                <i className="fas fa-check blog-option-check"></i>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Status Dropdown
const StatusDropdown = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const statuses = [
    { value: 'published', label: 'Yayımlanıb', icon: 'fa-globe', color: '#48bb78', description: 'Məqalə saytda görünür və oxucular üçün əlçatandır' },
    { value: 'draft', label: 'Qaralama', icon: 'fa-pencil-alt', color: '#ed8936', description: 'Məqalə üzərində iş davam edir, saytda görünmür' }
  ];

  const selectedStatus = statuses.find(s => s.value === selected);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="blog-custom-dropdown" ref={dropdownRef}>
      <div 
        className={`blog-dropdown-header ${isOpen ? 'blog-dropdown-header--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected ? (
          <div className="blog-selected-option">
            <i className={`fas ${selectedStatus?.icon}`} style={{color: selectedStatus?.color}}></i>
            <span>{selectedStatus?.label}</span>
          </div>
        ) : (
          <span className="blog-dropdown-placeholder">Status seçin</span>
        )}
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </div>
      
      {isOpen && (
        <div className="blog-dropdown-menu">
          {statuses.map(status => (
            <div
              key={status.value}
              className={`blog-dropdown-item ${selected === status.value ? 'blog-dropdown-item--selected' : ''}`}
              onClick={() => {
                onSelect(status.value);
                setIsOpen(false);
              }}
            >
              <div className="blog-option-icon" style={{background: status.color}}>
                <i className={`fas ${status.icon}`}></i>
              </div>
              <div className="blog-option-content">
                <span className="blog-option-title">{status.label}</span>
                <span className="blog-option-description">{status.description}</span>
              </div>
              {selected === status.value && (
                <i className="fas fa-check blog-option-check" style={{color: status.color}}></i>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Blog = () => {
  const [viewMode, setViewMode] = useState('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewArticle, setViewArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ Yüklənmə state-ləri
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 5;

  const [articles, setArticles] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const [newArticle, setNewArticle] = useState({
    title: '',
    description: '',
    excerpt: '',
    category: '',
    content: '',
    status: 'draft',
    image: null,
    imagePreview: '',
    readTime: 5,
    readTimeString: '5 dəq',
    views: 0
  });

  // ========== BACKEND SORĞULARI ==========
  const loadBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (searchTerm) filters.search = searchTerm;
      
      const data = await blogService.getBlogs(filters);
      setArticles(data);
    } catch (err) {
      console.error('Xəta:', err);
      setError('Bloglar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, [filterStatus, searchTerm]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewArticle({
          ...newArticle,
          image: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewArticle({
      ...newArticle,
      image: null,
      imagePreview: ''
    });
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setNewArticle({
      ...newArticle,
      description: value,
      excerpt: value
    });
  };

  const handleReadTimeChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setNewArticle({
      ...newArticle,
      readTime: value,
      readTimeString: `${value} dəq`
    });
  };

  // ✅ DƏYİŞDİRİLDİ - Yeni məqalə yarat (2 dəfə tıklamanın qarşısı alınıb)
  const handleCreateArticle = async () => {
    if (createLoading || updateLoading) return;
    
    setCreateLoading(true);
    try {
      const blogData = {
        title: newArticle.title,
        description: newArticle.description,
        excerpt: newArticle.excerpt,
        category: newArticle.category,
        content: newArticle.content,
        status: newArticle.status,
        readTime: newArticle.readTime
      };
      
      if (selectedArticle) {
        setUpdateLoading(true);
        const updated = await blogService.updateBlog(
          selectedArticle._id, 
          blogData, 
          newArticle.image
        );
        setArticles(articles.map(a => a._id === selectedArticle._id ? updated : a));
        setUpdateLoading(false);
      } else {
        const created = await blogService.createBlog(blogData, newArticle.image);
        setArticles([created, ...articles]);
      }
      closeCreateModal();
    } catch (err) {
      console.error('Xəta:', err);
      alert(selectedArticle ? 'Məqalə yenilənərkən xəta' : 'Məqalə yaradılarkən xəta');
    } finally {
      setCreateLoading(false);
      setUpdateLoading(false);
    }
  };

  // ✅ DƏYİŞDİRİLDİ - Blog sil (2 dəfə tıklamanın qarşısı alınıb)
  const handleDeleteArticle = async () => {
    if (!articleToDelete || deleteLoading) return;
    
    setDeleteLoading(true);
    try {
      await blogService.deleteBlog(articleToDelete);
      setArticles(articles.filter(a => a._id !== articleToDelete));
      setShowDeleteConfirmModal(false);
      setArticleToDelete(null);
    } catch (err) {
      console.error('Xəta:', err);
      alert('Məqalə silinərkən xəta baş verdi');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditArticle = (article) => {
    setSelectedArticle(article);
    setNewArticle({
      title: article.title,
      description: article.description,
      excerpt: article.excerpt,
      category: article.category,
      content: article.content,
      status: article.status,
      image: null,
      imagePreview: article.image || '',
      readTime: article.readTime,
      readTimeString: `${article.readTime} dəq`,
      views: article.views
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSelectedArticle(null);
    setNewArticle({
      title: '',
      description: '',
      excerpt: '',
      category: '',
      content: '',
      status: 'draft',
      image: null,
      imagePreview: '',
      readTime: 5,
      readTimeString: '5 dəq',
      views: 0
    });
  };

  const openDeleteConfirmModal = (id) => {
    setArticleToDelete(id);
    setShowDeleteConfirmModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteConfirmModal(false);
    setArticleToDelete(null);
  };

  const openViewModal = async (article) => {
    setViewArticle(article);
    setShowViewModal(true);
    document.body.style.overflow = 'hidden';
    
    try {
      const updated = await blogService.getBlogById(article._id);
      setViewArticle(updated);
      setArticles(articles.map(a => a._id === article._id ? updated : a));
    } catch (err) {
      console.error('Baxış sayı yenilənərkən xəta:', err);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewArticle(null);
    document.body.style.overflow = 'auto';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'published': return <span className="blog-status-badge blog-status-badge--published">Yayımlanıb</span>;
      case 'draft': return <span className="blog-status-badge blog-status-badge--draft">Qaralama</span>;
      default: return null;
    }
  };

  const filteredArticles = articles;

  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);

  const handlePageChange = (page) => {
    setCurrentPage(page);
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

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  if (loading && articles.length === 0) {
    return (
      <div className="blog-container">
        <div className="blog-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <div className="blog-header">
        <h1>Blog</h1>
      </div>

      {error && (
        <div className="blog-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={loadBlogs}>Təkrar dene</button>
        </div>
      )}

      <div className="blog-filters-section">
        <div className="blog-search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Məqalə axtar..."
            value={searchTerm}
            onChange={handleSearchChange}
            autoComplete="off"
          />
          {searchTerm && (
            <button 
              type="button"
              className="blog-search-clear"
              onClick={clearSearch}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="blog-view-toggle">
          <button 
            type="button"
            className={`blog-view-btn ${viewMode === 'card' ? 'blog-view-btn--active' : ''}`}
            onClick={() => handleViewModeChange('card')}
          >
            Kart Görünüşü
          </button>
          <span className="blog-view-separator">|</span>
          <button 
            type="button"
            className={`blog-view-btn ${viewMode === 'list' ? 'blog-view-btn--active' : ''}`}
            onClick={() => handleViewModeChange('list')}
          >
            Siyahı Görünüşü
          </button>
        </div>

        <button 
          type="button"
          className="blog-create-button"
          onClick={() => {
            setSelectedArticle(null);
            setNewArticle({
              title: '',
              description: '',
              excerpt: '',
              category: '',
              content: '',
              status: 'draft',
              image: null,
              imagePreview: '',
              readTime: 5,
              readTimeString: '5 dəq',
              views: 0
            });
            setShowCreateModal(true);
          }}
        >
          <i className="fas fa-plus"></i>
          Yeni Məqalə
        </button>
      </div>

      <div className="blog-status-filters">
        <button 
          type="button"
          className={`blog-status-btn ${filterStatus === 'all' ? 'blog-status-btn--active' : ''}`}
          onClick={() => handleFilterStatusChange('all')}
        >
          Hamısı ({articles.length})
        </button>
        <button 
          type="button"
          className={`blog-status-btn ${filterStatus === 'published' ? 'blog-status-btn--active' : ''}`}
          onClick={() => handleFilterStatusChange('published')}
        >
          Yayımlanıb ({articles.filter(a => a.status === 'published').length})
        </button>
        <button 
          type="button"
          className={`blog-status-btn ${filterStatus === 'draft' ? 'blog-status-btn--active' : ''}`}
          onClick={() => handleFilterStatusChange('draft')}
        >
          Qaralama ({articles.filter(a => a.status === 'draft').length})
        </button>
      </div>

      {searchTerm && (
        <div className="blog-search-results-info">
          <p>
            <i className="fas fa-search"></i> 
            "{searchTerm}" üçün {filteredArticles.length} nəticə tapıldı
          </p>
        </div>
      )}

      <div className="blog-results-info">
        <p>Cəmi <strong>{filteredArticles.length}</strong> məqalə tapıldı</p>
        {filteredArticles.length > 0 && (
          <p className="blog-results-detail">Səhifə: {currentPage} / {totalPages}</p>
        )}
      </div>

      {filteredArticles.length === 0 && !loading ? (
        <div className="blog-no-results">
          <i className="fas fa-search"></i>
          <h3>Heç bir məqalə tapılmadı</h3>
          <p>Axtarış şərtlərinizi dəyişdirin və ya yeni məqalə yaradın</p>
          <button 
            type="button"
            className="blog-create-button-small"
            onClick={() => {
              setSelectedArticle(null);
              setNewArticle({
                title: '',
                description: '',
                excerpt: '',
                category: '',
                content: '',
                status: 'draft',
                image: null,
                imagePreview: '',
                readTime: 5,
                readTimeString: '5 dəq',
                views: 0
              });
              setShowCreateModal(true);
            }}
          >
            <i className="fas fa-plus"></i>
            Yeni Məqalə
          </button>
        </div>
      ) : (
        <>
          <div className={`blog-articles-grid blog-articles-grid--${viewMode}`}>
            {currentArticles.map(article => (
              <div key={article._id} className={`blog-article-card blog-article-card--${article.status} blog-article-card--${viewMode}`}>
                {article.image && (
                  <div 
                    className="blog-article-image" 
                    style={{backgroundImage: `url(${article.image})`}}
                  />
                )}

                <div className="blog-article-content">
                  <div className="blog-article-header">
                    <h3 className="blog-article-title">{article.title}</h3>
                    {getStatusBadge(article.status)}
                  </div>

                  <p className="blog-article-description">{article.description}</p>
                  
                  <div className="blog-article-meta">
                    <span className="blog-meta-item">
                      <i className="far fa-calendar"></i>
                      {new Date(article.createdAt).toLocaleDateString('az-AZ')}
                    </span>
                    <span className="blog-meta-item">
                      <i className="far fa-clock"></i>
                      {article.readTime} dəq
                    </span>
                    {article.category && (
                      <span className="blog-meta-item">
                        <i className="fas fa-tag"></i>
                        {article.category}
                      </span>
                    )}
                    <span className="blog-meta-item">
                      <i className="fas fa-eye"></i>
                      {article.views} baxış
                    </span>
                  </div>

                  <div className="blog-article-actions">
                    <button 
                      type="button"
                      className="blog-action-btn blog-action-btn--view"
                      onClick={() => openViewModal(article)}
                    >
                      <i className="fas fa-eye"></i>
                      Bax
                    </button>
                    <button 
                      type="button"
                      className="blog-action-btn blog-action-btn--edit"
                      onClick={() => handleEditArticle(article)}
                    >
                      <i className="fas fa-edit"></i>
                      Redaktə
                    </button>
                    <button 
                      type="button"
                      className="blog-action-btn blog-action-btn--delete"
                      onClick={() => openDeleteConfirmModal(article._id)}
                    >
                      <i className="fas fa-trash"></i>
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageParamName="page"
              scrollToTop={true}
            />
          )}
        </>
      )}

      {/* Məqaləyə baxma modali */}
      {showViewModal && viewArticle && (
        <div className="blog-modal-overlay" onClick={closeViewModal}>
          <div className="blog-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="blog-view-modal-header">
              <h2>{viewArticle.title}</h2>
              <button 
                type="button"
                className="blog-modal-close" 
                onClick={closeViewModal}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="blog-view-modal-body">
              {viewArticle.image && (
                <div className="blog-view-modal-image">
                  <img src={viewArticle.image} alt={viewArticle.title} />
                </div>
              )}
              
              <div className="blog-view-modal-meta">
                <span className="blog-meta-item">
                  <i className="far fa-calendar"></i> {new Date(viewArticle.createdAt).toLocaleDateString('az-AZ')}
                </span>
                <span className="blog-meta-item">
                  <i className="far fa-clock"></i> {viewArticle.readTime} dəq oxuma
                </span>
                <span className="blog-meta-item">
                  <i className="fas fa-tag"></i> {viewArticle.category}
                </span>
                <span className="blog-meta-item">
                  <i className="fas fa-eye"></i> {viewArticle.views} baxış
                </span>
              </div>
              
              <div className="blog-view-modal-description">
                <p>{viewArticle.description}</p>
              </div>
              
              <div className="blog-view-modal-content">
                <h3>Məqalə məzmunu</h3>
                <div className="blog-content-text">
                  {viewArticle.content ? (
                    viewArticle.content.split('\n\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))
                  ) : (
                    <p>Bu məqalənin məzmunu hələ əlavə edilməyib.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="blog-view-modal-footer">
              <button 
                type="button"
                className="blog-cancel-btn" 
                onClick={closeViewModal}
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni məqalə yaratma/redaktə modali */}
      {showCreateModal && (
        <div className="blog-modal-overlay" onClick={closeCreateModal}>
          <div className="blog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="blog-modal-header">
              <h2>{selectedArticle ? 'Məqaləni redaktə et' : 'Yeni məqalə yarat'}</h2>
              <button 
                type="button"
                className="blog-modal-close" 
                onClick={closeCreateModal}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="blog-modal-body">
              <div className="blog-image-upload-section">
                <label className="blog-image-upload-label">Məqalə şəkli</label>
                <div className="blog-image-upload-area">
                  {newArticle.imagePreview ? (
                    <div className="blog-image-preview">
                      <img src={newArticle.imagePreview} alt="Preview" />
                      <button 
                        type="button"
                        className="blog-remove-image-btn"
                        onClick={handleRemoveImage}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="blog-upload-placeholder">
                      <input 
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="blog-file-input"
                      />
                      <label htmlFor="image-upload" className="blog-upload-label">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <span>Şəkil yükləmək üçün klikləyin</span>
                        <span className="blog-upload-hint">PNG, JPG və ya GIF (max. 5MB)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="blog-form-grid">
                <div className="blog-form-group blog-form-group--full">
                  <label>Məqalə başlığı *</label>
                  <input 
                    type="text" 
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                    placeholder="Məs: Quru meyvələrin faydaları, Çərəzlərin saxlanma üsulları..."
                    className="blog-form-input"
                  />
                </div>

                <div className="blog-form-group blog-form-group--full">
                  <label>Qısa təsvir</label>
                  <textarea 
                    value={newArticle.description}
                    onChange={handleDescriptionChange}
                    placeholder="Məqalə haqqında qısa məlumat..."
                    rows="3"
                    className="blog-form-textarea"
                  />
                </div>

                <div className="blog-form-group">
                  <label>Kateqoriya</label>
                  <CategoryDropdown 
                    selected={newArticle.category}
                    onSelect={(value) => setNewArticle({...newArticle, category: value})}
                  />
                </div>

                <div className="blog-form-group">
                  <label>Oxunma müddəti (dəq)</label>
                  <input 
                    type="number" 
                    value={newArticle.readTime}
                    onChange={handleReadTimeChange}
                    placeholder="5"
                    min="1"
                    className="blog-form-input"
                  />
                </div>

                <div className="blog-form-group">
                  <label>Status</label>
                  <StatusDropdown 
                    selected={newArticle.status}
                    onSelect={(value) => setNewArticle({...newArticle, status: value})}
                  />
                </div>

                <div className="blog-form-group blog-form-group--full">
                  <label>Məqalə məzmunu</label>
                  <textarea 
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                    placeholder="Məqalə məzmununu daxil edin..."
                    rows="8"
                    className="blog-form-textarea"
                  />
                </div>
              </div>
            </div>

            <div className="blog-modal-footer">
              <button 
                type="button"
                className="blog-cancel-btn" 
                onClick={closeCreateModal}
                disabled={createLoading || updateLoading}
              >
                Ləğv et
              </button>
              <button 
                type="button"
                className="blog-save-btn"
                onClick={handleCreateArticle}
                disabled={!newArticle.title || !newArticle.category || createLoading || updateLoading}
              >
                {(createLoading || updateLoading) ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {selectedArticle ? 'Yadda saxlanılır...' : 'Məqalə yaradılır...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {selectedArticle ? 'Yadda saxla' : 'Məqalə yarat'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sil təsdiq modali */}
      {showDeleteConfirmModal && (
        <div className="blog-modal-overlay" onClick={closeDeleteModal}>
          <div className="blog-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="blog-confirm-modal-icon blog-confirm-modal-icon--delete">
              <i className="fas fa-trash-alt"></i>
            </div>
            <h3>Məqaləni sil</h3>
            <p>Bu məqaləni silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.</p>
            <div className="blog-confirm-modal-actions">
              <button 
                type="button"
                className="blog-cancel-btn"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                İmtina
              </button>
              <button 
                type="button"
                className="blog-delete-btn"
                onClick={handleDeleteArticle}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Silinir...
                  </>
                ) : (
                  'Bəli, sil'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;