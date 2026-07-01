// hooks/useProducts.js - UNIT TYPE DƏSTƏKLİ VERSİYA

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ✅ DÜZGÜN - Environment variable ilə
const API_URL = import.meta.env.VITE_API_URL || 'https://cherez.onrender.com/api';

// Backend-dən gələn məhsulu müştəri tərəfə uyğunlaşdır
const normalizeProductForCustomer = (product) => {
  // Stok məlumatını yoxla (backend-dən gəlir)
  const stockValue = product.stock !== undefined ? product.stock : 
                     (product.stockValue !== undefined ? product.stockValue : -1);
  
  // Stokda olub-olmadığını müəyyən et
  const inStock = stockValue === -1 ? true : stockValue > 0;
  
  // ✅ Unit type (kq/piece)
  const unitType = product.unitType || 'kg';
  
  // ✅ KİLOQRAM İLƏ SATILAN MƏHSULLAR ÜÇÜN
  const pricePerKg = product.price || product.pricePerKg || 0;
  const weights = [
    { label: "250 qr", grams: 250, price: +(pricePerKg * 0.25).toFixed(2) },
    { label: "500 qr", grams: 500, price: +(pricePerKg * 0.5).toFixed(2) },
    { label: "750 qr", grams: 750, price: +(pricePerKg * 0.75).toFixed(2) },
    { label: "1 kq", grams: 1000, price: pricePerKg },
    { label: "2 kq", grams: 2000, price: +(pricePerKg * 2).toFixed(2) },
    { label: "5 kq", grams: 5000, price: +(pricePerKg * 5).toFixed(2) }
  ];
  
  // ✅ ƏDƏD İLƏ SATILAN MƏHSULLAR ÜÇÜN
  const piecePrice = product.price || 0;
  
  return {
    id: product._id || product.id,
    name: product.name,
    pricePerKg: pricePerKg,        // kq üçün
    price: piecePrice,              // ədəd üçün
    img: product.image || product.img || product.images?.[0] || '/default-product.jpg',
    category: product.category,
    weights: weights,               // kq üçün çəki seçimləri
    desc: product.description || product.desc || '',
    tag: product.tag || '',
    featured: product.featured === true,
    inStock: inStock,
    order: product.order || 0,
    unitType: unitType,            // ✅ 'kg' və ya 'piece'
    stock: stockValue,             // ✅ Stok miqdarı
  };
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);           // Bütün məhsullar
  const [featuredProducts, setFeaturedProducts] = useState([]);  // Yalnız featured məhsullar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  /**
   * Bütün məhsulları backend-dən yüklə
   */
  const loadProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { category, search, page = 1, limit = 100 } = params;
      
      let url = `${API_URL}/products?page=${page}&limit=${limit}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await axios.get(url);
      
      const productsArray = Array.isArray(response.data) ? response.data : 
                           (response.data.products || response.data.data || []);
      
      // Bütün məhsulları normallaşdır
      const normalizedProducts = productsArray.map(normalizeProductForCustomer);
      setProducts(normalizedProducts);
      
      // Yalnız featured = true olan məhsulları ayır (ana səhifə üçün)
      const featured = normalizedProducts.filter(p => p.featured === true);
      setFeaturedProducts(featured);
      
      setTotalCount(normalizedProducts.length);
      return normalizedProducts;
    } catch (err) {
      console.error('Məhsullar yüklənərkən xəta:', err);
      setError(err.response?.data?.message || 'Məhsullar yüklənərkən xəta baş verdi');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tək məhsulu backend-dən yüklə
   */
  const loadProductById = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      if (response.data) {
        return normalizeProductForCustomer(response.data);
      }
      return null;
    } catch (err) {
      console.error('Məhsul yüklənərkən xəta:', err);
      return null;
    }
  }, []);

  /**
   * Kateqoriyaya görə məhsulları yüklə
   */
  const loadProductsByCategory = useCallback(async (category) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/products/category/${encodeURIComponent(category)}`);
      const productsArray = Array.isArray(response.data) ? response.data : [];
      const normalizedProducts = productsArray.map(normalizeProductForCustomer);
      setProducts(normalizedProducts);
      
      // Featured məhsulları da yenilə
      const featured = normalizedProducts.filter(p => p.featured === true);
      setFeaturedProducts(featured);
      
      setTotalCount(normalizedProducts.length);
      return normalizedProducts;
    } catch (err) {
      console.error('Kateqoriyaya görə məhsullar yüklənərkən xəta:', err);
      setError(err.response?.data?.message || 'Xəta baş verdi');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Məhsulları yenilə
   */
  const refreshProducts = useCallback(() => {
    return loadProducts();
  }, [loadProducts]);

  // İlk yüklənmə
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,           // Bütün məhsullar (AllProducts səhifəsi üçün)
    featuredProducts,   // Yalnız featured məhsullar (Ana səhifə üçün)
    loading,
    error,
    totalCount,
    loadProducts,
    loadProductById,
    loadProductsByCategory,
    refreshProducts
  };
};