import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../hooks/useProducts';
import ImageModal from './İmageModal';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import FilterComponent from './FilterComponent';
import LoadingSpinner from './LoadingSpinner';
import { getProxyUrl } from '../utils/cloudinary';
import './AllProducts.css';

const AllProducts = () => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { products, loading, error } = useProducts();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [notification, setNotification] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Çəki ilə satılan məhsullar üçün
  const [selectedWeights, setSelectedWeights] = useState({});
  
  // Ədəd ilə satılan məhsullar üçün
  const [selectedPieces, setSelectedPieces] = useState({});
  
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredProductsByFilter, setFilteredProductsByFilter] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(16);
  const [totalPages, setTotalPages] = useState(1);
  
  const containerRef = useRef(null);
  const isFilterOrSearchUpdate = useRef(false);

  const getDisplayProducts = useCallback(() => {
    if (isSearching && searchTerm.trim() !== '' && filteredProducts.length > 0) return filteredProducts;
    if (isFilterActive && filteredProductsByFilter.length > 0) return filteredProductsByFilter;
    if (isSearching || isFilterActive) return [];
    return products;
  }, [isSearching, searchTerm, filteredProducts, isFilterActive, filteredProductsByFilter, products]);

  const allDisplayProducts = getDisplayProducts();
  
  useEffect(() => {
    const newTotalPages = Math.ceil(allDisplayProducts.length / itemsPerPage);
    setTotalPages(newTotalPages);
    
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  }, [allDisplayProducts, itemsPerPage, currentPage]);

  const currentProducts = allDisplayProducts.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const isAnyFilterActive = (isSearching && searchTerm.trim() !== '') || isFilterActive;

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
    if (!isNaN(pageFromUrl) && pageFromUrl >= 1) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isFilterOrSearchUpdate.current) {
      isFilterOrSearchUpdate.current = false;
      return;
    }
    
    const newParams = new URLSearchParams(searchParams);
    if (currentPage === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', currentPage.toString());
    }
    
    const newUrl = `${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [currentPage, location.pathname, searchParams]);

  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const pageFromUrl = parseInt(urlParams.get('page') || '1', 10);
      if (!isNaN(pageFromUrl) && pageFromUrl !== currentPage) {
        setCurrentPage(pageFromUrl);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage]);

  const forceScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handlePageChange = useCallback((page) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    setCurrentPage(page);
    forceScrollToTop();
  }, [currentPage, totalPages, forceScrollToTop]);

  const handleSearchResults = useCallback((results, term) => {
    isFilterOrSearchUpdate.current = true;
    setFilteredProducts(results);
    setSearchTerm(term || '');
    setIsSearching(!!(term && term.trim() !== ''));
    setIsFilterActive(false);
    setFilteredProductsByFilter([]);
    setCurrentPage(1);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    const newUrl = `${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
    
    forceScrollToTop();
  }, [searchParams, location.pathname, forceScrollToTop]);

  const handleFilterChange = useCallback((filteredProducts) => {
    isFilterOrSearchUpdate.current = true;
    setFilteredProductsByFilter(filteredProducts);
    setIsFilterActive(true);
    setIsSearching(false);
    setFilteredProducts([]);
    setSearchTerm('');
    setCurrentPage(1);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    const newUrl = `${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
    
    forceScrollToTop();
  }, [searchParams, location.pathname, forceScrollToTop]);

  const handleShowAllProducts = useCallback(() => {
    isFilterOrSearchUpdate.current = true;
    setIsTransitioning(true);
    setFilteredProducts([]);
    setFilteredProductsByFilter([]);
    setIsSearching(false);
    setIsFilterActive(false);
    setSearchTerm('');
    setCurrentPage(1);
    
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    const newUrl = `${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
    
    const searchInput = document.querySelector('.search-input');
    if (searchInput) searchInput.value = '';
    forceScrollToTop();
    setTimeout(() => setIsTransitioning(false), 500);
  }, [searchParams, location.pathname, forceScrollToTop]);

  // Unit type-ə görə default dəyərlər
  useEffect(() => {
    if (products.length > 0) {
      const defaultWeights = {};
      const defaultPieces = {};
      products.forEach(product => {
        if (product.unitType === 'piece') {
          defaultPieces[product.id] = 1;
        } else {
          const defaultWeight = product.weights?.find(w => w.grams === 1000) || product.weights?.[0];
          if (defaultWeight) {
            defaultWeights[product.id] = defaultWeight;
          }
        }
      });
      setSelectedWeights(defaultWeights);
      setSelectedPieces(defaultPieces);
    }
  }, [products]);

  // Çəki seçimi (kq üçün)
  const handleWeightSelect = (productId, weight) => {
    setSelectedWeights(prev => ({ ...prev, [productId]: weight }));
  };

  // Ədəd seçimi - artır
  const handleIncrementPiece = (productId) => {
    setSelectedPieces(prev => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1
    }));
  };

  // Ədəd seçimi - azalt
  const handleDecrementPiece = (productId) => {
    setSelectedPieces(prev => {
      const current = prev[productId] || 1;
      if (current <= 1) return prev;
      return {
        ...prev,
        [productId]: current - 1
      };
    });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Səbətə əlavə et (unitType dəstəkli)
  const handleAddToCart = (product) => {
    if (product.inStock === false) {
      showNotification(t('products.outOfStock', 'Bu məhsul stokda yoxdur!'), 'error');
      return;
    }
    
    const unitType = product.unitType || 'kg';
    
    if (unitType === 'piece') {
      // ƏDƏD İLƏ SATILAN MƏHSULLAR
      const pieces = selectedPieces[product.id] || 1;
      const totalPrice = product.price * pieces;
      
      addToCart(product, pieces, totalPrice, 'piece');
      
      const quantityText = pieces === 1 ? '1 ədəd' : `${pieces} ədəd`;
      showNotification(
        t('products.notifications.addedToCartFormat', { 
          name: product.name, 
          quantity: quantityText, 
          price: totalPrice.toFixed(2) 
        }), 
        'success'
      );
    } else {
      // KİLOQRAM İLƏ SATILAN MƏHSULLAR
      const selectedWeight = selectedWeights[product.id];
      if (!selectedWeight) {
        showNotification(t('products.selectWeight', 'Çəki seçin!'), 'error');
        return;
      }
      
      addToCart(product, selectedWeight.grams, selectedWeight.price);
      
      const quantityText = selectedWeight.grams >= 1000 
        ? `${(selectedWeight.grams / 1000).toFixed(2)} ${t('cart.kg')}` 
        : `${selectedWeight.grams} ${t('cart.gr')}`;
        
      showNotification(
        t('products.notifications.addedToCartFormat', { 
          name: product.name, 
          quantity: quantityText, 
          price: selectedWeight.price.toFixed(2) 
        }), 
        'success'
      );
    }
    
    const button = document.querySelector(`[data-id="${product.id}"]`);
    if (button) {
      button.style.transform = 'scale(0.98)';
      setTimeout(() => button.style.transform = '', 150);
    }
  };

  // Proxy URL ilə lightbox
  const openLightbox = (index) => {
    const proxyImages = products.map(p => getProxyUrl(p.img) || '/default-product.jpg');
    setLightboxImages(proxyImages);
    setLightboxTitles(products.map(p => p.name));
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxTitles, setLightboxTitles] = useState([]);

  const closeLightbox = () => setLightboxOpen(false);
  const goToNext = () => setCurrentImageIndex((prev) => (prev + 1) % products.length);
  const goToPrev = () => setCurrentImageIndex((prev) => (prev - 1 + products.length) % products.length);

  if (loading) {
    return <LoadingSpinner type="skeleton" />;
  }

  if (error) {
    return (
      <div className="all-products-page-wrapper">
        <div className="all-products-container">
          <div className="error-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>{error}</h3>
            <button onClick={() => window.location.reload()} className="retry-button">
              {t('products.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {notification && (
        <div className={`global-fixed-notification ${notification.type === 'error' ? 'error' : 'success'}`}>
          <span className="global-fixed-notification-icon">
            {notification.type === 'error' ? '⚠️' : '✓'}
          </span>
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
          <h2 className="all-products-title">{t('products.allProductsTitle')}</h2>
          <p className="all-products-subtitle">{t('products.allProductsSubtitle')}</p>
          
          <div className="products-header-controls">
            <SearchBar 
              products={products}
              onSearchResults={handleSearchResults}
              placeholder={t('products.searchPlaceholder')}
            />
            <FilterComponent 
              products={products}
              onFilterChange={handleFilterChange}
            />
          </div>
          
          {isAnyFilterActive && allDisplayProducts.length === 0 && (
            <div className="no-results-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <path d="M11 8v3M11 14h.01" strokeWidth="2"/>
              </svg>
              <h3>{t('products.noResultsTitle')}</h3>
              <p>
                {isSearching 
                  ? t('products.noResultsForSearch', { term: searchTerm }) 
                  : t('products.noResultsForFilter')}
              </p>
              <p className="search-suggestion-text">{t('products.searchSuggestion')}</p>
              <button className="clear-search-button" onClick={handleShowAllProducts}>
                {t('products.showAll')}
              </button>
            </div>
          )}
          
          <div>
            {allDisplayProducts.length > 0 && (
              <>
                <div className="all-products-grid">
                  {currentProducts.map((product, index) => {
                    const originalIndex = products.findIndex(p => p.id === product.id);
                    const selectedWeight = selectedWeights[product.id];
                    const selectedPiece = selectedPieces[product.id] || 1;
                    const displayPrice = product.pricePerKg;
                    const displayPiecePrice = product.price;
                    const isOutOfStock = product.inStock === false;
                    const unitType = product.unitType || 'kg';
                    
                    // Proxy URL istifadə et
                    const productImageUrl = getProxyUrl(product.img) || '/default-product.jpg';
                    
                    return (
                      <div 
                        key={`${product.id}-${index}`}
                        className="all-product-card"
                      >
                        <div 
                          className="all-product-image" 
                          onClick={() => openLightbox(originalIndex)} 
                          style={{ cursor: 'pointer' }}
                        >
                          {product.img ? (
                            <img 
                              src={productImageUrl} 
                              alt={product.name} 
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/default-product.jpg';
                              }} 
                            />
                          ) : (
                            <div className="all-no-image">{t('products.noImage')}</div>
                          )}
                          <div className="image-zoom-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              <line x1="11" y1="8" x2="11" y2="14"></line>
                              <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                          </div>
                          
                          {isOutOfStock && (
                            <span className="out-of-stock-badge">{t('products.outOfStockBadge')}</span>
                          )}
                        </div>
                        
                        <div className="all-product-header">
                          <h3 className="all-product-name">{product.name}</h3>
                        </div>
                        
                        {/* UNIT TYPE-Ə GÖRƏ SEÇİM */}
                        {unitType === 'piece' ? (
                          /* ƏDƏD İLƏ SATILAN MƏHSULLAR */
                          <div className="all-piece-selection">
                            <div className="all-piece-counter">
                              <button 
                                className="all-piece-btn all-piece-minus"
                                onClick={() => handleDecrementPiece(product.id)}
                                disabled={isOutOfStock}
                                aria-label="Azalt"
                              >
                                −
                              </button>
                              <span className="all-piece-value">
                                {selectedPiece}
                              </span>
                              <button 
                                className="all-piece-btn all-piece-plus"
                                onClick={() => handleIncrementPiece(product.id)}
                                disabled={isOutOfStock}
                                aria-label="Artır"
                              >
                                +
                              </button>
                            </div>
                            <div className="all-piece-unit">
                              <span className="all-piece-label">ədəd</span>
                            </div>
                          </div>
                        ) : (
                          /* KİLOQRAM İLƏ SATILAN MƏHSULLAR */
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
                        )}
                        
                        <div className="all-product-price">
                          {unitType === 'piece' 
                            ? `${displayPiecePrice?.toFixed(2) || '0.00'}`
                            : `${displayPrice?.toFixed(2) || '0.00'}`
                          }
                          <span className="all-currency">AZN</span>
                          <span className="all-price-per-unit">
                            {unitType === 'piece' ? '/ədəd' : t('products.perKg')}
                          </span>
                        </div>
                        
                        {!isOutOfStock && unitType === 'piece' && (
                          <div className="selected-weight-info piece-info">
                            <span className="selected-weight-text">
                              {t('products.selectedWeight')}: {selectedPiece} ədəd - {(displayPiecePrice * selectedPiece).toFixed(2)} AZN
                            </span>
                          </div>
                        )}
                        
                        {!isOutOfStock && unitType !== 'piece' && selectedWeight && (
                          <div className="selected-weight-info">
                            <span className="selected-weight-text">
                              {t('products.selectedWeight')}: {selectedWeight.label} - {selectedWeight.price.toFixed(2)} AZN
                            </span>
                          </div>
                        )}
                        
                        {isOutOfStock && (
                          <div className="selected-weight-info out-of-stock-info">
                            <span className="selected-weight-text">
                              {t('products.outOfStock')}
                            </span>
                          </div>
                        )}
                        
                        <button 
                          className={`all-add-to-cart-btn ${isOutOfStock ? 'disabled-btn' : ''}`}
                          data-id={product.id} 
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                        >
                          {isOutOfStock ? t('products.outOfStock') : t('products.addToCart')}
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

export default AllProducts;