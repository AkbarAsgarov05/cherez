import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../../../contexts/ProductContext';
import { useCategories } from '../../../contexts/CategoryContext';
import StockManagement from './StockManagement';
import Pagination from './Pagination';
import { uploadImageToCloudinary, resizeImage, getProxyUrl } from '../../../utils/cloudinary';
import './ProductList.css';
import { 
  FiSearch, FiDownload, FiPrinter, 
  FiEye, FiEdit, FiTrash2,
  FiRefreshCw, FiX, FiCheck, FiClock, FiAlertCircle,
  FiPackage, FiChevronDown, FiImage, FiDollarSign, FiArchive, FiSave,
  FiUpload, FiMove
} from 'react-icons/fi';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    products, 
    deleteProduct, 
    updateProduct, 
    refreshProducts, 
    reorderFeaturedProducts,
    getStockMovements,
    updateStock
  } = useProducts();
  const { categories, loading: categoriesLoading, refreshCategories } = useCategories();

  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  
  const [viewModal, setViewModal] = useState({ show: false, product: null });
  const [editModal, setEditModal] = useState({ show: false, product: null });
  const [imageModal, setImageModal] = useState({ show: false, product: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, productId: null });
  const [stockModal, setStockModal] = useState({ show: false, product: null });
  const [stockMovements, setStockMovements] = useState([]);
  
  const fileInputRef = useRef(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const productsPerPage = 20;

  const categoryNames = categories.map(cat => cat.name);
  const categoriesForFilter = ['all', ...categoryNames];

  const updateUrlParams = useCallback((category, price, stock, search) => {
    const newParams = new URLSearchParams();
    
    if (category && category !== 'all') {
      newParams.set('category', category);
    }
    if (price && price !== 'all') {
      newParams.set('price', price);
    }
    if (stock && stock !== 'all') {
      newParams.set('stock', stock);
    }
    if (search && search.trim() !== '') {
      newParams.set('search', search);
    }
    
    setSearchParams(newParams, { replace: false });
  }, [setSearchParams]);

  // Proxy ilə şəkil URL-i
  const getProductImageUrl = (product) => {
    const imageUrl = product?.img || product?.image;
    if (!imageUrl) return null;
    return getProxyUrl(imageUrl);
  };

  // Stok statusu (unitType ilə)
  const getStockStatus = (stock, unitType) => {
    const stockValue = stock || 0;
    const unit = unitType === 'kg' ? 'kq' : 'ədəd';
    if (stockValue <= 0) {
      return { class: 'stock-critical', text: 'Bitib!', icon: '🔴', unit };
    } else if (stockValue <= 10) {
      return { class: 'stock-low', text: 'Az qalıb', icon: '🟡', unit };
    } else if (stockValue <= 50) {
      return { class: 'stock-medium', text: 'Normal', icon: '🟢', unit };
    }
    return { class: 'stock-high', text: 'Çoxdur', icon: '✅', unit };
  };

  // Kateqoriya adı dəyişdikdə məhsulları yenilə
  useEffect(() => {
    const checkAndRefresh = async () => {
      if (filterCategory !== 'all' && categories.length > 0) {
        const categoryExists = categories.some(cat => cat.name === filterCategory);
        if (!categoryExists) {
          setFilterCategory('all');
          updateUrlParams('all', priceFilter, stockFilter, searchTerm);
          await refreshProducts();
          showNotification(`"${filterCategory}" kateqoriyasının adı dəyişdirildi, filtr təmizləndi`, 'info');
        }
      }
    };
    
    checkAndRefresh();
  }, [categories, filterCategory, priceFilter, stockFilter, searchTerm, updateUrlParams, refreshProducts]);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categoryNames.includes(categoryFromUrl)) {
      setFilterCategory(categoryFromUrl);
    }
    
    const priceFromUrl = searchParams.get('price');
    if (priceFromUrl && ['low', 'medium', 'high', 'premium'].includes(priceFromUrl)) {
      setPriceFilter(priceFromUrl);
    }
    
    const stockFromUrl = searchParams.get('stock');
    if (stockFromUrl && ['inStock', 'lowStock', 'outOfStock'].includes(stockFromUrl)) {
      setStockFilter(stockFromUrl);
    }
    
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
  }, [categories, searchParams, categoryNames]);

  const loadStockMovements = async (productId) => {
    try {
      const movements = await getStockMovements(productId);
      setStockMovements(movements);
      return movements;
    } catch (error) {
      console.error('Stok hərəkətləri yüklənərkən xəta:', error);
      setStockMovements([]);
      return [];
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
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

  // ✅ DÜZƏLDİLDİ - normalizeProduct funksiyasında unitType saxlanılır
  const normalizeProduct = (product) => {
    if (!product) return null;
    return {
      ...product,
      pricePerKg: product.pricePerKg !== undefined ? product.pricePerKg : (product.price || 0),
      img: product.img || product.image || null,
      stock: product.stock !== undefined ? product.stock : 0,
      unitType: product.unitType || 'kg'
    };
  };

  const handleUpdateStock = async (productId, newStock, movement) => {
    try {
      await updateStock(productId, newStock, movement.reason);
      await refreshProducts();
      const updatedMovements = await loadStockMovements(productId);
      return updatedMovements;
    } catch (err) {
      showNotification('Stok yenilənərkən xəta!', 'error');
      throw err;
    }
  };

  const getFilteredProducts = () => {
    if (!products || products.length === 0) return [];
    
    let filtered = products.map(p => normalizeProduct(p)).filter(p => p !== null);
    
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        String(product.name).toLowerCase().includes(searchLower) ||
        String(product._id).toLowerCase().includes(searchLower) ||
        String(product.category).toLowerCase().includes(searchLower) ||
        (product.description && String(product.description).toLowerCase().includes(searchLower))
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => product.category === filterCategory);
    }
    
    const getProductPrice = (product) => product.pricePerKg || product.price || 0;
    
    if (priceFilter !== 'all') {
      if (priceFilter === 'low') {
        filtered = filtered.filter(product => getProductPrice(product) < 10);
      } else if (priceFilter === 'medium') {
        filtered = filtered.filter(product => getProductPrice(product) >= 10 && getProductPrice(product) < 20);
      } else if (priceFilter === 'high') {
        filtered = filtered.filter(product => getProductPrice(product) >= 20 && getProductPrice(product) < 30);
      } else if (priceFilter === 'premium') {
        filtered = filtered.filter(product => getProductPrice(product) >= 30);
      }
    }
    
    if (stockFilter !== 'all') {
      if (stockFilter === 'inStock') {
        filtered = filtered.filter(product => (product.stock || 0) > 10);
      } else if (stockFilter === 'lowStock') {
        filtered = filtered.filter(product => (product.stock || 0) > 0 && (product.stock || 0) <= 10);
      } else if (stockFilter === 'outOfStock') {
        filtered = filtered.filter(product => (product.stock || 0) === 0);
      }
    }
    
    filtered.sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return String(a._id).localeCompare(String(b._id));
    });
    
    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    updateUrlParams(filterCategory, priceFilter, stockFilter, value);
  };

  const handleFilterCategoryChange = (category) => {
    setFilterCategory(category);
    setCurrentPage(1);
    setOpenDropdown(null);
    updateUrlParams(category, priceFilter, stockFilter, searchTerm);
  };

  const handlePriceFilterChange = (price) => {
    setPriceFilter(price);
    setCurrentPage(1);
    setOpenDropdown(null);
    updateUrlParams(filterCategory, price, stockFilter, searchTerm);
  };

  const handleStockFilterChange = (stock) => {
    setStockFilter(stock);
    setCurrentPage(1);
    setOpenDropdown(null);
    updateUrlParams(filterCategory, priceFilter, stock, searchTerm);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const handleViewProduct = (product) => {
    setViewModal({ show: true, product: normalizeProduct(product) });
  };

  const closeViewModal = () => {
    setViewModal({ show: false, product: null });
  };

  const handleEditProduct = (product) => {
    setEditModal({ 
      show: true, 
      product: { ...normalizeProduct(product) }
    });
  };

  const handleEditChange = (field, value) => {
    setEditModal(prev => ({
      ...prev,
      product: {
        ...prev.product,
        [field]: value
      }
    }));
    
    if (field === 'pricePerKg') {
      setEditModal(prev => ({
        ...prev,
        product: {
          ...prev.product,
          price: value
        }
      }));
    }
  };

  const handleImageSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleEditChange('img', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Base64-ni fayla çevirən köməkçi funksiya
  const base64ToFile = (base64, filename) => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // ✅ DÜZƏLDİLDİ - saveEdit funksiyasında unitType saxlanılır
  const saveEdit = async () => {
    if (!editModal.product) return;
    
    try {
      let imageUrl = editModal.product.image || '';
      let imagesArray = editModal.product.images || [];
      
      if (editModal.product.img && editModal.product.img.startsWith('data:')) {
        const file = base64ToFile(editModal.product.img, 'product.jpg');
        const resizedFile = await resizeImage(file, 800, 800);
        imageUrl = await uploadImageToCloudinary(resizedFile);
        
        if (!imageUrl) {
          showNotification('Şəkil yüklənərkən xəta!', 'error');
          return;
        }
        
        imagesArray = [imageUrl, ...imagesArray.filter(img => img !== editModal.product.image)];
      }
      
      const updateData = {
        name: editModal.product.name,
        price: parseFloat(editModal.product.pricePerKg || editModal.product.price || 0),
        stock: parseInt(editModal.product.stock || 0),
        description: editModal.product.description || '',
        category: editModal.product.category,
        featured: editModal.product.featured || false,
        order: editModal.product.order || 0,
        images: imagesArray,
        image: imageUrl,
        unitType: editModal.product.unitType || 'kg'
      };
      
      await updateProduct(editModal.product._id, updateData);
      await refreshProducts();
      showNotification('Məhsul məlumatları uğurla yeniləndi!', 'success');
      closeEditModal();
    } catch (err) {
      console.error('Yeniləmə xətası:', err);
      showNotification(err.message || 'Məhsul yenilənərkən xəta!', 'error');
    }
  };

  const closeEditModal = () => {
    setEditModal({ show: false, product: null });
  };

  const handleImageClick = (product) => {
    setImageModal({ show: true, product: { ...product } });
  };

  const closeImageModal = () => {
    setImageModal({ show: false, product: null });
  };

  const handleDeleteClick = (productId) => {
    setDeleteModal({ show: true, productId });
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteModal.productId);
      await refreshProducts();
      if (currentProducts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      showNotification('Məhsul uğurla silindi!', 'success');
      closeDeleteModal();
    } catch (err) {
      showNotification(err.message || 'Məhsul silinərkən xəta!', 'error');
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, productId: null });
  };

  const handleExport = () => {
    if (filteredProducts.length === 0) return;
    
    const exportData = filteredProducts.map(product => ({
      'ID': product._id,
      'Məhsul adı': product.name,
      'Kateqoriya': product.category,
      'Vahid': product.unitType === 'kg' ? 'kq' : 'ədəd',
      'Açıqlama': product.description || '-',
      'Qiymət (AZN)': (product.pricePerKg || product.price || 0).toFixed(2),
      'Stok miqdarı': `${product.stock || 0} ${product.unitType === 'kg' ? 'kq' : 'ədəd'}`,
      'Stok dəyəri (AZN)': ((product.pricePerKg || product.price || 0) * (product.stock || 0)).toFixed(2),
      'Yerləşmə': product.featured ? 'Ana səhifə' : 'Bütün məhsullar'
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
    link.setAttribute('download', `mehsullar_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification(`${exportData.length} məhsul export edildi!`, 'success');
  };

  const handlePrint = () => {
    if (filteredProducts.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    
    const tableRows = filteredProducts.map(product => `
        <tr>
          <td>${product._id}</td>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.unitType === 'kg' ? 'kq' : 'ədəd'}</td>
          <td>${product.description || '-'}</td>
          <td>₼${(product.pricePerKg || product.price || 0).toFixed(2)}</td>
          <td>${product.stock || 0} ${product.unitType === 'kg' ? 'kq' : 'ədəd'}</td>
          <td>${product.featured ? 'Ana səhifə' : 'Bütün məhsullar'}</td>
        </tr>
    `).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Məhsul Siyahısı</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; }
            h1 { color: #333; margin-bottom: 10px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #667eea; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .footer { margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Məhsul Siyahısı</h1>
            <p>Çap tarixi: ${new Date().toLocaleDateString('az-AZ')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Məhsul adı</th>
                <th>Kateqoriya</th>
                <th>Vahid</th>
                <th>Açıqlama</th>
                <th>Qiymət</th>
                <th>Stok</th>
                <th>Yerləşmə</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            <p>Cəmi məhsul: ${filteredProducts.length}</p>
            <p>Ümumi stok dəyəri: ₼${filteredProducts.reduce((sum, p) => sum + ((p.pricePerKg || p.price || 0) * (p.stock || 0)), 0).toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    
    showNotification('Çap səhifəsi açıldı!', 'info');
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshProducts();
      showNotification('Məlumatlar yeniləndi!', 'info');
    } catch (err) {
      showNotification('Yeniləmə xətası!', 'error');
    } finally {
      setLoading(false);
    }
    setCurrentPage(1);
    setSearchTerm('');
    setFilterCategory('all');
    setPriceFilter('all');
    setStockFilter('all');
    setSearchParams({}, { replace: true });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setPriceFilter('all');
    setStockFilter('all');
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
    showNotification('Filtrlər təmizləndi!', 'info');
  };

  const getCategoryLabel = (category) => {
    if (category === 'all') return 'Bütün kateqoriyalar';
    return category;
  };

  const getPriceLabel = (price) => {
    switch(price) {
      case 'all': return 'Bütün qiymətlər';
      case 'low': return '10 AZN -dən az';
      case 'medium': return '10 - 20 AZN';
      case 'high': return '20 - 30 AZN';
      case 'premium': return '30 AZN -dən çox';
      default: return 'Qiymət';
    }
  };

  const getStockLabel = (stock) => {
    switch(stock) {
      case 'all': return 'Bütün stoklar';
      case 'inStock': return 'Stokda (10kq+)';
      case 'lowStock': return 'Az qalıb (1-10kq)';
      case 'outOfStock': return 'Bitib (0)';
      default: return 'Stok';
    }
  };

  const getTextClass = (text) => {
    if (!text) return '';
    if (text.length > 60) return 'pl-font-size-11';
    if (text.length > 40) return 'pl-font-size-12';
    if (text.length > 30) return 'pl-font-size-13';
    return '';
  };

  const handleDragStart = (e, index, product) => {
    if (!product.featured) {
      e.preventDefault();
      return false;
    }
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index);
    setIsDragging(true);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    if (dragOverItem !== index) {
      setDragOverItem(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
    setIsDragging(false);
  };

  const handleDrop = async (e, dropIndex, product) => {
    e.preventDefault();
    
    if (draggedItem === null) return;
    if (!product.featured) return;
    
    const dragIndex = draggedItem;
    
    const featuredProducts = currentProducts.filter(p => p.featured === true);
    
    if (dragIndex < 0 || dragIndex >= featuredProducts.length) return;
    if (dropIndex < 0 || dropIndex >= featuredProducts.length) return;
    if (dragIndex === dropIndex) return;
    
    const reordered = [...featuredProducts];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, removed);
    
    const reorderedIds = reordered.map(p => p._id);
    
    try {
      await reorderFeaturedProducts(reorderedIds);
      await refreshProducts();
      showNotification('Məhsulların sırası dəyişdirildi!', 'success');
    } catch (err) {
      showNotification('Sıra dəyişdirilərkən xəta!', 'error');
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
    setIsDragging(false);
  };

  const handleOpenStockModal = async (product) => {
    try {
      const movements = await loadStockMovements(product._id);
      setStockModal({ show: true, product });
    } catch (error) {
      console.error('Stok modal açılarkən xəta:', error);
      setStockMovements([]);
      setStockModal({ show: true, product });
    }
  };

  if (loading || categoriesLoading) {
    return (
      <div className="pl-container">
        <div className="pl-loading-container">
          <div className="pl-loading-spinner"></div>
          <p>Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-container">
      {notification.show && (
        <div className={`pl-notification pl-notification-${notification.type}`}>
          <div className="pl-notification-content">
            {notification.type === 'success' && <FiCheck />}
            {notification.type === 'info' && <FiClock />}
            {notification.type === 'error' && <FiAlertCircle />}
            <span>{notification.message}</span>
          </div>
          <button className="pl-notification-close" onClick={() => setNotification({ show: false, message: '', type: 'success' })}>
            <FiX />
          </button>
        </div>
      )}

      <div className="pl-header">
        <div>
          <h1 className="pl-page-title">Məhsul siyahısı</h1>
        </div>
        <div className="pl-header-actions">
          <button className="pl-action-btn pl-refresh-btn" onClick={handleRefresh} title="Yenilə">
            <FiRefreshCw /> Yenilə
          </button>
          <button className="pl-action-btn pl-export-btn" onClick={handleExport}>
            <FiDownload /> Export
          </button>
          <button className="pl-action-btn pl-print-btn" onClick={handlePrint}>
            <FiPrinter /> Çap et
          </button>
        </div>
      </div>

      <div className="pl-compact-filters" ref={dropdownRef}>
        <div className="pl-search-wrapper">
          <FiSearch className="pl-search-icon" />
          <input
            type="text"
            placeholder="Axtarış (məhsul adı, ID, kateqoriya, açıqlama...)"
            value={searchTerm}
            onChange={handleSearch}
            className="pl-search-input"
          />
          {searchTerm && (
            <FiX className="pl-clear-search" onClick={() => {
              setSearchTerm('');
              setCurrentPage(1);
              updateUrlParams(filterCategory, priceFilter, stockFilter, '');
            }} />
          )}
        </div>

        <div className="pl-filter-buttons">
          <div className="pl-filter-dropdown">
            <button 
              className={`pl-filter-btn ${filterCategory !== 'all' ? 'pl-active' : ''}`}
              onClick={() => toggleDropdown('category')}
            >
              <FiPackage />
              <span>{getCategoryLabel(filterCategory)}</span>
              <FiChevronDown className={`pl-dropdown-arrow ${openDropdown === 'category' ? 'pl-open' : ''}`} />
            </button>
            {openDropdown === 'category' && (
              <div className="pl-dropdown-menu">
                {categoriesForFilter.map(category => (
                  <div 
                    key={category}
                    className={`pl-dropdown-item ${filterCategory === category ? 'pl-selected' : ''}`}
                    onClick={() => handleFilterCategoryChange(category)}
                  >
                    {category === 'all' ? 'Bütün kateqoriyalar' : category}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pl-filter-dropdown">
            <button 
              className={`pl-filter-btn ${priceFilter !== 'all' ? 'pl-active' : ''}`}
              onClick={() => toggleDropdown('price')}
            >
              <FiDollarSign />
              <span>{getPriceLabel(priceFilter)}</span>
              <FiChevronDown className={`pl-dropdown-arrow ${openDropdown === 'price' ? 'pl-open' : ''}`} />
            </button>
            {openDropdown === 'price' && (
              <div className="pl-dropdown-menu">
                <div className={`pl-dropdown-item ${priceFilter === 'all' ? 'pl-selected' : ''}`} onClick={() => handlePriceFilterChange('all')}>Bütün qiymətlər</div>
                <div className={`pl-dropdown-item ${priceFilter === 'low' ? 'pl-selected' : ''}`} onClick={() => handlePriceFilterChange('low')}>10 AZN -dən az</div>
                <div className={`pl-dropdown-item ${priceFilter === 'medium' ? 'pl-selected' : ''}`} onClick={() => handlePriceFilterChange('medium')}>10 - 20 AZN</div>
                <div className={`pl-dropdown-item ${priceFilter === 'high' ? 'pl-selected' : ''}`} onClick={() => handlePriceFilterChange('high')}>20 - 30 AZN</div>
                <div className={`pl-dropdown-item ${priceFilter === 'premium' ? 'pl-selected' : ''}`} onClick={() => handlePriceFilterChange('premium')}>30 AZN -dən çox</div>
              </div>
            )}
          </div>

          <div className="pl-filter-dropdown">
            <button 
              className={`pl-filter-btn ${stockFilter !== 'all' ? 'pl-active' : ''}`}
              onClick={() => toggleDropdown('stock')}
            >
              <FiArchive />
              <span>{getStockLabel(stockFilter)}</span>
              <FiChevronDown className={`pl-dropdown-arrow ${openDropdown === 'stock' ? 'pl-open' : ''}`} />
            </button>
            {openDropdown === 'stock' && (
              <div className="pl-dropdown-menu">
                <div className={`pl-dropdown-item ${stockFilter === 'all' ? 'pl-selected' : ''}`} onClick={() => handleStockFilterChange('all')}>Bütün stoklar</div>
                <div className={`pl-dropdown-item ${stockFilter === 'inStock' ? 'pl-selected' : ''}`} onClick={() => handleStockFilterChange('inStock')}>Stokda (10kq+)</div>
                <div className={`pl-dropdown-item ${stockFilter === 'lowStock' ? 'pl-selected' : ''}`} onClick={() => handleStockFilterChange('lowStock')}>Az qalıb (1-10kq)</div>
                <div className={`pl-dropdown-item ${stockFilter === 'outOfStock' ? 'pl-selected' : ''}`} onClick={() => handleStockFilterChange('outOfStock')}>Bitib (0)</div>
              </div>
            )}
          </div>

          {(searchTerm || filterCategory !== 'all' || priceFilter !== 'all' || stockFilter !== 'all') && (
            <button className="pl-filter-btn pl-clear-all-btn" onClick={clearFilters}>
              <FiX /> Təmizlə
            </button>
          )}
        </div>

        {(searchTerm || filterCategory !== 'all' || priceFilter !== 'all' || stockFilter !== 'all') && (
          <div className="pl-compact-active-filters">
            {searchTerm && <span className="pl-compact-active-filter">"{searchTerm}" <FiX onClick={() => { setSearchTerm(''); updateUrlParams(filterCategory, priceFilter, stockFilter, ''); }} /></span>}
            {filterCategory !== 'all' && <span className="pl-compact-active-filter">{filterCategory} <FiX onClick={() => handleFilterCategoryChange('all')} /></span>}
            {priceFilter !== 'all' && <span className="pl-compact-active-filter">{priceFilter === 'low' ? '< 10₼' : priceFilter === 'medium' ? '10-20₼' : priceFilter === 'high' ? '20-30₼' : '> 30₼'} <FiX onClick={() => handlePriceFilterChange('all')} /></span>}
            {stockFilter !== 'all' && <span className="pl-compact-active-filter">{stockFilter === 'inStock' ? 'Stokda' : stockFilter === 'lowStock' ? 'Az qalıb' : 'Bitib'} <FiX onClick={() => handleStockFilterChange('all')} /></span>}
          </div>
        )}
      </div>

      <div className="pl-results-info">
        <p>Cəmi <strong>{filteredProducts.length}</strong> məhsul tapıldı</p>
        {filteredProducts.length > 0 && <p className="pl-results-detail">Səhifə: {currentPage} / {totalPages}</p>}
      </div>

      <div className="pl-table-wrapper">
        {filteredProducts.length === 0 ? (
          <div className="pl-no-data">
            <FiPackage size={48} />
            <p>Heç bir məhsul tapılmadı</p>
            <button className="pl-clear-filters-btn" onClick={clearFilters}>Filtrləri təmizlə</button>
          </div>
        ) : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Şəkil</th>
                <th>Məhsul adı</th>
                <th>Kateqoriya</th>
                <th>Vahid</th>
                <th>Açıqlama</th>
                <th>Qiymət</th>
                <th>Stok</th>
                <th>Yerləşmə</th>
                <th>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product, index) => {
                const stockStatus = getStockStatus(product.stock, product.unitType);
                const productPrice = product.pricePerKg || product.price || 0;
                const productImage = getProductImageUrl(product);
                
                const featuredIndex = product.featured ? 
                  currentProducts.filter(p => p.featured === true).findIndex(p => p._id === product._id) : -1;
                
                return (
                  <tr 
                    key={product._id}
                    className={`${product.featured ? 'pl-featured-row' : ''} ${dragOverItem === featuredIndex && isDragging ? 'pl-drag-over' : ''}`}
                    draggable={product.featured}
                    onDragStart={(e) => handleDragStart(e, featuredIndex, product)}
                    onDragOver={(e) => handleDragOver(e, featuredIndex)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, featuredIndex, product)}
                  >
                    <td className="pl-product-id">
                      {product.featured && (
                        <span className="pl-drag-handle" title="Sürükləyib sıranı dəyiş">
                          <FiMove />
                        </span>
                      )}
                      {index + 1 + (currentPage - 1) * productsPerPage}
                    </td>
                    <td className="pl-product-image-cell">
                      <div className="pl-product-image-wrapper" onClick={() => handleImageClick(product)}>
                        {productImage ? (
                          <img src={productImage} alt={product.name} className="pl-product-image" />
                        ) : (
                          <div className="pl-product-image-placeholder"><FiImage /></div>
                        )}
                      </div>
                    </td>
                    <td className={`pl-product-name ${getTextClass(product.name)}`}>{product.name}</td>
                    <td><span className="pl-product-category">{product.category}</span></td>
                    <td className="pl-product-unit-cell">
                      {product.unitType === 'kg' ? (
                        <span className="unit-badge kg">kq</span>
                      ) : (
                        <span className="unit-badge piece">ədəd</span>
                      )}
                    </td>
                    <td className={`pl-product-description ${getTextClass(product.description || '')}`}>{product.description || '-'}</td>
                    <td className="pl-product-price">₼{productPrice.toFixed(2)}</td>
                    <td className="pl-product-stock">
                      <div className={`stock-status-display ${stockStatus.class}`}>
                        <span className="stock-icon">{stockStatus.icon}</span>
                        <span className="stock-value">{product.stock || 0} {stockStatus.unit}</span>
                        <span className="stock-text">{stockStatus.text}</span>
                      </div>
                    </td>
                    <td className="pl-product-placement">
                      {product.featured ? (
                        <div className="pl-placement-badge featured">
                          <span className="placement-icon">⭐</span>
                          <span className="placement-text">Ana səhifə</span>
                          {product.order !== undefined && product.order > 0 && (
                            <span className="placement-order">#{product.order}</span>
                          )}
                        </div>
                      ) : (
                        <div className="pl-placement-badge normal">
                          <span className="placement-icon">📦</span>
                          <span className="placement-text">Bütün məhsullar</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="pl-action-buttons">
                        <button className="pl-action-btn pl-view-btn" onClick={() => handleViewProduct(product)} title="Məhsula bax"><FiEye /></button>
                        <button className="pl-action-btn pl-edit-btn" onClick={() => handleEditProduct(product)} title="Redaktə et"><FiEdit /></button>
                        <button className="pl-action-btn pl-image-btn" onClick={() => handleImageClick(product)} title="Şəkilə bax"><FiImage /></button>
                        <button className="pl-action-btn pl-stock-btn" onClick={() => handleOpenStockModal(product)} title="Stok idarəsi"><FiPackage /></button>
                        <button className="pl-action-btn pl-delete-btn" onClick={() => handleDeleteClick(product._id)} title="Sil"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="page" scrollToTop={true} />
      )}

      {/* View Modal */}
      {viewModal.show && viewModal.product && (
        <div className="pl-modal-overlay" onClick={closeViewModal}>
          <div className="pl-modal-content pl-view-modal" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header"><h2>Məhsul Detalları</h2><button className="pl-modal-close" onClick={closeViewModal}><FiX /></button></div>
            <div className="pl-modal-body">
              <div className="pl-product-detail-image">
                {(viewModal.product.img || viewModal.product.image) ? (
                  <img src={getProxyUrl(viewModal.product.img || viewModal.product.image)} alt={viewModal.product.name} />
                ) : (
                  <div className="pl-product-image-placeholder pl-large"><FiImage /></div>
                )}
              </div>
              <div className="pl-detail-row"><span className="pl-detail-label">ID:</span><span className="pl-detail-value">{viewModal.product._id}</span></div>
              <div className="pl-detail-row"><span className="pl-detail-label">Məhsul adı:</span><span className="pl-detail-value">{viewModal.product.name}</span></div>
              <div className="pl-detail-row"><span className="pl-detail-label">Kateqoriya:</span><span className="pl-detail-value">{viewModal.product.category}</span></div>
              <div className="pl-detail-row"><span className="pl-detail-label">Satış vahidi:</span><span className="pl-detail-value">{viewModal.product.unitType === 'kg' ? 'Kiloqram (kq)' : 'Ədəd'}</span></div>
              <div className="pl-detail-row"><span className="pl-detail-label">Açıqlama:</span><span className="pl-detail-value pl-description">{viewModal.product.description || '-'}</span></div>
              <div className="pl-detail-row"><span className="pl-detail-label">Qiymət:</span><span className="pl-detail-value pl-amount">₼{(viewModal.product.pricePerKg || viewModal.product.price || 0).toFixed(2)} {viewModal.product.unitType === 'kg' ? '/ kq' : '/ ədəd'}</span></div>
              <div className="pl-detail-row"><span className="pl-detail-label">Stok miqdarı:</span><span className="pl-detail-value">{viewModal.product.stock || 0} {viewModal.product.unitType === 'kg' ? 'kq' : 'ədəd'}</span></div>
            </div>
            <div className="pl-modal-footer"><button className="pl-modal-btn pl-primary" onClick={closeViewModal}>Bağla</button></div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && editModal.product && (
        <div className="pl-modal-overlay" onClick={closeEditModal}>
          <div className="pl-modal-content pl-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header">
              <h2>Məhsulu Redaktə Et</h2>
              <button className="pl-modal-close" onClick={closeEditModal}><FiX /></button>
            </div>
            <div className="pl-modal-body">
              <div className="pl-form-group">
                <label>ID</label>
                <input type="text" value={editModal.product._id || ''} className="pl-modal-input" disabled readOnly />
              </div>
              <div className="pl-form-group">
                <label>Məhsul Adı <span className="required">*</span></label>
                <input type="text" value={editModal.product.name || ''} onChange={(e) => handleEditChange('name', e.target.value)} className="pl-modal-input" placeholder="Məhsul adı" />
              </div>
              
              <div className="pl-form-group">
                <label>Satış vahidi <span className="required">*</span></label>
                <div className="unit-type-select">
                  <button
                    type="button"
                    className={`unit-type-btn ${editModal.product.unitType === 'kg' ? 'active' : ''}`}
                    onClick={() => handleEditChange('unitType', 'kg')}
                  >
                    <span className="unit-icon">⚖️</span> Kiloqram (kq)
                  </button>
                  <button
                    type="button"
                    className={`unit-type-btn ${editModal.product.unitType === 'piece' ? 'active' : ''}`}
                    onClick={() => handleEditChange('unitType', 'piece')}
                  >
                    <span className="unit-icon">📦</span> Ədəd
                  </button>
                </div>
              </div>

              <div className="pl-form-group">
                <label>Kateqoriya <span className="required">*</span></label>
                <div className="custom-category-dropdown" ref={categoryDropdownRef}>
                  <div 
                    className={`dropdown-trigger ${isCategoryDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  >
                    <span>{editModal.product.category || 'Kateqoriya seçin'}</span>
                    <FiChevronDown className={`dropdown-arrow ${isCategoryDropdownOpen ? 'rotate' : ''}`} />
                  </div>
                  {isCategoryDropdownOpen && (
                    <div className="dropdown-menu">
                      {categories.map(category => (
                        <div
                          key={category._id}
                          className={`dropdown-item ${editModal.product.category === category.name ? 'selected' : ''}`}
                          onClick={() => {
                            handleEditChange('category', category.name);
                            setIsCategoryDropdownOpen(false);
                          }}
                        >
                          <span>{category.name}</span>
                          {editModal.product.category === category.name && <span className="check-icon">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pl-form-group">
                <label>{editModal.product.unitType === 'kg' ? 'Qiymət (₼/kq)' : 'Qiymət (₼/ədəd)'} <span className="required">*</span></label>
                <input
                  type="number"
                  value={editModal.product.pricePerKg || editModal.product.price || 0}
                  onChange={(e) => handleEditChange('pricePerKg', parseFloat(e.target.value))}
                  className="pl-modal-input"
                  step="0.01"
                  min="0"
                />
                <small className="pl-field-hint">
                  {editModal.product.unitType === 'kg' 
                    ? '1 kiloqramın qiyməti (AZN)' 
                    : '1 ədədin qiyməti (AZN)'}
                </small>
              </div>

              <div className="pl-form-group">
                <label>{editModal.product.unitType === 'kg' ? 'Stok (kq)' : 'Stok (ədəd)'} <span className="required">*</span></label>
                <input
                  type="number"
                  value={editModal.product.stock || 0}
                  onChange={(e) => handleEditChange('stock', parseInt(e.target.value))}
                  className="pl-modal-input"
                  min="0"
                />
                <small className="pl-field-hint">
                  {editModal.product.unitType === 'kg' 
                    ? 'Mövcud miqdar (kiloqram)' 
                    : 'Mövcud miqdar (ədəd)'}
                </small>
              </div>

              <div className="pl-form-group">
                <label>Açıqlama</label>
                <textarea value={editModal.product.description || ''} onChange={(e) => handleEditChange('description', e.target.value)} className="pl-modal-input pl-textarea" rows="3" placeholder="Məhsul haqqında ətraflı məlumat..." />
              </div>

              <div className="pl-form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={editModal.product.featured || false} onChange={(e) => handleEditChange('featured', e.target.checked)} />
                  <span className="custom-checkbox"></span>
                  <span className="checkbox-text">Ana səhifədə göstər</span>
                </label>
              </div>

              {editModal.product.featured && (
                <div className="pl-form-group">
                  <label>Sıra nömrəsi</label>
                  <input type="number" value={editModal.product.order || 0} onChange={(e) => handleEditChange('order', parseInt(e.target.value))} className="pl-modal-input" min="0" />
                  <small className="pl-field-hint">Ana səhifədə göstərilmə sırası (kiçik rəqəm öndə)</small>
                </div>
              )}

              <div className="pl-form-group">
                <label>Məhsul Şəkli</label>
                <div className="pl-image-upload-area">
                  <div className="pl-image-upload-buttons">
                    <button type="button" className="pl-upload-btn pl-file-btn" onClick={handleImageSelect}>
                      <FiUpload /> Şəkil Seç
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                  </div>
                  {editModal.product.img && (
                    <div className="pl-image-preview">
                      <img src={getProxyUrl(editModal.product.img)} alt="Preview" className="pl-preview-image" />
                      <button type="button" className="pl-remove-image-btn" onClick={() => handleEditChange('img', null)}>
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="pl-modal-footer">
              <button className="pl-modal-btn pl-secondary" onClick={closeEditModal}>Ləğv Et</button>
              <button className="pl-modal-btn pl-primary" onClick={saveEdit}>Yadda Saxla</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal.show && imageModal.product && (
        <div className="pl-modal-overlay" onClick={closeImageModal}>
          <div className="pl-modal-content pl-image-modal" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header">
              <h2>Məhsul Şəkli - {imageModal.product.name}</h2>
              <button className="pl-modal-close" onClick={closeImageModal}><FiX /></button>
            </div>
            <div className="pl-image-modal-body">
              {(imageModal.product.img || imageModal.product.image) ? (
                <img src={getProxyUrl(imageModal.product.img || imageModal.product.image)} alt={imageModal.product.name} className="pl-full-image" />
              ) : (
                <div className="pl-no-image-large">
                  <FiImage size={80} />
                  <p>Şəkil mövcud deyil</p>
                </div>
              )}
            </div>
            <div className="pl-modal-footer">
              <button className="pl-modal-btn pl-primary" onClick={closeImageModal}>Bağla</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="pl-modal-overlay" onClick={closeDeleteModal}>
          <div className="pl-modal-content pl-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="pl-modal-header"><h2>Məhsulu Sil</h2><button className="pl-modal-close" onClick={closeDeleteModal}><FiX /></button></div>
            <div className="pl-modal-body">
              <FiAlertCircle size={48} className="pl-delete-icon" />
              <p className="pl-delete-warning">ID: <strong>{deleteModal.productId}</strong></p>
              <p className="pl-delete-warning">Bu məhsulu silmək istədiyinizə əminsiniz?</p>
              <p className="pl-delete-note">Bu əməliyyat geri qaytarıla bilməz.</p>
            </div>
            <div className="pl-modal-footer">
              <button className="pl-modal-btn pl-secondary" onClick={closeDeleteModal}>Ləğv et</button>
              <button className="pl-modal-btn pl-danger" onClick={confirmDelete}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {stockModal.show && (
        <StockManagement
          product={stockModal.product}
          onClose={() => setStockModal({ show: false, product: null })}
          onUpdateStock={handleUpdateStock}
          stockMovements={stockMovements}
          onRefreshMovements={loadStockMovements}
        />
      )}
    </div>
  );
};

export default ProductList;