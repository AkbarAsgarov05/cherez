// backend/routes/upload.js
import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== CLOUDINARY KONFİQURASİYASI ==========
// ✅ DƏYİŞDİRİLDİ: Default dəyərlər SİLİNDİ. .env-də olmasa xəta verir.
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY və CLOUDINARY_API_SECRET .env faylında təyin edilməlidir!');
  process.exit(1); // Cloudinary məlumatları yoxdursa server işə düşməsin
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('✅ Cloudinary hazırdır');

// ========== MULTER KONFİQURASİYASI (FormData üçün) ==========
const memoryStorage = multer.memoryStorage();
const upload = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Yalnız şəkil faylları (jpeg, jpg, png, gif, webp) yüklənə bilər!'));
    }
  }
});

// Kampaniya şəkilləri üçün storage
const campaignStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'campaigns',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 400, crop: 'fill' }]
  }
});

// Blog şəkilləri üçün storage
const blogStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blogs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 500, crop: 'fill' }]
  }
});

// Məhsul şəkilləri üçün storage
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'fill' }]
  }
});

export const uploadCampaignImage = multer({ storage: campaignStorage });
export const uploadBlogImage = multer({ storage: blogStorage });
export const uploadProductImage = multer({ storage: productStorage });

// ========== FORM DATA İLƏ FAYL YÜKLƏMƏ ==========

// Məhsul şəkli yükləmə
router.post('/cloudinary-file', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Şəkil faylı tapılmadı' });
    }
    
    const base64 = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;
    
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'products',
      transformation: [{ width: 800, height: 800, crop: 'fill' }]
    });
    
    console.log(`✅ Şəkil yükləndi: ${result.secure_url}`);
    res.json({ url: result.secure_url });
    
  } catch (error) {
    console.error('❌ Cloudinary yükləmə xətası:', error);
    res.status(500).json({ message: 'Şəkil yüklənərkən xəta', error: error.message });
  }
});

// Base64 ilə şəkil yükləmə (fallback)
router.post('/cloudinary', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'Şəkil məlumatı tapılmadı' });
    }
    
    const result = await cloudinary.uploader.upload(image, {
      folder: 'products',
      transformation: [{ width: 800, height: 800, crop: 'fill' }]
    });
    
    console.log(`✅ Base64 şəkil yükləndi: ${result.secure_url}`);
    res.json({ url: result.secure_url });
    
  } catch (error) {
    console.error('❌ Base64 yükləmə xətası:', error);
    res.status(500).json({ message: 'Şəkil yüklənərkən xəta', error: error.message });
  }
});

// ========== PROXY ROUTES ==========

// Kampaniya şəkilləri üçün proxy
router.get('/campaign-image/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/campaigns/${filename}`;
    
    console.log(`🖼️ Kampaniya proxy: ${filename}`);
    
    const response = await axios({
      method: 'get',
      url: cloudinaryUrl,
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Proxy/1.0)'
      }
    });
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
    
  } catch (error) {
    console.error('❌ Kampaniya proxy xətası:', error.message);
    res.status(404).json({ message: 'Şəkil tapılmadı' });
  }
});

// Blog şəkilləri üçün proxy
router.get('/blog-image/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/blogs/${filename}`;
    
    console.log(`🖼️ Blog proxy: ${filename}`);
    
    const response = await axios({
      method: 'get',
      url: cloudinaryUrl,
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Proxy/1.0)'
      }
    });
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
    
  } catch (error) {
    console.error('❌ Blog proxy xətası:', error.message);
    res.status(404).json({ message: 'Blog şəkli tapılmadı' });
  }
});

// Məhsul şəkilləri üçün proxy
router.get('/product-image/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/products/${filename}`;
    
    console.log(`🖼️ Məhsul proxy: ${filename}`);
    
    const response = await axios({
      method: 'get',
      url: cloudinaryUrl,
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Proxy/1.0)'
      }
    });
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
    
  } catch (error) {
    console.error('❌ Məhsul proxy xətası:', error.message);
    res.status(404).json({ message: 'Məhsul şəkli tapılmadı' });
  }
});

// Köhnə format proxy
router.get('/proxy/*', async (req, res) => {
  try {
    const fullPath = req.params[0];
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/${fullPath}`;
    
    console.log(`🖼️ Proxy (köhnə): ${fullPath}`);
    
    const response = await axios({
      method: 'get',
      url: cloudinaryUrl,
      responseType: 'stream',
      timeout: 10000
    });
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
    
  } catch (error) {
    console.error('❌ Köhnə proxy xətası:', error.message);
    res.status(404).json({ message: 'Şəkil tapılmadı' });
  }
});

// Default şəkil
router.get('/default-campaign.jpg', (req, res) => {
  const defaultImagePath = path.join(__dirname, '..', 'public', 'images', 'default-campaign.jpg');
  if (fs.existsSync(defaultImagePath)) {
    res.sendFile(defaultImagePath);
  } else {
    res.status(404).json({ message: 'Default şəkil tapılmadı' });
  }
});

export default router;