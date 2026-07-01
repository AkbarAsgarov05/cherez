import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './FilterComponent.css';

// ✅ DÜZGÜN - Environment variable ilə
const API_URL = import.meta.env.VITE_API_URL || 'https://cherez.onrender.com/api';

const FilterComponent = ({ products, onFilterChange, hideCategories = false }) => {
  const { t } = useTranslation();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortType, setSortType] = useState('default');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 500 });
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const filterRef = useRef(null);
  
  // ✅ Backend-dən kateqoriyaları yüklə - DÜZƏLDİLDİ
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // ✅ DÜZGÜN - API_URL istifadə edir
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error("Kateqoriyalar yüklənərkən xəta:", error);
        // Fallback statik kateqoriyalar
        setCategories([
          { _id: "1", name: "Meyvə quruları" },
          { _id: "2", name: "Duzlu çərəzlər" },
          { _id: "3", name: "Şokoladlı çərəzlər" },
          { _id: "4", name: "Ədviyyatlar" },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);
  
  // Sıralama seçimləri - DİL DƏSTƏKLİ
  const sortOptions = [
    { id: 'default', name: t('filter.sortDefault') },
    { id: 'priceAsc', name: t('filter.sortPriceAsc') },
    { id: 'priceDesc', name: t('filter.sortPriceDesc') },
    { id: 'nameAsc', name: t('filter.sortNameAsc') },
    { id: 'nameDesc', name: t('filter.sortNameDesc') }
  ];
  
  // Xarici kliklə paneli bağlama
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFilterOpen && filterRef.current && !filterRef.current.contains(event.target)) {
        handleClosePanel();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);
  
  const handleClosePanel = () => {
    if (!isFilterOpen) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsFilterOpen(false);
      setIsClosing(false);
    }, 250);
  };
  
  const handleTogglePanel = () => {
    if (isFilterOpen) {
      handleClosePanel();
    } else {
      setIsFilterOpen(true);
      setIsClosing(false);
    }
  };
  
  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(cat => cat.name));
    }
  };
  
  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSortType('default');
    setPriceRange({ min: 0, max: 500 });
    setTempPriceRange({ min: 0, max: 500 });
  };
  
  const handleMinPriceChange = (e) => {
    const value = parseInt(e.target.value);
    if (value < tempPriceRange.max) {
      setTempPriceRange({ ...tempPriceRange, min: value });
    }
  };
  
  const handleMaxPriceChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > tempPriceRange.min) {
      setTempPriceRange({ ...tempPriceRange, max: value });
    }
  };
  
  const applyFilters = () => {
    setPriceRange(tempPriceRange);
    
    let filtered = [...products];
    
    if (!hideCategories && selectedCategories.length > 0) {
      filtered = filtered.filter(product => {
        return product.category && selectedCategories.includes(product.category);
      });
    }
    
    filtered = filtered.filter(product => {
      const price = product.pricePerKg;
      return price >= tempPriceRange.min && price <= tempPriceRange.max;
    });
    
    switch (sortType) {
      case 'priceAsc':
        filtered.sort((a, b) => a.pricePerKg - b.pricePerKg);
        break;
      case 'priceDesc':
        filtered.sort((a, b) => b.pricePerKg - a.pricePerKg);
        break;
      case 'nameAsc':
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'az'));
        break;
      case 'nameDesc':
        filtered.sort((a, b) => b.name.localeCompare(a.name, 'az'));
        break;
      default:
        break;
    }
    
    onFilterChange(filtered);
    handleClosePanel();
  };
  
  const hasActiveFilters = (!hideCategories && selectedCategories.length > 0) || sortType !== 'default' || priceRange.min > 0 || priceRange.max < 500;
  
  const getMinPercent = () => {
    return (tempPriceRange.min / 500) * 100;
  };
  
  const getMaxPercent = () => {
    return (tempPriceRange.max / 500) * 100;
  };
  
  return (
    <div className="filter-component" ref={filterRef}>
      <button 
        className={`filter-btn ${hasActiveFilters ? 'active' : ''}`}
        onClick={handleTogglePanel}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/>
        </svg>
        {t('filter.filters')}
        {hasActiveFilters && <span className="filter-badge"></span>}
      </button>
      
      {isFilterOpen && (
        <div className={`filter-panel ${isClosing ? 'filter-panel-closing' : 'filter-panel-opening'}`}>
          <div className="filter-panel-header">
            <span className="filter-panel-title">{t('filter.filters')}</span>
            <button className="close-filter" onClick={handleClosePanel}>×</button>
          </div>
          
          <div className="filter-panel-content">
            {!hideCategories && (
              <div className="filter-group">
                <div 
                  className="filter-group-header"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                  <span>{t('filter.categories')}</span>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                    className={isCategoryOpen ? 'open' : ''}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                
                {isCategoryOpen && (
                  <div className="filter-group-content">
                    {loadingCategories ? (
                      <div className="loading-categories">Yüklənir...</div>
                    ) : (
                      <>
                        <label className="filter-checkbox">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.length === categories.length && categories.length > 0} 
                            onChange={handleSelectAll} 
                          />
                          <span className="checkmark"></span>
                          <span>{t('filter.selectAll')}</span>
                        </label>
                        {categories.map(cat => (
                          <label key={cat._id} className="filter-checkbox">
                            <input 
                              type="checkbox" 
                              checked={selectedCategories.includes(cat.name)}
                              onChange={() => handleCategoryToggle(cat.name)}
                            />
                            <span className="checkmark"></span>
                            <span>{cat.name}</span>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="filter-group">
              <div 
                className="filter-group-header"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <span>{t('filter.sort')}</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  className={isSortOpen ? 'open' : ''}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              
              {isSortOpen && (
                <div className="filter-group-content">
                  {sortOptions.map(opt => (
                    <label key={opt.id} className="filter-radio">
                      <input 
                        type="radio" 
                        name="sort" 
                        checked={sortType === opt.id}
                        onChange={() => setSortType(opt.id)}
                      />
                      <span className="radio-mark"></span>
                      <span>{opt.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="filter-group">
              <div className="filter-group-header">
                <span>{t('filter.priceRange')}</span>
              </div>
              <div className="filter-group-content price-range-content">
                <div className="price-values">
                  <span className="price-min">₼{tempPriceRange.min}</span>
                  <span className="price-max">₼{tempPriceRange.max}</span>
                </div>
                
                <div className="slider-container">
                  <div className="slider-bg"></div>
                  <div 
                    className="slider-fill"
                    style={{
                      left: `${getMinPercent()}%`,
                      right: `${100 - getMaxPercent()}%`
                    }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="1"
                    value={tempPriceRange.min}
                    onChange={handleMinPriceChange}
                    className="slider-thumb thumb-min"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="1"
                    value={tempPriceRange.max}
                    onChange={handleMaxPriceChange}
                    className="slider-thumb thumb-max"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="filter-panel-footer">
            <button className="clear-filters" onClick={handleClearFilters}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              {t('filter.clearFilters')}
            </button>
            <button className="apply-filters" onClick={applyFilters}>
              {t('filter.apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterComponent;