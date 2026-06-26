// backend/models/Blog.js
import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Sağlamlıq', 'Qidalanma', 'Təbii Qarışıqlar', 'Gözəllik', 'Reseptlər', 'İdman', 'Uşaqlar', 'Vegan']
    },
    status: {
        type: String,
        enum: ['published', 'draft'],
        default: 'draft'
    },
    image: {
        type: String,
        default: null
    },
    readTime: {
        type: Number,
        default: 5
    },
    views: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

blogSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;