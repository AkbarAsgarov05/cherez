// backend/routes/blog.js
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Blog from '../models/Blog.js';
import { uploadBlogImage } from './uploads.js'; // ✅ Cloudinary upload (upload.js-dən)

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== BLOG ROUTES ==========

// GET /api/blogs - Bütün blog yazılarını get (filtrləmə ilə)
router.get('/', async (req, res) => {
    try {
        const { status, category, search, limit } = req.query;
        let filter = {};
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (category && category !== 'all') {
            filter.category = category;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }
        
        let query = Blog.find(filter).sort({ createdAt: -1 });
        
        if (limit && !isNaN(limit)) {
            query = query.limit(parseInt(limit));
        }
        
        const blogs = await query;
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/blogs/:id - Tək blog yazısını get (baxış sayını artır)
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog tapılmadı' });
        }
        
        // Baxış sayını artır (yalnız published statusda)
        if (blog.status === 'published') {
            blog.views += 1;
            await blog.save();
        }
        
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ✅ DƏYİŞDİRİLDİ - Yeni blog yazısı yarat (Cloudinary ilə)
router.post('/', uploadBlogImage.single('image'), async (req, res) => {
    try {
        let blogData;
        
        if (req.body.data) {
            blogData = JSON.parse(req.body.data);
        } else {
            blogData = req.body;
        }
        
        // Cloudinary URL-i saxla (req.file.path Cloudinary URL-idir)
        const blog = new Blog({
            ...blogData,
            image: req.file ? req.file.path : null // Cloudinary URL
        });
        
        const savedBlog = await blog.save();
        res.status(201).json(savedBlog);
    } catch (error) {
        console.error('Blog yaratma xətası:', error);
        res.status(400).json({ message: error.message });
    }
});

// ✅ DƏYİŞDİRİLDİ - Blog yazısını yenilə (Cloudinary ilə)
router.put('/:id', uploadBlogImage.single('image'), async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog tapılmadı' });
        }
        
        let updateData;
        if (req.body.data) {
            updateData = JSON.parse(req.body.data);
        } else {
            updateData = req.body;
        }
        
        // Yeni şəkil yüklənibsə, Cloudinary URL-i istifadə et
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            {
                ...updateData,
                image: req.file ? req.file.path : blog.image, // Cloudinary URL
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );
        
        res.json(updatedBlog);
    } catch (error) {
        console.error('Blog yeniləmə xətası:', error);
        res.status(400).json({ message: error.message });
    }
});

// ✅ DƏYİŞDİRİLDİ - Blog yazısını sil (Cloudinary şəkil silmə opsional)
router.delete('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog tapılmadı' });
        }
        
        // İstəyirsinizsə Cloudinary-dən şəkli silə bilərsiniz
        // Bunun üçün cloudinary import etməlisiniz
        // if (blog.image && blog.image.includes('cloudinary')) {
        //     const publicId = blog.image.split('/').slice(-2).join('/').split('.')[0];
        //     await cloudinary.uploader.destroy(publicId);
        // }
        
        await Blog.findByIdAndDelete(req.params.id);
        res.json({ message: 'Blog uğurla silindi' });
    } catch (error) {
        console.error('Blog silmə xətası:', error);
        res.status(500).json({ message: error.message });
    }
});

// PATCH /api/blogs/:id/status - Blog statusunu dəyiş
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['published', 'draft'].includes(status)) {
            return res.status(400).json({ message: 'Yanlış status dəyəri' });
        }
        
        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!blog) {
            return res.status(404).json({ message: 'Blog tapılmadı' });
        }
        
        res.json(blog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET /api/blogs/stats/summary - Blog statistikası
router.get('/stats/summary', async (req, res) => {
    try {
        const total = await Blog.countDocuments();
        const published = await Blog.countDocuments({ status: 'published' });
        const draft = await Blog.countDocuments({ status: 'draft' });
        const totalViews = await Blog.aggregate([
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        
        const categoryStats = await Blog.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        res.json({
            total,
            published,
            draft,
            totalViews: totalViews[0]?.total || 0,
            categoryStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;