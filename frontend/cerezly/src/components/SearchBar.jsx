// SearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

const SearchBar = ({ products, onSearchResults, placeholder = "Məhsul axtar..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Axtarış funksiyası - Başlanğıc hərflərə görə (prefix search)
  const performSearch = (term) => {
    if (term.trim() === '') {
      onSearchResults([], '');
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    const searchLower = term.toLowerCase().trim();
    
    // Məhsulları filtr et - yalnız adı axtarılan sözlə BAŞLAYAN məhsullar
    const filtered = products.filter(product => 
      product.name.toLowerCase().startsWith(searchLower)
    );
    
    // Təklifləri yarat - yalnız adı axtarılan sözlə BAŞLAYAN məhsullar
    const uniqueSuggestions = [...new Set(
      products
        .filter(product => 
          product.name.toLowerCase().startsWith(searchLower) && 
          product.name.toLowerCase() !== searchLower
        )
        .map(product => product.name)
    )].slice(0, 5);
    
    setSuggestions(uniqueSuggestions);
    onSearchResults(filtered, term);
    setShowSuggestions(true);
    setIsSearching(false);
  };

  // Input dəyişdikdə
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    if (newValue.trim() === '') {
      // Əgər input boşdursa, bütün məhsulları göstər
      onSearchResults([], '');
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    } else {
      // Debounce ilə axtarış
      const delayDebounceFn = setTimeout(() => {
        performSearch(newValue);
      }, 300);
      
      return () => clearTimeout(delayDebounceFn);
    }
  };

  // Enter düyməsinə basıldıqda
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      performSearch(searchTerm);
      setShowSuggestions(false);
      // Input-dan fokusu çıxar
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  // Təklifə klikləndikdə
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    performSearch(suggestion);
    setShowSuggestions(false);
    // Input-a fokusla
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Axtarışı təmizlə
  const handleClearSearch = () => {
    setSearchTerm('');
    onSearchResults([], '');
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearching(false);
    // Input-a fokusla
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Xarici kliklə təklifləri bağla
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Axtarış statistikası üçün filtr (eyni prefix qaydası)
  const getSearchStats = () => {
    if (!searchTerm.trim()) return 0;
    const searchLower = searchTerm.toLowerCase().trim();
    return products.filter(product => 
      product.name.toLowerCase().startsWith(searchLower)
    ).length;
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-bar-wrapper">
        <div className="search-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => searchTerm.trim() && setShowSuggestions(true)}
          style={{
            color: '#000000',
            WebkitTextFillColor: '#000000',
            opacity: 1
          }}
        />
        
        {searchTerm && (
          <button className="clear-search-btn" onClick={handleClearSearch}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        
        {isSearching && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
      
      {/* Axtarış təklifləri */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Axtarış statistikası */}
      {searchTerm && !isSearching && (
        <div className="search-stats">
          {getSearchStats()} məhsul tapıldı
        </div>
      )}
    </div>
  );
};

export default SearchBar;