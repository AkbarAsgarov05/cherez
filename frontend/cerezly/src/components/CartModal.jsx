import React, { useEffect, useState } from 'react';
import { FiX, FiPlus, FiMinus, FiTrash2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from 'react-i18next';
import './CartModal.css';
import { getProxyUrl } from '../utils/cloudinary';

const CartModal = ({ isOpen, onClose, onOpenLoginModal }) => {
  const { 
    cart, 
    incrementWeight, 
    decrementWeight, 
    removeFromCart, 
    clearCart,
    getTotalPrice,
    getProductCount,
    getTotalQuantity,
    getItemQuantityDisplay,
    getItemPriceDisplay,
    getPricePerUnit,
    validateCartStock
  } = useCart();
  
  const { t, i18n } = useTranslation();
  
  const [showMissingInfoModal, setShowMissingInfoModal] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div");
    notification.className = `cerez-cart-notification ${type}`;
    notification.innerHTML = `
      <div class="cerez-cart-notification-content">
        <span class="cerez-cart-notification-message">${message}</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  };

  const isUserLoggedIn = () => {
    const token = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("userData");
    return token !== null && userData !== null;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (cleanPhone.length === 10) {
      return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 8)} ${cleanPhone.slice(8)}`;
    } else if (cleanPhone.length === 9) {
      return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5, 7)} ${cleanPhone.slice(7)}`;
    }
    return phone;
  };

  const getUserData = () => {
    const token = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("userData");
    
    if (!token) return null;
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        let addressValue = '';
        if (user.address) {
          if (typeof user.address === 'object') {
            addressValue = user.address.street || '';
          } else {
            addressValue = user.address;
          }
        }
        
        if (user.phone && typeof user.phone === 'string') {
          user.phoneFormatted = formatPhoneNumber(user.phone);
        }
        
        user.addressText = addressValue;
        return user;
      } catch (e) {
        console.error("Error parsing user data:", e);
        return null;
      }
    }
    return null;
  };

  const checkMissingUserInfo = () => {
    const user = getUserData();
    if (!user) return ['login'];
    
    const missing = [];
    if (!user.phone || user.phone.trim() === '') missing.push('phone');
    
    let userAddress = '';
    if (user.address) {
      if (typeof user.address === 'object') {
        userAddress = user.address.street || '';
      } else {
        userAddress = user.address;
      }
    } else if (user.addressText) {
      userAddress = user.addressText;
    }
    
    if (!userAddress || userAddress.trim() === '') missing.push('address');
    
    return missing;
  };

  const formatStockWarning = (warnings) => {
    const warningList = Object.values(warnings);
    
    const formatStockText = (w) => {
      const unit = w.unitType === 'kg' ? t('cart.kg', 'kq') : t('cart.piece', 'ədəd');
      if (w.availableStock <= 0) {
        return t('cart.stockOutShort', { productName: w.productName, defaultValue: `${w.productName} məhsulunun stoku bitib` });
      }
      return t('cart.stockRemainingShort', { 
        productName: w.productName, 
        availableKg: w.availableStock,
        defaultValue: `${w.productName} məhsulundan stokda ${w.availableStock} ${unit} qalıb`
      });
    };
    
    const reduceText = t('cart.reduceQuantityShort', 'Zəhmət olmasa miqdarı azaldın');
    
    if (warningList.length === 1) {
      return `${formatStockText(warningList[0])}. ${reduceText}`;
    }
    
    if (warningList.length === 2) {
      return `${formatStockText(warningList[0])}, ${formatStockText(warningList[1])}. ${reduceText}`;
    }
    
    if (warningList.length >= 3) {
      return `${formatStockText(warningList[0])}. Həmçinin digər ${warningList.length - 1} məhsulda da stok problemi var. ${reduceText}`;
    }
    
    return t('cart.stockWarningDefault', 'Bəzi məhsulların stoku kifayət deyil. Zəhmət olmasa miqdarı azaldın');
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const getProductDisplayName = (item) => {
    return item.nameSnapshot || item.name || t('cart.defaultProduct', 'Məhsul');
  };

  const openAccountSettings = () => {
    setShowMissingInfoModal(false);
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openAccountSettings'));
    }, 100);
  };

  const handlePlaceOrderClick = async () => {
    const result = await validateCartStock();
    
    if (result.hasStockIssue && result.warnings && Object.keys(result.warnings).length > 0) {
      const warningText = formatStockWarning(result.warnings);
      showNotification(warningText, 'error');
      return;
    }
    
    const loggedIn = isUserLoggedIn();
    
    if (!loggedIn) {
      onClose();
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }
    
    const missing = checkMissingUserInfo();
    
    if (missing.length > 0) {
      if (missing.includes('login')) {
        onClose();
        if (onOpenLoginModal) onOpenLoginModal();
      } else {
        setMissingFields(missing);
        setShowMissingInfoModal(true);
      }
      return;
    }
    
    placeOrder();
  };

  const placeOrder = async () => {
    const user = getUserData();
    
    if (!user) {
      showNotification(t('cart.loginRequired', 'Hesaba daxil olun!'), "error");
      return;
    }
    
    setIsSubmitting(true);
    
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;

    let userAddress = '';
    if (user.address) {
      if (typeof user.address === 'object') {
        userAddress = user.address.street || '';
      } else {
        userAddress = user.address;
      }
    } else if (user.addressText) {
      userAddress = user.addressText;
    }
    
    let userPhone = user.phone || '';
    const paymentMethod = user.paymentMethod || "cash";

    const orderData = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: userPhone,
      address: userAddress,
      amount: getTotalPrice(),
      items: getProductCount(),
      paymentMethod: paymentMethod,
      note: "",
      products: cart.map(item => ({
        productId: item.productId,
        name: item.nameSnapshot,
        quantity: item.unitType === 'kg' ? (item.totalGrams || 0) : (item.totalPieces || 0),
        price: item.priceSnapshot,
        unitType: item.unitType || 'kg',
        total: item.totalPrice
      }))
    };

    console.log('📦 Göndərilən sifariş:', JSON.stringify(orderData, null, 2));

    try {
      // ✅ DÜZGÜN - Environment variable ilə
      const API_URL = import.meta.env.VITE_API_URL || 'https://cherez.onrender.com/api';
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('cart.orderError', 'Sifariş xətası'));
      }

      const savedOrder = await response.json();
      
      const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      existingOrders.push({
        ...orderData,
        id: savedOrder.orderNumber,
        orderNumber: savedOrder.orderNumber,
        date: formattedDate,
        status: "pending"
      });
      localStorage.setItem("orders", JSON.stringify(existingOrders));
      
      clearCart();
      
      showNotification(t('cart.orderSuccess', { orderNumber: savedOrder.orderNumber, defaultValue: `Sifariş №${savedOrder.orderNumber} qəbul edildi!` }), "success");
      onClose();
      
    } catch (error) {
      console.error("Sifariş xətası:", error);
      showNotification(t('cart.orderErrorRetry', 'Sifariş xətası! Yenidən cəhd edin.'), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMissingFieldLabel = (field) => {
    switch(field) {
      case 'phone': return t('cart.missingPhone', 'Telefon nömrəsi');
      case 'address': return t('cart.missingAddress', 'Çatdırılma ünvanı');
      default: return field;
    }
  };

  const getProductCountText = () => {
    const count = getProductCount();
    return t('cart.productCount', { count, defaultValue: `${count} ədəd` });
  };

  const getUnitLabel = (isKg) => {
    return isKg ? t('cart.kg', 'kq') : t('cart.piece', 'ədəd');
  };

  const getDecrementAmount = (isKg) => {
    return isKg ? t('cart.decreaseAmount', '100 qr') : t('cart.decreasePieceAmount', '1 ədəd');
  };

  const getIncrementAmount = (isKg) => {
    return isKg ? t('cart.increaseAmount', '100 qr') : t('cart.increasePieceAmount', '1 ədəd');
  };

  const handleIncrementPiece = (productId) => {
    incrementWeight(productId, (msg, type) => showNotification(msg, type));
  };

  const handleDecrementPiece = (productId) => {
    decrementWeight(productId);
  };

  const handleIncrementWeight = (productId) => {
    incrementWeight(productId, (msg, type) => showNotification(msg, type));
  };

  const handleDecrementWeight = (productId) => {
    decrementWeight(productId);
  };

  const handleRemove = (productId) => {
    removeFromCart(productId);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-modal-overlay" onClick={onClose}>
        <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="cart-modal-header">
            <h3>
              <span className="cart-icon-title">🛒</span>
              {t('cart.title', 'Səbətim')} ({getProductCountText()})
            </h3>
            <button className="cart-close-btn" onClick={onClose} aria-label={t('cart.close', 'Bağla')}>
              <FiX />
            </button>
          </div>

          <div className="cart-items-container">
            {!cart || cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">🛒</div>
                <p>{t('cart.empty', 'Səbətiniz boşdur')}</p>
                <button className="continue-shopping-btn" onClick={onClose}>
                  {t('cart.continueShopping', 'Alış-verişə davam et')}
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map((item) => {
                    const productName = getProductDisplayName(item);
                    const itemPrice = getItemPriceDisplay(item);
                    const pricePerUnit = getPricePerUnit(item);
                    const totalQuantity = getItemQuantityDisplay(item);
                    const unitType = item.unitType || 'kg';
                    const isKg = unitType === 'kg';
                    
                    const decrementAmount = getDecrementAmount(isKg);
                    const incrementAmount = getIncrementAmount(isKg);
                    const handleIncrement = isKg ? () => handleIncrementWeight(item.productId) : () => handleIncrementPiece(item.productId);
                    const handleDecrement = isKg ? () => handleDecrementWeight(item.productId) : () => handleDecrementPiece(item.productId);
                    const unitLabel = getUnitLabel(isKg);
                    
                    return (
                      <div className="cart-item-card" key={item.productId}>
                        <div className="cart-item-image">
                          <img 
                            src={getProxyUrl(item.imgSnapshot)} 
                            alt={productName}
                            onError={(e) => {
                              e.target.src = '/default-product.jpg';
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                        
                        <div className="cart-item-details">
                          <h4 className="cart-item-title">{productName}</h4>
                          <p className="cart-item-price">
                            {pricePerUnit} ₼ / 1{unitLabel}
                          </p>
                          
                          <div className="cart-item-controls">
                            <div className="quantity-control-wrapper">
                              <div className="quantity-buttons">
                                <button 
                                  className="qty-btn minus"
                                  onClick={handleDecrement}
                                  title={isKg ? t('cart.decrease', '100 qr azalt') : t('cart.decreasePiece', '1 ədəd azalt')}
                                >
                                  <FiMinus />
                                  <span className="qty-amount">{decrementAmount}</span>
                                </button>
                                
                                <div className="quantity-display">
                                  <div className="quantity-info">
                                    <span className="quantity-weight">{totalQuantity}</span>
                                  </div>
                                </div>
                                
                                <button 
                                  className="qty-btn plus"
                                  onClick={handleIncrement}
                                  disabled={isSubmitting}
                                >
                                  <FiPlus />
                                  <span className="qty-amount">{incrementAmount}</span>
                                </button>
                              </div>
                              
                              <div className="item-total-info">
                                <div className="item-total-price">
                                  {itemPrice} ₼
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          className="remove-item-btn"
                          onClick={() => handleRemove(item.productId)}
                          title={t('cart.remove', 'Sil')}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-summary">
                  <div className="summary-row">
                    <span>{t('cart.productCountLabel', 'Məhsul sayı')}</span>
                    <span>{getProductCountText()}</span>
                  </div>
                  
                  <div className="summary-row total-row">
                    <span>{t('cart.totalAmount', 'Ümumi məbləğ')}</span>
                    <span className="total-amount">{getTotalPrice()?.toFixed(2) || '0.00'} ₼</span>
                  </div>

                  <button 
                    className="order-button" 
                    onClick={handlePlaceOrderClick}
                    disabled={isSubmitting}
                  >
                    <FiCheckCircle className="order-icon" />
                    {isSubmitting ? t('cart.submitting', 'Göndərilir...') : t('cart.orderNow', 'Sifariş et')}
                  </button>
                  
                  <p className="order-note">
                    {t('cart.orderNote', 'Sifarişiniz qəbul edildikdən sonra sizinlə əlaqə saxlayacağıq')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Missing Info Modal */}
      {showMissingInfoModal && (
        <div className="missing-info-modal-overlay" onClick={() => setShowMissingInfoModal(false)}>
          <div className="missing-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="missing-info-modal-header">
              <FiAlertCircle className="missing-info-icon" />
              <h3>{t('cart.missingInfoTitle', 'Məlumatlar tam deyil')}</h3>
              <button className="missing-info-close" onClick={() => setShowMissingInfoModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="missing-info-modal-body">
              <p>{t('cart.missingInfoMessage', 'Sifarişi tamamlamaq üçün aşağıdakı məlumatları doldurmalısınız:')}</p>
              <ul className="missing-fields-list">
                {missingFields.map(field => (
                  <li key={field} className="missing-field-item">
                    <span className="missing-field-bullet">•</span>
                    <span className="missing-field-name">{getMissingFieldLabel(field)}</span>
                    <span className="missing-field-warning">{t('cart.required', '(vacib)')}</span>
                  </li>
                ))}
              </ul>
              <button className="missing-info-button" onClick={openAccountSettings}>
                {t('cart.goToSettings', 'Hesab parametrlərinə keç')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartModal;