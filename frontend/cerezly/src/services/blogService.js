// frontend/src/services/blogService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ✅ Cloudinary URL-ni proxy URL-ə çevir (Tracking Prevention üçün)
const getProxyUrl = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;
  
  // Əgər artıq proxy URL-dirsə, olduğu kimi qaytar
  if (cloudinaryUrl.includes('/api/uploads/')) {
    return cloudinaryUrl;
  }
  
  // Əgər default şəkildirsə
  if (cloudinaryUrl.includes('default') || cloudinaryUrl.includes('default-campaign')) {
    return cloudinaryUrl;
  }
  
  // Cloudinary URL-dən filename-i çıxar
  try {
    // Blog şəkilləri üçün: /blogs/filename.png
    const blogMatch = cloudinaryUrl.match(/\/blogs\/([^\/]+\.(jpg|jpeg|png|gif|webp))/i);
    if (blogMatch) {
      const filename = blogMatch[1];
      return `${API_URL}/uploads/blog-image/${encodeURIComponent(filename)}`;
    }
    
    // Kampaniya şəkilləri üçün: /campaigns/filename.jpg
    const campaignMatch = cloudinaryUrl.match(/\/campaigns\/([^\/]+\.(jpg|jpeg|png|gif|webp))/i);
    if (campaignMatch) {
      const filename = campaignMatch[1];
      return `${API_URL}/uploads/campaign-image/${encodeURIComponent(filename)}`;
    }
    
    // Heç nə tapılmadısa, olduğu kimi qaytar
    return cloudinaryUrl;
  } catch (error) {
    console.error('Proxy URL xətası:', error);
    return cloudinaryUrl;
  }
};

export const blogService = {
  // Bütün blogları get (filtrləmə ilə)
  async getBlogs(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      
      const url = `${API_URL}/blogs${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Bloqlar yüklənə bilmədi');
      }
      
      const data = await response.json();
      
      // ✅ Hər blogun şəkil URL-ni proxy-ə çevir
      return data.map(blog => ({
        ...blog,
        image: blog.image ? getProxyUrl(blog.image) : null
      }));
    } catch (error) {
      console.error('Get blogs error:', error);
      throw error;
    }
  },

  // Yalnız published blogları get (istifadəçi üçün)
  async getPublishedBlogs(filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('status', 'published');
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      
      const url = `${API_URL}/blogs${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Bloglar yüklənə bilmədi');
      }
      
      const data = await response.json();
      
      // ✅ Hər blogun şəkil URL-ni proxy-ə çevir
      return data.map(blog => ({
        ...blog,
        image: blog.image ? getProxyUrl(blog.image) : null
      }));
    } catch (error) {
      console.error('Get published blogs error:', error);
      throw error;
    }
  },

  // Tək blog get (baxış sayını artırır)
  async getBlogById(id) {
    try {
      const response = await fetch(`${API_URL}/blogs/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Blog tapılmadı');
        }
        throw new Error('Blog yüklənə bilmədi');
      }
      
      const data = await response.json();
      
      // ✅ Blogun şəkil URL-ni proxy-ə çevir
      return {
        ...data,
        image: data.image ? getProxyUrl(data.image) : null
      };
    } catch (error) {
      console.error('Get blog by id error:', error);
      throw error;
    }
  },

  // Kateqoriya statistikası
  async getCategoryStats() {
    try {
      const response = await fetch(`${API_URL}/blogs/stats/summary`);
      
      if (!response.ok) {
        throw new Error('Statistika yüklənə bilmədi');
      }
      return await response.json();
    } catch (error) {
      console.error('Get category stats error:', error);
      throw error;
    }
  },

  // Admin üçün - yeni blog yarat
  async createBlog(blogData, imageFile) {
    try {
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);
      formData.append('data', JSON.stringify(blogData));
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/blogs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Blog yaradılmadı');
      }
      return await response.json();
    } catch (error) {
      console.error('Create blog error:', error);
      throw error;
    }
  },

  // Admin üçün - blog yenilə
  async updateBlog(id, blogData, imageFile) {
    try {
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);
      formData.append('data', JSON.stringify(blogData));
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/blogs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Blog yenilənmədi');
      }
      return await response.json();
    } catch (error) {
      console.error('Update blog error:', error);
      throw error;
    }
  },

  // Admin üçün - blog sil
  async deleteBlog(id) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Blog silinmədi');
      }
      return await response.json();
    } catch (error) {
      console.error('Delete blog error:', error);
      throw error;
    }
  },

  // Admin üçün - blog statusunu dəyiş
  async updateBlogStatus(id, status) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/blogs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Status dəyişdirilə bilmədi');
      }
      return await response.json();
    } catch (error) {
      console.error('Update blog status error:', error);
      throw error;
    }
  }
};