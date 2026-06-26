import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../../contexts/ProductContext';
import { useCategories } from '../../../contexts/CategoryContext';
import { uploadImageToCloudinary, resizeImage } from '../../../utils/cloudinary';
import './ProductUpload.css';

const ProductUpload = () => {
  const navigate = useNavigate();
  const { addProduct, products } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();

  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    categoryId: '',
    placement: 'all',
    unitType: 'kg'
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isUnitTypeOpen, setIsUnitTypeOpen] = useState(false);
  const fileInputRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const unitTypeDropdownRef = useRef(null);
  const isFileDialogOpen = useRef(false);

  // Unit type options
  const unitTypeOptions = [
    { value: 'kg', label: 'Kiloqram (kq)', icon: '⚖️', description: 'Məhsul çəki ilə satılır' },
    { value: 'piece', label: 'Ədəd', icon: '📦', description: 'Məhsul ədədlə satılır' }
  ];

  // Kateqoriyalar yükləndikdən sonra default seçim
  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({
        ...prev,
        categoryId: categories[0]?._id || ''
      }));
    }
    
    if (formData.categoryId && categories.length > 0) {
      const categoryExists = categories.some(c => c._id === formData.categoryId);
      if (!categoryExists) {
        setFormData(prev => ({
          ...prev,
          categoryId: categories[0]?._id || ''
        }));
        showToast('Seçilmiş kateqoriya silindi, yeni kateqoriya seçildi', 'info');
      }
    }
  }, [categories, formData.categoryId]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      if (unitTypeDropdownRef.current && !unitTypeDropdownRef.current.contains(event.target)) {
        setIsUnitTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlacementChange = (value) => {
    setFormData(prev => ({
      ...prev,
      placement: value
    }));
  };

  const handleUnitTypeSelect = (value) => {
    setFormData(prev => ({
      ...prev,
      unitType: value
    }));
    setIsUnitTypeOpen(false);
  };

  const getSelectedUnitTypeLabel = () => {
    const selected = unitTypeOptions.find(opt => opt.value === formData.unitType);
    return selected ? selected.label : 'Satış vahidi seçin';
  };

  const getSelectedUnitTypeIcon = () => {
    const selected = unitTypeOptions.find(opt => opt.value === formData.unitType);
    return selected ? selected.icon : '⚖️';
  };

  const handleCategorySelect = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categoryId: categoryId
    }));
    setIsCategoryOpen(false);
  };

  const getSelectedCategoryName = () => {
    const category = categories.find(c => c._id === formData.categoryId);
    return category ? category.name : 'Kateqoriya seçin';
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    
    if (selectedFiles.length + fileArray.length > 5) {
      showToast('Maksimum 5 şəkil yükləyə bilərsiniz!', 'error');
      return;
    }

    const validFiles = [];
    const validPreviews = [];

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        showToast(`"${file.name}" şəkil formatında deyil!`, 'error');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast(`"${file.name}" 10MB-dan böyükdür!`, 'error');
        continue;
      }
      
      const resizedFile = await resizeImage(file, 800, 800);
      validFiles.push(resizedFile);
      validPreviews.push(URL.createObjectURL(resizedFile));
    }

    if (validFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...validPreviews]);
  };

  const handleFileChange = (e) => {
    isFileDialogOpen.current = false;
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      showToast('Ən azı 1 şəkil seçin!', 'error');
      return;
    }

    if (!formData.name || !formData.price || !formData.stock) {
      showToast('Bütün məcburi sahələri doldurun!', 'error');
      return;
    }

    if (!formData.categoryId) {
      showToast('Kateqoriya seçin!', 'error');
      return;
    }

    setUploading(true);
    
    try {
      showToast('Şəkillər Cloudinary-ə yüklənir...', 'info');
      
      const uploadedUrls = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: selectedFiles.length });
        const url = await uploadImageToCloudinary(selectedFiles[i]);
        if (url) {
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length === 0) {
        showToast('Şəkillər yüklənərkən xəta!', 'error');
        setUploading(false);
        return;
      }

      const isFeatured = formData.placement === 'featured';
      const selectedCategory = categories.find(c => c._id === formData.categoryId);
      const categoryName = selectedCategory ? selectedCategory.name : '';

      const newProduct = {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description || '',
        category: categoryName,
        images: uploadedUrls,
        image: uploadedUrls[0],
        featured: isFeatured,
        unitType: formData.unitType
      };

      await addProduct(newProduct);
      showToast('Məhsul uğurla əlavə edildi!', 'success');
      
      setFormData({
        name: '',
        price: '',
        stock: '',
        description: '',
        categoryId: categories[0]?._id || '',
        placement: 'all',
        unitType: 'kg'
      });
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setUploadProgress({ current: 0, total: 0 });
      
      setTimeout(() => {
        navigate('/admin/products/list');
      }, 1500);
    } catch (err) {
      console.error('Yükləmə xətası:', err);
      showToast(err.message || 'Məhsul əlavə edilərkən xəta!', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    navigate('/admin/products/list');
  };

  const openFileDialog = (e) => {
    if (isFileDialogOpen.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    isFileDialogOpen.current = true;
    fileInputRef.current.click();
  };

  const handleInputClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="productupload-wrapper">
      <div className="productupload-container">
        
        {toast.show && (
          <div className={`simple-notification ${toast.type}`}>
            <div className="notification-content">
              <span className="notification-message">{toast.message}</span>
            </div>
            <button 
              className="notification-close"
              onClick={() => setToast({ show: false, message: '', type: '' })}
            >
              ×
            </button>
          </div>
        )}

        {uploading && (
          <div className="upload-progress-overlay">
            <div className="upload-progress-container">
              <div className="upload-progress-spinner"></div>
              <p>Şəkillər Cloudinary-ə yüklənir... ({uploadProgress.current} / {uploadProgress.total})</p>
              <div className="upload-progress-bar">
                <div 
                  className="upload-progress-fill" 
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <h1 className="productupload-title">Məhsul Yüklə</h1>
        
        <div className="productupload-card">
          <div className="productupload-header">
            <h2>Yeni Məhsul Əlavə Et</h2>
            <span className="productupload-badge">Maksimum 5 şəkil (Cloudinary)</span>
          </div>
          
          <div 
            className={`productupload-area ${dragActive ? 'drag-active' : ''} ${selectedFiles.length > 0 ? 'has-images' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              onClick={handleInputClick}
              className="productupload-file-input"
              accept="image/*"
              multiple
            />
            
            {selectedFiles.length > 0 ? (
              <div className="productupload-preview-grid">
                {previewUrls.map((url, index) => (
                  <div key={index} className="productupload-preview-item">
                    <img src={url} alt={`Preview ${index + 1}`} />
                    <button 
                      type="button" 
                      className="productupload-remove-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                    >
                      ×
                    </button>
                    <span className="productupload-image-order">{index + 1}</span>
                  </div>
                ))}
                
                {selectedFiles.length < 5 && (
                  <div 
                    className="productupload-add-more" 
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileDialog(e);
                    }}
                  >
                    <span>+</span>
                    <small>Əlavə et</small>
                  </div>
                )}
              </div>
            ) : (
              <div className="productupload-upload-prompt">
                <div className="productupload-icon">📸</div>
                <p className="productupload-main-text">Şəkilləri seçin və ya bura dartın</p>
                <p className="productupload-hint">JPG, PNG, WEBP • Maksimum 10MB • Cloudinary-də saxlanılır</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="productupload-form">
            <div className="productupload-form-row">
              <div className="productupload-form-group">
                <label>Məhsul Adı <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Məsələn: Badam, Qoz, Fındıq..."
                  required
                />
              </div>
            </div>

            {/* Satış vahidi seçimi */}
            <div className="productupload-form-row">
              <div className="productupload-form-group">
                <label>Satış vahidi <span className="required">*</span></label>
                <div className="custom-dropdown" ref={unitTypeDropdownRef}>
                  <div 
                    className={`custom-dropdown-trigger ${isUnitTypeOpen ? 'open' : ''}`}
                    onClick={() => setIsUnitTypeOpen(!isUnitTypeOpen)}
                  >
                    <span className="dropdown-selected">
                      <span className="unit-icon">{getSelectedUnitTypeIcon()}</span>
                      <span className="category-name">{getSelectedUnitTypeLabel()}</span>
                    </span>
                    <svg 
                      className={`dropdown-arrow ${isUnitTypeOpen ? 'rotate' : ''}`}
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none"
                    >
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  
                  {isUnitTypeOpen && (
                    <div className="custom-dropdown-menu">
                      {unitTypeOptions.map(option => (
                        <div
                          key={option.value}
                          className={`custom-dropdown-item ${formData.unitType === option.value ? 'selected' : ''}`}
                          onClick={() => handleUnitTypeSelect(option.value)}
                        >
                          <div className="unit-option-content">
                            <span className="unit-option-icon">{option.icon}</span>
                            <div className="unit-option-text">
                              <span className="unit-option-title">{option.label}</span>
                              <span className="unit-option-description">{option.description}</span>
                            </div>
                          </div>
                          {formData.unitType === option.value && (
                            <span className="check-icon">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="productupload-form-group">
                <label>Kateqoriya <span className="required">*</span></label>
                
                <div className="custom-dropdown" ref={categoryDropdownRef}>
                  <div 
                    className={`custom-dropdown-trigger ${isCategoryOpen ? 'open' : ''}`}
                    onClick={() => !categoriesLoading && setIsCategoryOpen(!isCategoryOpen)}
                  >
                    <span className="dropdown-selected">
                      <span className="category-name">
                        {categoriesLoading ? 'Yüklənir...' : getSelectedCategoryName()}
                      </span>
                    </span>
                    <svg 
                      className={`dropdown-arrow ${isCategoryOpen ? 'rotate' : ''}`}
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none"
                    >
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  
                  {isCategoryOpen && !categoriesLoading && (
                    <div className="custom-dropdown-menu">
                      {categories.length > 0 ? (
                        categories.map(category => (
                          <div
                            key={category._id}
                            className={`custom-dropdown-item ${formData.categoryId === category._id ? 'selected' : ''}`}
                            onClick={() => handleCategorySelect(category._id)}
                          >
                            <span className="category-name">{category.name}</span>
                            {formData.categoryId === category._id && (
                              <span className="check-icon">✓</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="custom-dropdown-empty">
                          <span>Heç bir kateqoriya yoxdur</span>
                          <button 
                            type="button"
                            onClick={() => {
                              setIsCategoryOpen(false);
                              navigate('/admin/categories');
                            }}
                            className="add-category-link"
                          >
                            + Kateqoriya əlavə et
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="productupload-placement-section">
              <label className="placement-section-title">Yerləşmə vəziyyəti</label>
              <div className="placement-options">
                <div 
                  className={`placement-option ${formData.placement === 'featured' ? 'active' : ''}`}
                  onClick={() => handlePlacementChange('featured')}
                >
                  <div className="placement-option-icon">⭐</div>
                  <div className="placement-option-content">
                    <h4>Ana səhifədə göstər</h4>
                    <p>Məhsul həm ana səhifədə, həm də bütün məhsullar siyahısında göstəriləcək</p>
                  </div>
                  <div className="placement-option-radio">
                    <div className={`radio-circle ${formData.placement === 'featured' ? 'checked' : ''}`}>
                      {formData.placement === 'featured' && <div className="radio-dot"></div>}
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`placement-option ${formData.placement === 'all' ? 'active' : ''}`}
                  onClick={() => handlePlacementChange('all')}
                >
                  <div className="placement-option-icon">📦</div>
                  <div className="placement-option-content">
                    <h4>Yalnız bütün məhsullara əlavə et</h4>
                    <p>Məhsul yalnız bütün məhsullar səhifəsində göstəriləcək, ana səhifədə görünməyəcək</p>
                  </div>
                  <div className="placement-option-radio">
                    <div className={`radio-circle ${formData.placement === 'all' ? 'checked' : ''}`}>
                      {formData.placement === 'all' && <div className="radio-dot"></div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="productupload-form-row">
              <div className="productupload-form-group">
                <label>{formData.unitType === 'kg' ? 'Qiymət (₼/kq)' : 'Qiymət (₼/ədəd)'} <span className="required">*</span></label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
                <small className="form-hint">
                  {formData.unitType === 'kg' 
                    ? '1 kiloqramın qiyməti (AZN)' 
                    : '1 ədədin qiyməti (AZN)'}
                </small>
              </div>

              <div className="productupload-form-group">
                <label>{formData.unitType === 'kg' ? 'Stok miqdarı (kq)' : 'Stok miqdarı (ədəd)'} <span className="required">*</span></label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  required
                />
                <small className="form-hint">
                  {formData.unitType === 'kg' 
                    ? 'Mövcud miqdar (kiloqram)' 
                    : 'Mövcud miqdar (ədəd)'}
                </small>
              </div>
            </div>

            <div className="productupload-form-group productupload-full-width">
              <label>Açıqlama <span className="optional">(istəyə bağlı)</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Məhsul haqqında məlumat: çeşid, keyfiyyət, mənşə ölkəsi..."
                rows="4"
              />
            </div>

            <div className="productupload-form-actions">
              <button 
                type="button" 
                className="productupload-btn-secondary"
                onClick={handleCancel}
                disabled={uploading}
              >
                Ləğv Et
              </button>
              <button 
                type="submit" 
                className="productupload-btn-primary"
                disabled={uploading}
              >
                {uploading ? 'Yüklənir...' : 'Məhsulu Yüklə'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductUpload;