import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// ✅ DÜZGÜN - Render URL-i
const API_URL = import.meta.env.VITE_API_URL || 'https://cherez.onrender.com/api';

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // Auth header
  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    };
  };

  // ✅ Məhsulları normallaşdır (unitType ilə)
  const normalizeProduct = (product) => {
    return {
      ...product,
      unitType: product.unitType || 'kg',
      pricePerKg: product.pricePerKg !== undefined ? product.pricePerKg : (product.price || 0),
      stock: product.stock !== undefined ? product.stock : 0
    };
  };

  // Məhsulları backend-dən yüklə
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products`);
      const normalizedProducts = response.data.map(p => normalizeProduct(p));
      const sortedProducts = sortProductsByFeatured(normalizedProducts);
      setProducts(sortedProducts);
      localStorage.setItem('products_backup', JSON.stringify(sortedProducts));
    } catch (err) {
      console.error('Məhsullar yüklənərkən xəta:', err);
      const savedProducts = localStorage.getItem('products_backup');
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        const normalizedProducts = parsedProducts.map(p => normalizeProduct(p));
        const sortedProducts = sortProductsByFeatured(normalizedProducts);
        setProducts(sortedProducts);
      } else {
        setError('Məhsullar yüklənərkən xəta baş verdi');
      }
    } finally {
      setLoading(false);
    }
  };

  // Featured məhsulları order-a görə sırala
  const sortProductsByFeatured = (productsList) => {
    const featuredProducts = productsList
      .filter(p => p.featured === true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const nonFeaturedProducts = productsList
      .filter(p => p.featured !== true)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return [...featuredProducts, ...nonFeaturedProducts];
  };

  // ✅ Yeni məhsul əlavə et (unitType dəstəkli)
  const addProduct = async (productData) => {
    try {
      let order = 0;
      if (productData.featured === true) {
        const existingFeaturedProducts = products.filter(p => p.featured === true);
        order = existingFeaturedProducts.length + 1;
      }
      
      const newProductData = { 
        ...productData, 
        order: order,
        unitType: productData.unitType || 'kg'  // ✅ unitType əlavə edildi
      };
      
      console.log('📦 Göndərilən məhsul:', newProductData);
      
      const response = await axios.post(
        `${API_URL}/products`,
        newProductData,
        getAuthHeaders()
      );
      
      const newProduct = normalizeProduct(response.data);
      
      setProducts(prev => {
        const updatedProducts = [newProduct, ...prev];
        return sortProductsByFeatured(updatedProducts);
      });
      
      return newProduct;
    } catch (err) {
      console.error('Məhsul əlavə edilərkən xəta:', err);
      throw new Error(err.response?.data?.message || 'Məhsul əlavə edilərkən xəta');
    }
  };

  // ✅ Məhsulu yenilə (unitType dəstəkli)
  const updateProduct = async (id, updatedData) => {
    try {
      const currentProduct = products.find(p => p._id === id);
      let finalUpdateData = { 
        ...updatedData,
        unitType: updatedData.unitType || currentProduct?.unitType || 'kg'  // ✅ unitType saxlanılır
      };
      
      if (currentProduct && updatedData.featured !== undefined && 
          currentProduct.featured !== updatedData.featured) {
        finalUpdateData = await recalculateOrdersOnStatusChange(currentProduct, updatedData.featured);
        finalUpdateData = { ...finalUpdateData, unitType: updatedData.unitType || currentProduct?.unitType || 'kg' };
      }
      
      const response = await axios.put(
        `${API_URL}/products/${id}`,
        finalUpdateData,
        getAuthHeaders()
      );
      
      const updatedProduct = normalizeProduct(response.data);
      
      setProducts(prev => {
        const updatedProducts = prev.map(p => p._id === id ? updatedProduct : p);
        return sortProductsByFeatured(updatedProducts);
      });
      
      return updatedProduct;
    } catch (err) {
      console.error('Məhsul yenilənərkən xəta:', err);
      throw new Error(err.response?.data?.message || 'Məhsul yenilənərkən xəta');
    }
  };

  // Featured status dəyişdikdə order-ları yenilə
  const recalculateOrdersOnStatusChange = async (currentProduct, newFeaturedStatus) => {
    if (newFeaturedStatus === true) {
      const featuredProducts = products.filter(p => p.featured === true);
      return { featured: true, order: featuredProducts.length + 1 };
    } else {
      const otherFeaturedProducts = products.filter(p => p.featured === true && p._id !== currentProduct._id);
      
      for (let i = 0; i < otherFeaturedProducts.length; i++) {
        const newOrder = i + 1;
        if (otherFeaturedProducts[i].order !== newOrder) {
          await axios.patch(
            `${API_URL}/products/${otherFeaturedProducts[i]._id}/order`,
            { order: newOrder },
            getAuthHeaders()
          );
        }
      }
      
      return { featured: false, order: 0 };
    }
  };

  // Featured məhsulların sırasını dəyiş (drag-drop üçün)
  const reorderFeaturedProducts = async (reorderedProductIds) => {
    try {
      for (let i = 0; i < reorderedProductIds.length; i++) {
        await axios.patch(
          `${API_URL}/products/${reorderedProductIds[i]}/order`,
          { order: i + 1 },
          getAuthHeaders()
        );
      }
      
      setProducts(prev => {
        const updatedProducts = prev.map(product => {
          const newIndex = reorderedProductIds.indexOf(product._id);
          if (newIndex !== -1 && product.featured === true) {
            return { ...product, order: newIndex + 1 };
          }
          return product;
        });
        return sortProductsByFeatured(updatedProducts);
      });
      
    } catch (err) {
      console.error('Sıralama yenilənərkən xəta:', err);
      throw new Error('Sıralama yenilənərkən xəta');
    }
  };

  // Məhsulu sil
  const deleteProduct = async (id) => {
    try {
      const productToDelete = products.find(p => p._id === id);
      
      await axios.delete(`${API_URL}/products/${id}`, getAuthHeaders());
      
      if (productToDelete?.featured === true) {
        const remainingFeaturedProducts = products
          .filter(p => p.featured === true && p._id !== id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        for (let i = 0; i < remainingFeaturedProducts.length; i++) {
          const newOrder = i + 1;
          if (remainingFeaturedProducts[i].order !== newOrder) {
            await axios.patch(
              `${API_URL}/products/${remainingFeaturedProducts[i]._id}/order`,
              { order: newOrder },
              getAuthHeaders()
            );
          }
        }
      }
      
      setProducts(prev => {
        const updatedProducts = prev.filter(p => p._id !== id);
        return sortProductsByFeatured(updatedProducts);
      });
    } catch (err) {
      console.error('Məhsul silinərkən xəta:', err);
      throw new Error(err.response?.data?.message || 'Məhsul silinərkən xəta');
    }
  };

  // Stok yenilə
  const updateStock = async (id, stock, reason = '') => {
    try {
      const response = await axios.patch(
        `${API_URL}/products/${id}/stock`,
        { stock, reason },
        getAuthHeaders()
      );
      const updatedProduct = normalizeProduct(response.data);
      setProducts(prev => prev.map(p => p._id === id ? updatedProduct : p));
      return updatedProduct;
    } catch (err) {
      console.error('Stok yenilənərkən xəta:', err);
      throw new Error(err.response?.data?.message || 'Stok yenilənərkən xəta');
    }
  };

  // Stok hərəkətlərini yüklə
  const getStockMovements = async (productId) => {
    try {
      const response = await axios.get(
        `${API_URL}/products/${productId}/stock-movements`,
        getAuthHeaders()
      );
      return response.data;
    } catch (err) {
      console.error('Stok hərəkətləri yüklənərkən xəta:', err);
      return [];
    }
  };

  // Bütün stok hərəkətlərini yüklə
  const getAllStockMovements = async (limit = 100) => {
    try {
      const response = await axios.get(
        `${API_URL}/products/stock-movements/all?limit=${limit}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (err) {
      console.error('Stok hərəkətləri yüklənərkən xəta:', err);
      return [];
    }
  };

  // Kateqoriyaları yüklə
  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (err) {
      console.error('Kateqoriyalar yüklənərkən xəta:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const value = {
    products,
    loading,
    error,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    reorderFeaturedProducts,
    getStockMovements,
    getAllStockMovements,
    refreshProducts: loadProducts
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};