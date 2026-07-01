import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/useProducts';
import ImageModal from './İmageModal';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import FilterComponent from './FilterComponent';
import LoadingSpinner from './LoadingSpinner';
import './AllProducts.css';

// URL slug-dan kateqoriya adını tapmaq üçün
const CATEGORY_FROM_SLUG = {
  'meyve-qurulari': 'Meyvə quruları',
  'duzlu-cerezler': 'Duzlu çərəzlər',
  'sokokladli-cerezler': 'Şokoladlı çərəzlər',
  'edviyyatlar': 'Ədviyyatlar',
  'paxlalilar-ve-taxillar': 'Paxlalılar və Taxıllar',
  'bitki-yaglari': 'Bitki Yağları',
  'qurudulmus-otlar-ve-caylar': 'Qurudulmuş Otlar və Çaylar',
  'hediyye-paketleri': 'Hədiyyə paketləri'
};

const CategoryPage = () => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { products, loading: productsLoading } = useProducts();
  const location = useLocation();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  
  const [notification, setNotification] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedWeights, setSelectedWeights] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredProductsByFilter, setFilteredProductsByFilter] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(16);
  
  const containerRef = useRef(null);
  const isInternalUpdate = useRef(false);

  // URL-dən kateqoriya adını al
  const pathname = location.pathname;
  let categoryName = '';
  
  if (slug && CATEGORY_FROM_SLUG[slug]) {
    categoryName = CATEGORY_FROM_SLUG[slug];
  } else {
    const categoryId = pathname.split('/').pop();
    categoryName = CATEGORY_FROM_SLUG[categoryId] || categoryId;
  }

  // ✅ useMemo ilə kateqoriya məhsulları - yalnız products və categoryName dəyişdikdə yenilənir
  const categoryProducts = useMemo(() => {
    return products.filter(p => p.category === categoryName);
  }, [products, categoryName]);

  // ✅ useMemo ilə göstəriləcək məhsullar
  const allDisplayProducts = useMemo(() => {
    if (isSearching && searchTerm.trim() !== '' && filteredProducts.length > 0) {
      return filteredProducts;
    }
    if (isFilterActive && filteredProductsByFilter.length > 0) {
      return filteredProductsByFilter;
    }
    if (isSearching || isFilterActive) {
      return [];
    }
    return categoryProducts;
  }, [isSearching, searchTerm, filteredProducts, isFilterActive, filteredProductsByFilter, categoryProducts]);

  // ✅ useMemo ilə total səhifə sayı - useEffect silindi
  const totalPages = useMemo(() => {
    return Math.ceil(allDisplayProducts.length / itemsPerPage);
  }, [allDisplayProducts, itemsPerPage]);

  // ✅ useMemo ilə cari səhifə məhsulları
  const currentProducts = useMemo(() => {
    return allDisplayProducts.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
    );
  }, [allDisplayProducts, currentPage, itemsPerPage]);

  const isAnyFilterActive = (isSearching && searchTerm.trim() !== '') || isFilterActive;

  // URL-dən cari səhifəni oxu - yalnız mount zamanı
  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
    const validPage = !isNaN(pageFromUrl) && pageFromUrl >= 1 ? pageFromUrl : 1;
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Səhifə dəyişdikdə
  const handlePageChange = useCallback((page) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    isInternalUpdate.current = true;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 100);
  }, [currentPage, totalPages]);

  // Axtarış handleri
  const handleSearchResults = useCallback((results, term) => {
    setFilteredProducts(results);
    setSearchTerm(term || '');
    setIsSearching(!!(term && term.trim() !== ''));
    setIsFilterActive(false);
    setFilteredProductsByFilter([]);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Filter handleri
  const handleFilterChange = useCallback((filteredProducts) => {
    setFilteredProductsByFilter(filteredProducts);
    setIsFilterActive(true);
    setIsSearching(false);
    setFilteredProducts([]);
    setSearchTerm('');
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Bütün məhsulları göstər
  const handleShowAllProducts = useCallback(() => {
    setIsTransitioning(true);
    setFilteredProducts([]);
    setFilteredProductsByFilter([]);
    setIsSearching(false);
    setIsFilterActive(false);
    setSearchTerm('');
    setCurrentPage(1);
    
    const searchInput = document.querySelector('.search-input');
    if (searchInput) searchInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsTransitioning(false), 500);
  }, []);

  // Çəki seçimi - yalnız categoryProducts dəyişdikdə
  useEffect(() => {
    if (categoryProducts.length > 0) {
      const defaultWeights = {};
      categoryProducts.forEach(product => {
        const defaultWeight = product.weights?.find(w => w.grams === 1000) || product.weights?.[0];
        if (defaultWeight) {
          defaultWeights[product.id] = defaultWeight;
        }
      });
      setSelectedWeights(defaultWeights);
    }
  }, [categoryProducts]);

  const handleWeightSelect = (productId, weight) => {
    setSelectedWeights(prev => ({ ...prev, [productId]: weight }));
  };

  const showNotification = (messageKey, type = 'success', productName = '', quantityText = '', price = '') => {
    let message;
    if (messageKey === 'addedToCart') {
      message = `${productName} - ${quantityText} (${price} AZN) səbətə əlavə edildi!`;
    } else if (messageKey === 'selectWeight') {
      message = `${productName} üçün çəki seçin!`;
    } else {
      message = messageKey;
    }
    
    setNotification({ message, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddToCart = (product) => {
    if (product.inStock === false) return;
    
    const selectedWeight = selectedWeights[product.id];
    if (!selectedWeight) {
      showNotification('selectWeight', 'error', product.name);
      return;
    }
    
    addToCart(product, selectedWeight.grams, selectedWeight.price);
    
    const quantityText = selectedWeight.grams >= 1000 
      ? `${(selectedWeight.grams / 1000).toFixed(2)} kq` 
      : `${selectedWeight.grams} qr`;
      
    showNotification('addedToCart', 'success', product.name, quantityText, selectedWeight.price.toFixed(2));
  };

  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxTitles, setLightboxTitles] = useState([]);

  const openLightbox = (index) => {
    setLightboxImages(categoryProducts.map(p => p.img));
    setLightboxTitles(categoryProducts.map(p => p.name));
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);
  const goToNext = () => setCurrentImageIndex((prev) => (prev + 1) % categoryProducts.length);
  const goToPrev = () => setCurrentImageIndex((prev) => (prev - 1 + categoryProducts.length) % categoryProducts.length);

  // Loading state
  if (productsLoading) {
    return <LoadingSpinner type="skeleton" />;
  }

  return (
    <>
      {notification && (
        <div className="global-fixed-notification success">
          <span className="global-fixed-notification-icon">✓</span>
          <span className="global-fixed-notification-text">{notification.message}</span>
        </div>
      )}
      
      <ImageModal
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        images={lightboxImages}
        currentIndex={currentImageIndex}
        onNext={goToNext}
        onPrev={goToPrev}
        titles={lightboxTitles}
      />
      
      <div className="all-products-page-wrapper">
        <div className="all-products-container" ref={containerRef}>
          <h2 className="all-products-title">{categoryName}</h2>
          <p className="all-products-subtitle">Premium keyfiyyətli məhsullar</p>
          
          <div className="products-header-controls">
            <SearchBar 
              products={categoryProducts}
              onSearchResults={handleSearchResults}
              placeholder="Məhsul axtar..."
            />
            <FilterComponent 
              products={categoryProducts}
              onFilterChange={handleFilterChange}
              hideCategories={true}
            />
          </div>
          
          {categoryProducts.length === 0 && !productsLoading && (
            <div className="no-results-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <path d="M11 8v3M11 14h.01" strokeWidth="2"/>
              </svg>
              <h3>Bu kateqoriyada məhsul yoxdur</h3>
              <p>Hələlik bu kateqoriyada heç bir məhsul yoxdur.</p>
              <button className="clear-search-button" onClick={() => window.location.href = '/'}>
                Ana səhifəyə qayıt
              </button>
            </div>
          )}
          
          {isAnyFilterActive && allDisplayProducts.length === 0 && categoryProducts.length > 0 && (
            <div className="no-results-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <path d="M11 8v3M11 14h.01" strokeWidth="2"/>
              </svg>
              <h3>Məhsul tapılmadı</h3>
              <p>
                {isSearching 
                  ? `"${searchTerm}" axtarışına uyğun heç bir məhsul tapılmadı.`
                  : 'Seçilmiş filtrlərə uyğun heç bir məhsul tapılmadı.'}
              </p>
              <p className="search-suggestion-text">Fərqli sözlərlə axtarış edin və ya filtrləri dəyişdirin.</p>
              <button className="clear-search-button" onClick={handleShowAllProducts}>
                Bütün məhsulları göstər
              </button>
            </div>
          )}
          
          <div>
            {allDisplayProducts.length > 0 && (
              <>
                <div className="all-products-grid">
                  {currentProducts.map((product, index) => {
                    const originalIndex = categoryProducts.findIndex(p => p.id === product.id);
                    const selectedWeight = selectedWeights[product.id];
                    const displayPrice = product.pricePerKg;
                    const isOutOfStock = product.inStock === false;
                    
                    return (
                      <div 
                        key={product.id}
                        className="all-product-card"
                      >
                        <div 
                          className="all-product-image" 
                          onClick={() => openLightbox(originalIndex)} 
                          style={{ cursor: 'pointer' }}
                        >
                          {product.img ? (
                            <img 
                              src={product.img} 
                              alt={product.name} 
                              onError={(e) => { e.target.src = '/default-product.jpg'; }}
                            />
                          ) : (
                            <div style={{ fontSize: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>📦</div>
                          )}
                          <div className="image-zoom-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              <line x1="11" y1="8" x2="11" y2="14"></line>
                              <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                          </div>
                          {isOutOfStock && <span className="out-of-stock-badge">Stokda yoxdur</span>}
                        </div>
                        
                        <div className="all-product-header">
                          <h3 className="all-product-name">{product.name}</h3>
                        </div>
                        
                        <div className="all-product-weights">
                          {product.weights && product.weights.map((weight, weightIndex) => (
                            <button 
                              key={weightIndex} 
                              className={`all-weight-btn ${selectedWeight && selectedWeight.label === weight.label ? 'all-selected' : ''}`} 
                              onClick={() => handleWeightSelect(product.id, weight)}
                              disabled={isOutOfStock}
                            >
                              {weight.label}
                            </button>
                          ))}
                        </div>
                        
                        <div className="all-product-price">
                          {displayPrice?.toFixed(2)} <span className="all-currency">AZN</span>
                          <span className="all-price-per-unit">/ 1 kq</span>
                        </div>
                        
                        {selectedWeight && !isOutOfStock && (
                          <div className="selected-weight-info">
                            <span className="selected-weight-text">
                              Seçilmiş: {selectedWeight.label} - {selectedWeight.price.toFixed(2)} AZN
                            </span>
                          </div>
                        )}
                        
                        {isOutOfStock && (
                          <div className="selected-weight-info out-of-stock-info">
                            <span className="selected-weight-text">Stokda yoxdur</span>
                          </div>
                        )}
                        
                        <button 
                          className={`all-add-to-cart-btn ${isOutOfStock ? 'disabled-btn' : ''}`}
                          data-id={product.id} 
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                        >
                          {isOutOfStock ? 'Stokda yoxdur' : 'Səbətə əlavə et'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {totalPages > 1 && (
                  <Pagination 
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    pageParamName="page"
                    scrollToTop={true}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
 
export default CategoryPage;