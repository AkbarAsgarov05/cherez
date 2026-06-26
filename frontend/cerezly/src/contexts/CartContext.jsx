import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { t } = useTranslation();
  
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const sessionBackup = sessionStorage.getItem('cerezly_cart_backup');
        if (sessionBackup) {
          const parsed = JSON.parse(sessionBackup);
          if (parsed.length > 0) {
            return parsed;
          }
        }
        
        const savedCart = localStorage.getItem('cerezly_cart');
        if (savedCart) {
          return JSON.parse(savedCart);
        }
        return [];
      } catch (error) {
        return [];
      }
    }
    return [];
  });

  const [stockWarnings, setStockWarnings] = useState({});
  
  let lastNotificationTime = 0;
  let lastNotificationMessage = '';

  const saveToStorage = (cartData) => {
    if (typeof window !== 'undefined') {
      try {
        const cartJson = JSON.stringify(cartData);
        localStorage.setItem('cerezly_cart', cartJson);
        sessionStorage.setItem('cerezly_cart_backup', cartJson);
      } catch (error) {
        console.error('Save error:', error);
      }
    }
  };

  useEffect(() => {
    saveToStorage(cart);
  }, [cart]);

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        try {
          const sessionBackup = sessionStorage.getItem('cerezly_cart_backup');
          if (sessionBackup) {
            const restoredCart = JSON.parse(sessionBackup);
            if (restoredCart.length !== cart.length) {
              setCart(restoredCart);
            }
          }
        } catch (e) {
          console.error('bfcache restore error:', e);
        }
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [cart]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const sessionBackup = sessionStorage.getItem('cerezly_cart_backup');
          if (sessionBackup) {
            const savedCart = JSON.parse(sessionBackup);
            if (JSON.stringify(savedCart) !== JSON.stringify(cart)) {
              setCart(savedCart);
            }
          }
        } catch (e) {
          console.error('Visibility change error:', e);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [cart]);

  const getUnitLabel = (unitType) => {
    return unitType === 'kg' ? (t('cart.kg') || 'kq') : (t('cart.piece') || 'ədəd');
  };

  const formatStockMessage = (productName, availableStock, unitType) => {
    const unit = unitType === 'kg' ? 'kq' : 'ədəd';
    if (availableStock <= 0) {
      return t('cart.stockOut', { productName, defaultValue: `${productName} məhsulunun stoku bitib` });
    }
    return t('cart.stockRemaining', { 
      productName, 
      availableStock, 
      unit,
      defaultValue: `${productName} məhsulundan stokda ${availableStock} ${unit} qalıb` 
    });
  };

  const checkProductStock = async (productId, requiredQuantity, unitType) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`);
      if (!response.ok) return { available: false, stock: 0 };
      
      const product = await response.json();
      const available = product.stock >= requiredQuantity;
      
      return { 
        available, 
        stock: product.stock,
        productName: product.name,
        unitType: product.unitType || 'kg'
      };
    } catch (error) {
      console.error('Stok yoxlama xətası:', error);
      return { available: true, stock: 999, productName: '', unitType: 'kg' };
    }
  };

  const validateCartStock = async () => {
    const warnings = {};
    let hasStockIssue = false;
    const warningMessages = [];
    
    for (const item of cart) {
      const requiredQuantity = item.unitType === 'piece' ? (item.totalPieces || 0) : ((item.totalGrams || 0) / 1000);
      const stockCheck = await checkProductStock(item.productId, requiredQuantity, item.unitType);
      
      if (!stockCheck.available) {
        warnings[item.productId] = {
          productName: item.nameSnapshot,
          requiredQuantity: requiredQuantity,
          availableStock: stockCheck.stock,
          unitType: item.unitType,
          currentQuantity: item.unitType === 'piece' ? item.totalPieces : item.totalGrams
        };
        warningMessages.push(`${item.nameSnapshot}: stokda ${stockCheck.stock} ${item.unitType === 'kg' ? 'kq' : 'ədəd'} qalıb`);
        hasStockIssue = true;
      }
    }
    
    setStockWarnings(warnings);
    
    if (hasStockIssue && warningMessages.length > 0) {
      const now = Date.now();
      const combinedMessage = `${t('cart.stockWarningTitle', '⚠️ Aşağıdakı məhsulların stoku azalıb')}:\n${warningMessages.join('\n')}`;
      
      if (now - lastNotificationTime > 3000 || lastNotificationMessage !== combinedMessage) {
        lastNotificationTime = now;
        lastNotificationMessage = combinedMessage;
        return { hasStockIssue, warnings, combinedMessage };
      }
      return { hasStockIssue, warnings, combinedMessage: null };
    }
    
    return { hasStockIssue, warnings, combinedMessage: null };
  };

  // ✅ DÜZƏLDİLMİŞ: Məhsulu səbətə əlavə et
  const addToCart = async (product, quantity, selectedPrice, unitType, showWarningCallback) => {
    const productId = String(product.id);
    const unitTypeValue = unitType || product.unitType || 'kg';
    
    let pricePerUnit;
    if (unitTypeValue === 'kg') {
      pricePerUnit = product.pricePerKg || product.price || 0;
    } else {
      pricePerUnit = selectedPrice / quantity;
    }
    
    const requiredQuantity = unitTypeValue === 'piece' ? quantity : (quantity / 1000);
    
    console.log('📦 addToCart - product:', product.name, 'quantity:', quantity, 'selectedPrice:', selectedPrice, 'pricePerUnit:', pricePerUnit, 'unitType:', unitTypeValue);
    
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`);
      if (response.ok) {
        const productData = await response.json();
        
        if (productData.stock < requiredQuantity) {
          const stockText = formatStockMessage(product.name, productData.stock, unitTypeValue);
          const warningMessage = t('cart.reduceQuantity', { stockText, defaultValue: `${stockText}. Zəhmət olmasa miqdarı azaldın.` });
          
          if (showWarningCallback) {
            showWarningCallback(warningMessage, 'error');
          }
          return false;
        }
      }
    } catch (error) {
      console.error('Stok yoxlama xətası:', error);
    }
    
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        item => item.productId === productId
      );
      
      const snapshotItem = {
        productId: productId,
        nameSnapshot: product.name,
        priceSnapshot: pricePerUnit,
        imgSnapshot: product.img || product.image || null,
        category: product.category,
        unitType: unitTypeValue,
        totalGrams: unitTypeValue === 'kg' ? quantity : 0,
        totalPieces: unitTypeValue === 'piece' ? quantity : 0,
        totalPrice: selectedPrice,
        addedAt: new Date().toISOString()
      };
      
      let newCart;
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];
        
        if (unitTypeValue === 'kg') {
          const newTotalGrams = (existingItem.totalGrams || 0) + quantity;
          const newTotalPrice = newTotalGrams * (pricePerUnit / 1000);
          updatedCart[existingItemIndex] = {
            ...existingItem,
            totalGrams: newTotalGrams,
            totalPrice: newTotalPrice
          };
        } else {
          const newTotalPieces = (existingItem.totalPieces || 0) + quantity;
          const newTotalPrice = newTotalPieces * pricePerUnit;
          updatedCart[existingItemIndex] = {
            ...existingItem,
            totalPieces: newTotalPieces,
            totalPrice: newTotalPrice
          };
        }
        newCart = updatedCart;
      } else {
        newCart = [...prevCart, snapshotItem];
      }
      
      saveToStorage(newCart);
      return newCart;
    });
    
    return true;
  };

  // ✅ DÜZƏLDİLMİŞ: Miqdar artır
  const incrementQuantity = async (productId, showWarningCallback) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return false;
    
    const incrementAmount = item.unitType === 'kg' ? 100 : 1;
    const newQuantity = item.unitType === 'kg' 
      ? (item.totalGrams || 0) + incrementAmount 
      : (item.totalPieces || 0) + incrementAmount;
    
    const requiredQuantity = item.unitType === 'kg' ? newQuantity / 1000 : newQuantity;
    
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`);
      if (response.ok) {
        const productData = await response.json();
        
        if (productData.stock < requiredQuantity) {
          const stockText = formatStockMessage(item.nameSnapshot, productData.stock, item.unitType);
          const warningMessage = t('cart.reduceQuantity', { stockText, defaultValue: `${stockText}. Zəhmət olmasa miqdarı azaldın.` });
          
          if (showWarningCallback) {
            showWarningCallback(warningMessage, 'error');
          }
          return false;
        }
      }
    } catch (error) {
      console.error('Stok yoxlama xətası:', error);
    }
    
    setCart(prevCart => {
      const newCart = prevCart.map(item => {
        if (item.productId === productId) {
          let newTotalGrams = item.totalGrams || 0;
          let newTotalPieces = item.totalPieces || 0;
          let newTotalPrice;
          
          if (item.unitType === 'kg') {
            newTotalGrams = (item.totalGrams || 0) + 100;
            newTotalPrice = newTotalGrams * (item.priceSnapshot / 1000);
          } else {
            newTotalPieces = (item.totalPieces || 0) + 1;
            newTotalPrice = newTotalPieces * item.priceSnapshot;
          }
          
          return {
            ...item,
            totalGrams: newTotalGrams,
            totalPieces: newTotalPieces,
            totalPrice: newTotalPrice
          };
        }
        return item;
      });
      saveToStorage(newCart);
      return newCart;
    });
    
    return true;
  };

  // ✅ DÜZƏLDİLMİŞ: Miqdar azalt
  const decrementQuantity = (productId) => {
    setCart(prevCart => {
      const newCart = prevCart.map(item => {
        if (item.productId === productId) {
          let newTotalGrams = item.totalGrams || 0;
          let newTotalPieces = item.totalPieces || 0;
          let newTotalPrice;
          
          if (item.unitType === 'kg') {
            newTotalGrams = Math.max(100, (item.totalGrams || 0) - 100);
            newTotalPrice = newTotalGrams * (item.priceSnapshot / 1000);
          } else {
            newTotalPieces = Math.max(1, (item.totalPieces || 0) - 1);
            newTotalPrice = newTotalPieces * item.priceSnapshot;
          }
          
          return {
            ...item,
            totalGrams: newTotalGrams,
            totalPieces: newTotalPieces,
            totalPrice: newTotalPrice
          };
        }
        return item;
      }).filter(item => {
        if (item.unitType === 'kg') return (item.totalGrams || 0) >= 100;
        return (item.totalPieces || 0) >= 1;
      });
      
      saveToStorage(newCart);
      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.productId !== productId);
      saveToStorage(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setStockWarnings({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cerezly_cart');
      sessionStorage.removeItem('cerezly_cart_backup');
      sessionStorage.removeItem('cerezly_cart_guest');
    }
  };

  const refreshCartStock = async () => {
    return await validateCartStock();
  };

  // ✅ Təhlükəsiz hesablama funksiyaları
  const getProductCount = () => cart.length;
  const getTotalItems = () => cart.length;
  
  const getTotalQuantity = () => {
    return cart.reduce((total, item) => {
      if (item.unitType === 'kg') {
        return total + (item.totalGrams || 0);
      } else {
        return total + (item.totalPieces || 0);
      }
    }, 0);
  };
  
  // ✅ DÜZƏLDİLMİŞ: Float dəqiqlik xətasını aradan qaldırır
  const getTotalPrice = () => {
    const total = cart.reduce((sum, item) => {
      return sum + (item.totalPrice || 0);
    }, 0);
    // 2 onluq xanaya yuvarlaqlaşdır (175.00000000000003 -> 175.00)
    return Math.round(total * 100) / 100;
  };
  
  const getItemQuantityDisplay = (item) => {
    if (!item) return '0';
    
    if (item.unitType === 'kg') {
      const grams = item.totalGrams || 0;
      if (grams >= 1000) {
        const kgValue = grams / 1000;
        if (Number.isInteger(kgValue)) {
          return `${kgValue} ${getUnitLabel('kg')}`;
        }
        return `${kgValue.toFixed(2)} ${getUnitLabel('kg')}`;
      }
      return `${grams} ${t('cart.gr') || 'qr'}`;
    } else {
      const pieces = item.totalPieces || 0;
      return `${pieces} ${getUnitLabel('piece')}`;
    }
  };
  
  const getItemPriceDisplay = (item) => {
    if (!item || item.totalPrice === undefined || item.totalPrice === null) {
      return '0.00';
    }
    return item.totalPrice.toFixed(2);
  };
  
  const getPricePerUnit = (item) => {
    if (!item || item.priceSnapshot === undefined || item.priceSnapshot === null) {
      return '0.00';
    }
    return item.priceSnapshot.toFixed(2);
  };

  const getCartItemCount = () => cart.length;
  const isCartEmpty = () => cart.length === 0;

  const incrementWeight = (productId, showWarningCallback) => {
    return incrementQuantity(productId, showWarningCallback);
  };
  
  const decrementWeight = (productId) => {
    return decrementQuantity(productId);
  };
  
  const getTotalGrams = () => getTotalQuantity();
  const getItemWeightDisplay = (item) => getItemQuantityDisplay(item);
  const getPricePerKg = (item) => getPricePerUnit(item);

  const mergeCart = (guestCart) => {
    if (!guestCart || guestCart.length === 0) return;
    
    setCart(prevCart => {
      const mergedCart = [...prevCart];
      
      guestCart.forEach(guestItem => {
        const existingIndex = mergedCart.findIndex(
          item => item.productId === guestItem.productId
        );
        
        if (existingIndex > -1) {
          const existingItem = mergedCart[existingIndex];
          if (guestItem.unitType === 'kg') {
            mergedCart[existingIndex] = {
              ...existingItem,
              totalGrams: (existingItem.totalGrams || 0) + (guestItem.totalGrams || 0),
              totalPrice: ((existingItem.totalGrams || 0) + (guestItem.totalGrams || 0)) * (existingItem.priceSnapshot / 1000)
            };
          } else {
            mergedCart[existingIndex] = {
              ...existingItem,
              totalPieces: (existingItem.totalPieces || 0) + (guestItem.totalPieces || 0),
              totalPrice: ((existingItem.totalPieces || 0) + (guestItem.totalPieces || 0)) * existingItem.priceSnapshot
            };
          }
        } else {
          mergedCart.push(guestItem);
        }
      });
      
      saveToStorage(mergedCart);
      return mergedCart;
    });
  };

  const clearGuestCart = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cerezly_cart_guest');
      localStorage.removeItem('cerezly_cart_guest');
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      incrementWeight,
      decrementWeight,
      incrementQuantity,
      decrementQuantity,
      clearCart,
      getProductCount,
      getTotalItems,
      getTotalGrams,
      getTotalQuantity,
      getTotalPrice,
      getItemWeightDisplay,
      getItemQuantityDisplay,
      getItemPriceDisplay,
      getPricePerKg,
      getPricePerUnit,
      getCartItemCount,
      isCartEmpty,
      mergeCart,
      clearGuestCart,
      stockWarnings,
      refreshCartStock,
      validateCartStock
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};