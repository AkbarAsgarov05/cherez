// services/products.js - BACKEND UYĞUN
import axios from 'axios';

// ✅ DÜZGÜN - Environment variable ilə
const API_URL = import.meta.env.VITE_API_URL || 'https://cherez.onrender.com/api';

// ============================================
// KÖMƏKÇİ FUNKSİYALAR
// ============================================

/**
 * Məhsul üçün avtomatik weights array-i yaradır (1 kq qiymətinə görə)
 * @param {Object} product - Məhsul məlumatları
 * @returns {Array} - weights array-i
 */
const generateWeights = (pricePerKg) => {
  const weightOptions = [
    { label: "100 qr", grams: 100 },
    { label: "250 qr", grams: 250 },
    { label: "500 qr", grams: 500 },
    { label: "750 qr", grams: 750 },
    { label: "1 kq", grams: 1000 },
    { label: "2 kq", grams: 2000 },
    { label: "5 kq", grams: 5000 }
  ];
  
  return weightOptions.map(option => ({
    label: option.label,
    grams: option.grams,
    price: parseFloat(((pricePerKg / 1000) * option.grams).toFixed(2))
  }));
};

/**
 * Backend-dən gələn məhsulu müştəri tərəfə uyğunlaşdırır
 */
const normalizeProduct = (product) => {
  const pricePerKg = product.price || product.pricePerKg || 0;
  const inStock = product.stock > 0;
  
  return {
    id: product._id || product.id,
    name: product.name,
    pricePerKg: pricePerKg,
    category: product.category || 'driedFruits',
    weights: product.weights || generateWeights(pricePerKg),
    img: product.image || product.img || product.images?.[0] || null,
    description: product.description || '',
    inStock: inStock,
    featured: product.featured || false,
    order: product.order || 0
  };
};

/**
 * Backend-dən gələn məhsul arrayini normallaşdırır
 */
const normalizeProducts = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map(normalizeProduct);
};

// ============================================
// MÜŞTƏRİ TƏRƏF API FUNKSİYALARI
// ============================================

/**
 * Bütün məhsulları backend-dən gətir
 * @param {object} params - Query parametrləri (search, category, page, limit)
 */
export const fetchProducts = async (params = {}) => {
  try {
    // URL parametrlərini qur
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.category && params.category !== 'all') queryParams.append('category', params.category);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.featured === 'true') queryParams.append('featured', 'true');
    
    const queryString = queryParams.toString();
    const url = `${API_URL}/products${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url);
    
    // Məhsullar array şəklində gəlir
    const products = Array.isArray(response.data) ? response.data : 
                    (response.data.products || response.data.data || []);
    
    return normalizeProducts(products);
  } catch (error) {
    console.error('Məhsullar yüklənərkən xəta:', error);
    throw error;
  }
};

/**
 * Tək məhsulu ID ilə backend-dən gətir
 */
export const fetchProductById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`);
    const product = response.data;
    return product ? normalizeProduct(product) : null;
  } catch (error) {
    console.error('Məhsul yüklənərkən xəta:', error);
    throw error;
  }
};

/**
 * Kateqoriyaya görə məhsulları backend-dən gətir
 */
export const fetchProductsByCategory = async (category) => {
  try {
    const response = await axios.get(`${API_URL}/products/category/${encodeURIComponent(category)}`);
    const products = Array.isArray(response.data) ? response.data : [];
    return normalizeProducts(products);
  } catch (error) {
    console.error('Kateqoriyaya görə məhsullar yüklənərkən xəta:', error);
    throw error;
  }
};

// ============================================
// ADMIN PANEL ÜÇÜN API FUNKSİYALARI (token tələb edir)
// ============================================

/**
 * Auth header əlavə edir
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    headers: {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    }
  };
};

/**
 * Admin - Bütün məhsulları gətir (CRUD üçün)
 */
export const fetchAllProductsForAdmin = async () => {
  try {
    const response = await axios.get(`${API_URL}/products`);
    return response.data;
  } catch (error) {
    console.error('Admin məhsullar yüklənərkən xəta:', error);
    throw error;
  }
};

/**
 * Admin - Yeni məhsul əlavə et
 */
export const createProduct = async (productData) => {
  try {
    const response = await axios.post(
      `${API_URL}/products`,
      productData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Məhsul yaradılarkən xəta:', error);
    throw error;
  }
};

/**
 * Admin - Məhsulu yenilə
 */
export const updateProduct = async (id, productData) => {
  try {
    const response = await axios.put(
      `${API_URL}/products/${id}`,
      productData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Məhsul yenilənərkən xəta:', error);
    throw error;
  }
};

/**
 * Admin - Məhsulu sil
 */
export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(
      `${API_URL}/products/${id}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Məhsul silinərkən xəta:', error);
    throw error;
  }
};

/**
 * Admin - Məhsulun stokunu yenilə
 */
export const updateProductStock = async (id, stock) => {
  try {
    const response = await axios.patch(
      `${API_URL}/products/${id}/stock`,
      { stock },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Stok yenilənərkən xəta:', error);
    throw error;
  }
};