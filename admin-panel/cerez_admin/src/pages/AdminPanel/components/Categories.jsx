import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiFolder, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useCategories } from '../../../contexts/CategoryContext';
import { useProducts } from '../../../contexts/ProductContext';
import Pagination from './Pagination';
import './Categories.css';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <FiCheckCircle />,
    error: <FiAlertCircle />,
    info: <FiInfo />
  };

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-content">
        <div className="toast-icon">{icons[type]}</div>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>
        <FiX />
      </button>
    </div>
  );
};

const Categories = () => {
  const { 
    categories, 
    loading, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    refreshCategories
  } = useCategories();
  
  const { products, refreshProducts } = useProducts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const getProductCountByCategory = (categoryName) => {
    return products.filter(p => p.category === categoryName).length;
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      showToast('Kateqoriya adı boş ola bilməz', 'error');
      return;
    }

    const existingCategory = categories.find(
      cat => cat.name.toLowerCase() === categoryName.trim().toLowerCase()
    );
    
    if (existingCategory) {
      showToast(`"${categoryName.trim()}" adlı kateqoriya artıq mövcuddur!`, 'error');
      return;
    }

    try {
      await addCategory({
        name: categoryName.trim(),
        description: categoryDescription.trim()
      });
      showToast('Kateqoriya uğurla əlavə edildi', 'success');
      closeModal();
      setCurrentPage(1);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Kateqoriya əlavə edilərkən xəta';
      showToast(errorMessage, 'error');
    }
  };

  // 🆕 DƏYİŞDİRİLMİŞ - Kateqoriya redaktə et (refresh OLMADAN)
  const handleEditCategory = async () => {
    if (!categoryName.trim()) {
      showToast('Kateqoriya adı boş ola bilməz', 'error');
      return;
    }

    const existingCategory = categories.find(
      cat => cat._id !== editingCategory._id && 
      cat.name.toLowerCase() === categoryName.trim().toLowerCase()
    );
    
    if (existingCategory) {
      showToast(`"${categoryName.trim()}" adlı kateqoriya artıq mövcuddur!`, 'error');
      return;
    }

    const oldCategoryName = editingCategory.name;
    const newCategoryName = categoryName.trim();

    try {
      // 1. Kateqoriyanı yenilə
      await updateCategory(editingCategory._id, {
        name: newCategoryName,
        description: categoryDescription.trim()
      });
      
      // 2. Məhsulları yenilə (refreshProducts artıq məlumatları yeniləyir)
      await refreshProducts();
      await refreshCategories();
      
      showToast('Kateqoriya uğurla yeniləndi', 'success');
      closeModal();
      
      // ❌ refresh-i SİLDİK - səhifə yenilənmir, məlumatlar avtomatik dəyişir
      
    } catch (err) {
      console.error('Yeniləmə xətası:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Kateqoriya yenilənərkən xəta';
      showToast(errorMessage, 'error');
    }
  };

  const openDeleteModal = (category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (deletingCategory) {
      const productCount = getProductCountByCategory(deletingCategory.name);
      
      try {
        const result = await deleteCategory(deletingCategory._id);
        await refreshProducts();
        await refreshCategories();
        
        const successMessage = result?.message || `"${deletingCategory.name}" kateqoriyası və ${productCount} məhsul silindi`;
        showToast(successMessage, 'success');
        
        closeDeleteModal();
        
        const newTotalPages = Math.ceil((filteredCategories.length - 1) / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        } else if (newTotalPages === 0) {
          setCurrentPage(1);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Kateqoriya silinərkən xəta';
        showToast(errorMessage, 'error');
      }
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCategory(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarix yoxdur';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="categories-container">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ show: false, message: '', type: 'success' })} 
        />
      )}

      <div className="categories-header">
        <div className="categories-title-section">
          <h1 className="categories-title">
            <FiFolder className="title-icon" />
            Kateqoriyalar
          </h1>
          <p className="categories-subtitle">Məhsul kateqoriyalarını idarə edin</p>
        </div>
        
        <div className="categories-actions">
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input-custom"
              placeholder="Kateqoriya axtar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-category-btn" onClick={openAddModal}>
            <FiPlus />
            Yeni Kateqoriya
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Yüklənir...</p>
        </div>
      ) : (
        <>
          <div className="categories-grid">
            {currentCategories.length > 0 ? (
              currentCategories.map((category) => {
                const productCount = getProductCountByCategory(category.name);
                return (
                  <div key={category._id} className="category-card">
                    <div className="category-card-header">
                      <div className="category-icon">
                        <FiFolder />
                      </div>
                      <div className="category-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => openEditModal(category)}
                          title="Redaktə et"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          className={`delete-btn ${productCount > 0 ? 'has-products' : ''}`}
                          onClick={() => openDeleteModal(category)}
                          title={productCount > 0 ? `${productCount} məhsul var - Silmək üçün diqqətli olun!` : "Sil"}
                        >
                          <FiTrash2 />
                          {productCount > 0 && <span className="product-count-badge">{productCount}</span>}
                        </button>
                      </div>
                    </div>
                    <div className="category-card-body">
                      <h3 className="category-name">{category.name}</h3>
                      {category.description && (
                        <p className="category-description">{category.description}</p>
                      )}
                      <div className="category-meta">
                        <span className="category-date">
                          Əlavə olunub: {formatDate(category.createdAt)}
                        </span>
                        {productCount > 0 && (
                          <span className="category-product-count">
                            📦 {productCount} məhsul
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state-categories">
                <FiFolder className="empty-icon" />
                <h3>Heç bir kateqoriya tapılmadı</h3>
                <p>Yeni kateqoriya əlavə etmək üçün "Yeni Kateqoriya" düyməsini istifadə edin.</p>
              </div>
            )}
          </div>
          
          {filteredCategories.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              scrollToTop={true}
            />
          )}
          
          {filteredCategories.length > 0 && (
            <div className="categories-info">
              <span>Cəmi {filteredCategories.length} kateqoriya</span>
              {searchTerm && <span> (Axtarış nəticəsi)</span>}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Kateqoriyanı Redaktə Et' : 'Yeni Kateqoriya'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="categoryName">Kateqoriya Adı <span className="required">*</span></label>
                <input
                  type="text"
                  id="categoryName"
                  className="form-input"
                  placeholder="Məsələn: Elektronika"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="categoryDescription">Təsvir</label>
                <textarea
                  id="categoryDescription"
                  className="form-textarea"
                  placeholder="Kateqoriya haqqında qısa məlumat..."
                  rows="4"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeModal}>
                Ləğv Et
              </button>
              <button 
                className="save-btn" 
                onClick={editingCategory ? handleEditCategory : handleAddCategory}
              >
                <FiSave />
                {editingCategory ? 'Yadda Saxla' : 'Əlavə Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="delete-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-content">
              <button className="delete-modal-close" onClick={closeDeleteModal}>
                <FiX />
              </button>
              <div className="delete-modal-icon">
                <FiAlertCircle />
              </div>
              <h3 className="delete-modal-title">Kateqoriyanı Sil</h3>
              <p className="delete-modal-message">
                "<strong>{deletingCategory?.name}</strong>" kateqoriyasını silmək istədiyinizə əminsiniz?
              </p>
              
              {deletingCategory && getProductCountByCategory(deletingCategory.name) > 0 && (
                <div className="delete-modal-warning-box">
                  <FiAlertCircle className="warning-icon" />
                  <p className="delete-modal-warning">
                    <strong>⚠️ DİQQƏT!</strong><br />
                    Bu kateqoriyada <strong>{getProductCountByCategory(deletingCategory.name)} məhsul</strong> var.<br />
                    Kateqoriyanı silsəniz, bu məhsulların <strong>HAMISI TAMAMİLƏ SİLİNƏCƏK</strong>!<br />
                    Bu əməliyyat geri alına bilməz.
                  </p>
                </div>
              )}
              
              {(!deletingCategory || getProductCountByCategory(deletingCategory.name) === 0) && (
                <p className="delete-modal-warning">
                  Bu əməliyyat geri alına bilməz. Kateqoriya silindikdən sonra bu kateqoriyaya aid məhsullar görünməyəcək.
                </p>
              )}
              
              <div className="delete-modal-buttons">
                <button className="delete-modal-cancel" onClick={closeDeleteModal}>
                  Ləğv Et
                </button>
                <button 
                  className={`delete-modal-confirm ${getProductCountByCategory(deletingCategory?.name) > 0 ? 'danger' : ''}`} 
                  onClick={confirmDeleteCategory}
                >
                  <FiTrash2 /> 
                  {getProductCountByCategory(deletingCategory?.name) > 0 
                    ? 'Hər şeyi sil!' 
                    : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;