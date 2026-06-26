// admin-panel/src/utils/cloudinary.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CLOUD_NAME = 'dgqbzlqey';
const UPLOAD_PRESET = 'admin_uploads';

// ✅ Cloudinary URL-ni proxy URL-ə çevir (Tracking Prevention üçün)
export const getProxyUrl = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;
  
  // Əgər artıq proxy URL-dirsə, olduğu kimi qaytar
  if (cloudinaryUrl.includes('/api/uploads/')) {
    return cloudinaryUrl;
  }
  
  // Əgər default şəkildirsə
  if (cloudinaryUrl.includes('default') || cloudinaryUrl.includes('placeholder')) {
    return cloudinaryUrl;
  }
  
  // Əgər Cloudinary URL-dirsə
  if (cloudinaryUrl.includes('cloudinary.com')) {
    try {
      // URL-dən filename-i çıxar (son hissə)
      let filename = cloudinaryUrl.split('/').pop();
      filename = filename.split('?')[0];
      
      // Hansı tip şəkil olduğunu müəyyən et
      let type = 'product';
      if (cloudinaryUrl.includes('/campaigns/')) {
        type = 'campaign';
      } else if (cloudinaryUrl.includes('/blogs/')) {
        type = 'blog';
      }
      
      return `${API_URL}/uploads/${type}-image/${encodeURIComponent(filename)}`;
    } catch (error) {
      console.error('Proxy URL xətası:', error);
      return cloudinaryUrl;
    }
  }
  
  return cloudinaryUrl;
};

// Tək şəkil yükləmə
export const uploadImageToCloudinary = async (file, folder = 'products') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    const data = await response.json();
    
    if (response.ok && data.secure_url) {
      console.log(`✅ Şəkil yükləndi (${folder}):`, data.secure_url);
      return data.secure_url;
    } else {
      console.error('❌ Cloudinary xətası:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Şəkil yüklənmədi:', error);
    return null;
  }
};

// Çoxlu şəkil yükləmə
export const uploadMultipleImages = async (files, onProgress, folder = 'products') => {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(i + 1, files.length);
    const url = await uploadImageToCloudinary(files[i], folder);
    if (url) results.push(url);
  }
  return results;
};

// Şəkli kiçiltmə
export const resizeImage = (file, maxWidth = 800, maxHeight = 800) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
          resolve(resizedFile);
        }, 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};