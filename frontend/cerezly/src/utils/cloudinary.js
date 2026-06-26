// frontend/src/utils/cloudinary.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  
  // Əgər base64 və ya blob-dursa
  if (cloudinaryUrl.startsWith('data:') || cloudinaryUrl.startsWith('blob:')) {
    return cloudinaryUrl;
  }
  
  // Əgər yerli fayldırsa
  if (cloudinaryUrl.startsWith('/uploads/')) {
    return cloudinaryUrl;
  }
  
  // Cloudinary URL-dən filename-i çıxar
  try {
    // Məhsul şəkilləri üçün: /products/filename.jpg  və ya /v123/products/filename.jpg
    let productMatch = cloudinaryUrl.match(/\/products\/(?:v\d+\/)?([^\/]+\.(jpg|jpeg|png|gif|webp))/i);
    if (productMatch) {
      const filename = productMatch[1];
      return `${API_URL}/uploads/product-image/${encodeURIComponent(filename)}`;
    }
    
    // Blog şəkilləri üçün: /blogs/filename.png  və ya /v123/blogs/filename.png
    let blogMatch = cloudinaryUrl.match(/\/blogs\/(?:v\d+\/)?([^\/]+\.(jpg|jpeg|png|gif|webp))/i);
    if (blogMatch) {
      const filename = blogMatch[1];
      return `${API_URL}/uploads/blog-image/${encodeURIComponent(filename)}`;
    }
    
    // Kampaniya şəkilləri üçün: /campaigns/filename.jpg  və ya /v123/campaigns/filename.jpg
    let campaignMatch = cloudinaryUrl.match(/\/campaigns\/(?:v\d+\/)?([^\/]+\.(jpg|jpeg|png|gif|webp))/i);
    if (campaignMatch) {
      const filename = campaignMatch[1];
      return `${API_URL}/uploads/campaign-image/${encodeURIComponent(filename)}`;
    }
    
    // Köhnə format üçün (birbaşa proxy)
    const encodedUrl = encodeURIComponent(cloudinaryUrl);
    return `${API_URL}/uploads/proxy/${encodedUrl}`;
    
  } catch (error) {
    console.error('Proxy URL xətası:', error);
    return cloudinaryUrl;
  }
};

// ✅ DÜZGÜN: FormData ilə fayl yükləmə (Base64 YOX! - daha performanslı)
export const uploadImageToCloudinary = async (file) => {
  // Əgər base64 string gəlirsə, fayla çevir
  if (typeof file === 'string' && file.startsWith('data:')) {
    const fileObj = base64ToFile(file, 'image.jpg');
    return uploadFileToCloudinary(fileObj);
  }
  
  // Əgər File obyektidirsə, birbaşa yüklə
  if (file instanceof File) {
    return uploadFileToCloudinary(file);
  }
  
  console.error('Yanlış fayl tipi:', typeof file);
  return null;
};

// ✅ FormData ilə fayl yükləmə (ƏN YAXŞI ÜSUL)
export const uploadFileToCloudinary = async (file) => {
  if (!file) return null;
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`${API_URL}/uploads/cloudinary-file`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Yükləmə xətası');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Cloudinary fayl yükləmə xətası:', error);
    return null;
  }
};

// ✅ Base64 ilə yükləmə (yalnız fallback üçün)
export const uploadBase64ToCloudinary = async (base64Image) => {
  try {
    const response = await fetch(`${API_URL}/uploads/cloudinary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: base64Image })
    });
    
    if (!response.ok) {
      throw new Error('Yükləmə xətası');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Cloudinary base64 yükləmə xətası:', error);
    return null;
  }
};

// ✅ Şəkili ölçüləndir (File obyekti qaytarır)
export const resizeImage = (file, maxWidth, maxHeight) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(resizedFile);
        }, file.type);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// ✅ Base64-ni fayla çevir
export const base64ToFile = (base64, filename) => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// ✅ Cloudinary URL-dən fayl adını çıxar
export const getFilenameFromUrl = (url) => {
  if (!url) return null;
  
  try {
    const productMatch = url.match(/\/products\/(?:v\d+\/)?([^\/]+)$/);
    if (productMatch) return productMatch[1];
    
    const blogMatch = url.match(/\/blogs\/(?:v\d+\/)?([^\/]+)$/);
    if (blogMatch) return blogMatch[1];
    
    const campaignMatch = url.match(/\/campaigns\/(?:v\d+\/)?([^\/]+)$/);
    if (campaignMatch) return campaignMatch[1];
    
    return null;
  } catch (error) {
    console.error('Fayl adı çıxarma xətası:', error);
    return null;
  }
};

// ✅ Cloudinary URL-nin etibarlı olub olmadığını yoxla
export const isValidCloudinaryUrl = (url) => {
  if (!url) return false;
  return url.includes('res.cloudinary.com') || url.includes('/api/uploads/');
};

// ✅ Şəkil yükləmək üçün asan istifadə funksiyası
export const uploadImage = async (file, options = {}) => {
  const { resize = true, maxWidth = 800, maxHeight = 800 } = options;
  
  try {
    let imageFile = file;
    
    // Şəkili ölçüləndir
    if (resize && imageFile instanceof File) {
      imageFile = await resizeImage(imageFile, maxWidth, maxHeight);
    }
    
    // Cloudinary-ə yüklə
    const url = await uploadFileToCloudinary(imageFile);
    return url;
  } catch (error) {
    console.error('Şəkil yükləmə xətası:', error);
    return null;
  }
};

export default {
  getProxyUrl,
  uploadImageToCloudinary,
  uploadFileToCloudinary,
  uploadBase64ToCloudinary,
  resizeImage,
  base64ToFile,
  getFilenameFromUrl,
  isValidCloudinaryUrl,
  uploadImage
};