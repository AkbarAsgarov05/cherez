import React, { useEffect, useState, useCallback } from "react";
import { useCart } from "../contexts/CartContext";
import { useTranslation, Trans } from "react-i18next";
import { useProducts } from "../hooks/useProducts";
import LoadingSpinner from "./LoadingSpinner";
import { getProxyUrl } from "../utils/cloudinary";
import "./Products.css";

const Products = () => {
  const { addToCart } = useCart();
  const { t } = useTranslation();
  const { featuredProducts, loading, error, refreshProducts } = useProducts();
  
  // Çəki ilə satılan məhsullar üçün
  const [selectedWeights, setSelectedWeights] = useState({});
  // customQuantities artıq istifadə edilmir - SİLİNDİ
  
  // Ədəd ilə satılan məhsullar üçün
  const [selectedPieces, setSelectedPieces] = useState({});
  
  const [notification, setNotification] = useState(null);

  // Unit type seçiminə görə default dəyər
  useEffect(() => {
    if (featuredProducts && featuredProducts.length > 0) {
      const defaultWeights = {};
      const defaultPieces = {};
      
      featuredProducts.forEach(product => {
        if (product.unitType === 'piece') {
          defaultPieces[product.id] = 1;
        } else {
          const defaultWeight = product.weights?.find(w => w.grams === 1000);
          if (defaultWeight) {
            defaultWeights[product.id] = 1000;
          } else if (product.weights?.[0]) {
            defaultWeights[product.id] = product.weights[0].grams;
          }
        }
      });
      
      setSelectedWeights(defaultWeights);
      setSelectedPieces(defaultPieces);
    }
  }, [featuredProducts]);

  // Seçilmiş çəkiyə görə qiyməti tap (kq üçün)
  const getPriceForWeight = useCallback((product, grams) => {
    const weightOption = product.weights?.find(w => w.grams === grams);
    if (weightOption) return weightOption.price;
    return (product.pricePerKg / 1000) * grams;
  }, []);

  // Səbətə əlavə üçün format (qısa)
  const formatQuantity = useCallback((grams, unitType = 'kg') => {
    if (unitType === 'piece') {
      return (grams === 1) ? '1 ədəd' : `${grams} ədəd`;
    }
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)} ${t("cart.kg", "kq")}`;
    }
    return `${grams} ${t("cart.gr", "qr")}`;
  }, [t]);

  // Gramı KQ-yə çevir (seçilmiş miqdar üçün)
  const formatSelectedWeightDisplay = useCallback((grams) => {
    if (grams >= 1000) {
      const kgValue = grams / 1000;
      if (kgValue === Math.floor(kgValue)) {
        return `${kgValue} ${t("cart.kg", "kq")}`;
      }
      return `${kgValue.toFixed(2)} ${t("cart.kg", "kq")}`;
    }
    return `${grams} ${t("cart.gr", "qr")}`;
  }, [t]);

  // Ədəd seçimi - artır
  const handleIncrementPiece = useCallback((productId, product) => {
    setSelectedPieces(prev => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1
    }));
  }, []);

  // Ədəd seçimi - azalt
  const handleDecrementPiece = useCallback((productId) => {
    setSelectedPieces(prev => {
      const current = prev[productId] || 1;
      if (current <= 1) return prev;
      return {
        ...prev,
        [productId]: current - 1
      };
    });
  }, []);

  // Çəki butonuna tıklayanda seçimi dəyiş
  const handleQuantityChange = useCallback((productId, value) => {
    setSelectedWeights(prev => ({
      ...prev,
      [productId]: value
    }));
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Səbətə əlavə et (unitType dəstəkli)
  const handleAddToCart = useCallback((product) => {
    if (product.inStock === false) {
      showNotification(t("products.outOfStock", "Bu məhsul stokda yoxdur!"), 'error');
      return;
    }

    let quantity = 0;
    let selectedPrice = 0;
    let unitType = product.unitType || 'kg';

    if (unitType === 'piece') {
      // ƏDƏD İLƏ SATILAN MƏHSULLAR
      quantity = selectedPieces[product.id] || 1;
      selectedPrice = product.price * quantity;
      
      addToCart(product, quantity, selectedPrice, 'piece');
      
      const quantityText = quantity === 1 ? '1 ədəd' : `${quantity} ədəd`;
      const addedMessage = t("products.notifications.addedToCartFormat", "{{name}} - {{quantity}} ({{price}} AZN) səbətə əlavə edildi!", {
        name: product.name,
        quantity: quantityText,
        price: selectedPrice.toFixed(2)
      });
      showNotification(addedMessage, 'success');
      
    } else {
      // KİLOQRAM İLƏ SATILAN MƏHSULLAR
      let quantityGrams = 1000;
      
      if (selectedWeights[product.id]) {
        quantityGrams = selectedWeights[product.id];
        selectedPrice = getPriceForWeight(product, quantityGrams);
      } else {
        selectedPrice = getPriceForWeight(product, 1000);
      }
      
      if (quantityGrams < 100) {
        const minQuantityMessage = t("products.quantity.minQuantity", "Minimum miqdar 100 qramdır!");
        showNotification(minQuantityMessage, 'error');
        return;
      }
      
      addToCart(product, quantityGrams, selectedPrice, 'kg');
      
      const quantityText = formatQuantity(quantityGrams);
      const addedMessage = t("products.notifications.addedToCartFormat", "{{name}} - {{quantity}} ({{price}} AZN) səbətə əlavə edildi!", {
        name: product.name,
        quantity: quantityText,
        price: selectedPrice.toFixed(2)
      });
      showNotification(addedMessage, 'success');
    }
    
    // Animasiya
    const button = document.querySelector(`[data-id="${product.id}"] .cerez-products-add-btn`);
    if (button) {
      button.classList.add('cerez-added-to-cart');
      setTimeout(() => {
        button.classList.remove('cerez-added-to-cart');
      }, 500);
    }
  }, [addToCart, selectedWeights, selectedPieces, getPriceForWeight, formatQuantity, showNotification, t]);

  // Animasiya stilləri
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes cerezCartBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); background-color: #27ae60 !important; color: white !important; }
      }
      .cerez-added-to-cart { animation: cerezCartBounce 0.5s ease !important; }
    `;
    document.head.appendChild(style);
    return () => { if (style.parentNode) style.parentNode.removeChild(style); };
  }, []);

  // Scroll animasiyası üçün Intersection Observer
  useEffect(() => {
    const elements = document.querySelectorAll(".cerez-animate-card");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("cerez-show");
          }
        });
      },
      { threshold: 0.25 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [featuredProducts]);

  // Yalnız featured məhsulları göstər (ana səhifədə maksimum 6)
  const displayProducts = featuredProducts?.slice(0, 6) || [];

  // Loading state
  if (loading) {
    return (
      <section className="cerez-products-section" id="products">
        <div className="cerez-products-loading">
          <LoadingSpinner type="skeleton" count={6} />
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="cerez-products-section" id="products">
        <div className="cerez-products-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{t("products.loadError", "Məhsullar yüklənərkən xəta baş verdi")}</p>
          <button onClick={() => refreshProducts()} className="cerez-retry-btn">
            {t("products.retry", "Yenidən cəhd et")}
          </button>
        </div>
      </section>
    );
  }

  // Heç bir featured məhsul yoxdursa, göstərmə
  if (!displayProducts.length) {
    return null;
  }

  return (
    <section className="cerez-products-section" id="products">
      {notification && (
        <div className={`cerez-products-notification ${notification.type === 'error' ? 'cerez-error' : ''}`}>
          <span className="cerez-products-notification-icon">
            {notification.type === 'error' ? '⚠️' : '✓'}
          </span>
          <span className="cerez-products-notification-text">{notification.message}</span>
        </div>
      )}

      <p className="cerez-section-tag cerez-animate-card delay-0">
        {t("products.sectionTag", "Məhsullarımız")}
      </p>
      
      <h2 className="cerez-section-title cerez-animate-card delay-1">
        <Trans
          i18nKey="products.sectionTitle"
          defaults="Premium <1>Çərəzlər</1>"
          components={{
            1: <span className="cerez-highlight" />
          }}
        />
      </h2>
      
      <p className="cerez-section-subtitle cerez-animate-card delay-2">
        {t("products.sectionSubtitle", "Ən keyfiyyətli quru meyvələr və çərəzlər")}
      </p>

      <div className="cerez-products-grid">
        {displayProducts.map((item, index) => {
          const isOutOfStock = item.inStock === false;
          const unitType = item.unitType || 'kg';
          const delayIndex = (index + 3) % 10;
          
          const productImageUrl = getProxyUrl(item.img) || '/default-product.jpg';
          
          return (
            <div 
              className="cerez-product-card cerez-animate-card" 
              key={item.id}
              style={{ animationDelay: `${delayIndex * 0.05}s` }}
            >
              <div className="cerez-image-wrapper">
                <img 
                  src={productImageUrl}
                  alt={item.name} 
                  className="cerez-product-img" 
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = '/default-product.jpg';
                    e.target.onerror = null;
                  }}
                />
                {item.tag && (
                  <span className="cerez-card-badge">{item.tag}</span>
                )}
                {isOutOfStock && (
                  <span className="cerez-out-of-stock-badge">{t("products.outOfStockBadge", "Stokda yoxdur")}</span>
                )}
              </div>

              <div className="cerez-card-body">
                <h3 className="cerez-product-name">{item.name}</h3>
                {item.desc && (
                  <p className="cerez-product-desc">{item.desc}</p>
                )}

                {/* UNIT TYPE-Ə GÖRƏ MİQDAR SEÇİMİ */}
                {unitType === 'piece' ? (
                  // ========== ƏDƏD İLƏ SATILAN MƏHSULLAR ==========
                  <div className="cerez-piece-selection">
                    <div className="cerez-piece-counter">
                      <button 
                        className="cerez-piece-btn cerez-piece-minus"
                        onClick={() => handleDecrementPiece(item.id)}
                        disabled={isOutOfStock}
                        aria-label="Azalt"
                      >
                        −
                      </button>
                      <span className="cerez-piece-value">
                        {selectedPieces[item.id] || 1}
                      </span>
                      <button 
                        className="cerez-piece-btn cerez-piece-plus"
                        onClick={() => handleIncrementPiece(item.id, item)}
                        disabled={isOutOfStock}
                        aria-label="Artır"
                      >
                        +
                      </button>
                    </div>
                    <div className="cerez-piece-unit">
                      <span className="cerez-piece-label">ədəd</span>
                    </div>
                  </div>
                ) : (
                  // ========== KİLOQRAM İLƏ SATILAN MƏHSULLAR ==========
                  <div className="cerez-quantity-selection">
                    <div className="cerez-quantity-options">
                      {item.weights?.map((option) => (
                        <button
                          key={option.grams}
                          type="button"
                          className={`cerez-quantity-option ${
                            selectedWeights[item.id] === option.grams ? 'cerez-selected' : ''
                          } ${(!selectedWeights[item.id] && option.grams === 1000) ? 'cerez-default' : ''}`}
                          onClick={() => handleQuantityChange(item.id, option.grams)}
                          disabled={isOutOfStock}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    
                    {selectedWeights[item.id] && selectedWeights[item.id] !== 1000 && !isOutOfStock && (
                      <div className="cerez-selected-quantity-info">
                        <span className="cerez-selected-quantity-text">
                          {t("products.quantity.selectedText", "Seçilmiş miqdar:")} {formatSelectedWeightDisplay(selectedWeights[item.id])}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="cerez-card-footer">
                  <div className="cerez-price">
                    ₼{unitType === 'piece' 
                      ? item.price?.toFixed(2) || '0.00'
                      : item.pricePerKg?.toFixed(2) || '0.00'
                    }
                    <span className="cerez-unit">
                      {unitType === 'piece' ? '/ədəd' : t("products.unit", "/kq")}
                    </span>
                  </div>
                  
                  <button 
                    className={`cerez-products-add-btn ${isOutOfStock ? 'cerez-disabled' : ''}`}
                    data-id={item.id}
                    onClick={() => handleAddToCart(item)}
                    aria-label={`${item.name} ${t("products.buttons.addToCart", "səbətə əlavə et")}`}
                    disabled={isOutOfStock}
                  >
                    <svg className="cerez-cart-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    {isOutOfStock ? t("products.outOfStock", "Stokda yoxdur") : t("products.buttons.addToCart", "Əlavə et")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <a 
        href="/allproducts" 
        className="cerez-view-all cerez-animate-card"
        style={{ animationDelay: "0.9s" }}
      >
        {t("products.buttons.allProducts", "Bütün Məhsullar")}
      </a>
    </section>
  );
};

export default Products;