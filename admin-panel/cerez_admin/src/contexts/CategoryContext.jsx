import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const CategoryContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoryProvider');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      headers: {
        'x-auth-token': token
      }
    };
  };

  // Kateqoriyaları backend-dən yüklə
  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
      // Backup olaraq localStorage-a da saxla
      localStorage.setItem('categories_backup', JSON.stringify(response.data));
    } catch (err) {
      console.error('Kateqoriyalar yüklənərkən xəta:', err);
      // Xəta olarsa localStorage-dan oxu
      const savedCategories = localStorage.getItem('categories_backup');
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }
      setError('Kateqoriyalar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  // Yeni kateqoriya əlavə et (backend-ə)
  const addCategory = async (categoryData) => {
    try {
      const response = await axios.post(
        `${API_URL}/categories`,
        categoryData,
        getAuthHeaders()
      );
      const newCategory = response.data;
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      console.error('Kateqoriya əlavə edilərkən xəta:', err);
      throw new Error(err.response?.data?.message || 'Kateqoriya əlavə edilərkən xəta');
    }
  };

  // Kateqoriyanı yenilə (backend-də)
  const updateCategory = async (id, updatedData) => {
    try {
      const response = await axios.put(
        `${API_URL}/categories/${id}`,
        updatedData,
        getAuthHeaders()
      );
      const updatedCategory = response.data;
      setCategories(prev => prev.map(cat => cat._id === id ? updatedCategory : cat));
      return updatedCategory;
    } catch (err) {
      console.error('Kateqoriya yenilənərkən xəta:', err);
      throw new Error(err.response?.data?.message || 'Kateqoriya yenilənərkən xəta');
    }
  };

  // 🆕 DƏYİŞDİRİLMİŞ - Kateqoriyanı sil (backend-dən) - bağlı məhsullar da silinir
  const deleteCategory = async (id) => {
    try {
      const categoryToDelete = categories.find(cat => cat._id === id);
      const categoryName = categoryToDelete?.name;
      
      const response = await axios.delete(
        `${API_URL}/categories/${id}`, 
        getAuthHeaders()
      );
      
      // Local state-dən kateqoriyanı sil
      setCategories(prev => prev.filter(cat => cat._id !== id));
      
      // Uğurlu silmə məlumatlarını qaytar
      return { 
        success: true, 
        message: response.data.message,
        deletedCategory: response.data.deletedCategory || categoryName,
        deletedProductsCount: response.data.deletedProductsCount || 0
      };
    } catch (err) {
      console.error('Kateqoriya silinərkən xəta:', err);
      throw new Error(err.response?.data?.message || 'Kateqoriya silinərkən xəta');
    }
  };

  // Kateqoriya adını ID ilə tap
  const getCategoryNameById = (id) => {
    const category = categories.find(cat => cat._id === id);
    return category ? category.name : '';
  };

  // Kateqoriya ID-ni adla tap
  const getCategoryIdByName = (name) => {
    const category = categories.find(cat => cat.name === name);
    return category ? category._id : null;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const value = {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryNameById,
    getCategoryIdByName,
    refreshCategories: loadCategories
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};