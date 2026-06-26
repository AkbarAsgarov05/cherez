// backend/server.js - TAM DÜZGÜN VERSİYA

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cors from "cors";
import cron from "node-cron";
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import crypto from 'crypto';

import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/product.js";
import categoryRoutes from "./routes/categories.js";
import orderRoutes from "./routes/orders.js";
import messageRoutes from "./routes/messages.js";
import campaignRoutes from "./routes/campaigns.js";
import blogRoutes from "./routes/blog.js";
import uploadRoutes from "./routes/uploads.js";
import dashboardRoutes from "./routes/dashboard.js";
import Admin from "./models/Admin.js";
import Campaign from "./models/Campaign.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// 1. HELMET.js - CUSTOM CONFIG (Cloudinary üçün)
// ========================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
          "https://*.cloudinary.com",
          "http://localhost:5000",
          "http://localhost:5173"
        ],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// ========================================
// 2. CORS - BÜTÜN İCAZƏLƏR (DEVELOPMENT ÜÇÜN)
// ========================================
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
  }));
  console.log('⚠️ CORS: Bütün origin-lərə icazə verilir (DEVELOPMENT MODE)');
} else {
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
    : ['http://192.168.1.72:5173', 'http://192.168.1.72:5174'];
  
  app.use(cors({
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`❌ CORS bloklandı: ${origin}`);
        callback(new Error('CORS policy violation'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
  }));
  console.log(`🔒 CORS: Yalnız ${allowedOrigins.join(', ')} icazə verilir`);
}

// ========================================
// 3. JSON limiti
// ========================================
app.use(express.json({ limit: '5mb' }));

// Static fayllar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================================
// 4. RATE LIMITING
// ========================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Çox sorğu göndərdiniz. 15 dəqiqə gözləyin.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path.startsWith('/api/admin') && req.method === 'GET';
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Çox uğursuz cəhd. 15 dəqiqə gözləyin.' }
});

const adminOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Çox əməliyyat göndərdiniz. 15 dəqiqə gözləyin.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.method === 'GET';
  }
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Çox uğursuz admin giriş cəhdi. 15 dəqiqə gözləyin.' }
});

// ========================================
// 5. RATE LIMIT TƏTBİQ ET
// ========================================
app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin/login', adminLoginLimiter);

app.use('/api/admin', adminOperationLimiter);
app.use('/api/products', adminOperationLimiter);
app.use('/api/categories', adminOperationLimiter);
app.use('/api/users', adminOperationLimiter);
app.use('/api/orders', adminOperationLimiter);
app.use('/api/campaigns', adminOperationLimiter);
app.use('/api/blogs', adminOperationLimiter);
app.use('/api/messages', adminOperationLimiter);

// ========================================
// 6. MONGODB CONNECTION
// ========================================
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
})
.then(async () => {
  console.log("✅ MongoDB qoşuldu");

  const adminExists = await Admin.findOne({ email: "admin@example.com" });
  if (!adminExists) {
    const isProduction = process.env.NODE_ENV === 'production';
    let defaultPassword;
    
    if (isProduction) {
      defaultPassword = crypto.randomBytes(8).toString('hex');
      console.log('========================================');
      console.log(`🔐 ADMIN PANEL ŞİFRƏSİ: ${defaultPassword}`);
      console.log('📧 Email: admin@example.com');
      console.log('⚠️ BU ŞİFRƏNİ TƏHLÜKƏSİZ YERDƏ SAXLAYIN!');
      console.log('========================================');
    } else {
      defaultPassword = "admin123";
      console.log('⚠️ DEVELOPMENT: admin şifrəsi "admin123" istifadə olunur');
    }
    
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    await Admin.create({
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      name: "Super Admin"
    });
    console.log("✅ Default admin yaradıldı");
  }

  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Kampaniya tarix yoxlaması başladı...');
    
    try {
      const now = new Date();
      
      const expiredResult = await Campaign.updateMany(
        {
          endDate: { $lt: now },
          status: { $ne: 'completed' }
        },
        { status: 'completed' }
      );
      
      const inactiveResult = await Campaign.updateMany(
        {
          startDate: { $gt: now },
          status: 'active'
        },
        { status: 'inactive' }
      );
      
      if (expiredResult.modifiedCount > 0) {
        console.log(`✅ ${expiredResult.modifiedCount} kampaniya bitirildi`);
      }
      if (inactiveResult.modifiedCount > 0) {
        console.log(`✅ ${inactiveResult.modifiedCount} kampaniya deaktiv edildi`);
      }
    } catch (error) {
      console.error('❌ Cron xətası:', error);
    }
  });
  
  console.log('⏰ Cron job başladı - Hər gün 00:00-da kampaniya tarixləri yoxlanacaq');

})
.catch(err => {
  console.log("❌ MongoDB xətası:", err);
  if (err.name === 'MongooseServerSelectionError') {
    console.log('🔄 MongoDB bağlantısı zaman aşımı.');
  }
});

// ========================================
// 7. ROUTES
// ========================================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ✅ UPLOADS ROUTE
app.use('/api/uploads', uploadRoutes);

// Ana route
app.get("/", (req, res) => {
  res.send("API işləyir...");
});

// ========================================
// 8. ERROR HANDLER
// ========================================
app.use((err, req, res, next) => {
  if (err.message === 'CORS policy violation') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu domain-dən sorğu göndərmək icazəniz yoxdur' 
    });
  }
  next(err);
});

// Serveri başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portda işləyir`);
  console.log(`🔒 Təhlükəsizlik aktiv: Helmet | Rate Limit | Admin Rate Limit | CORS | Timeout`);
  console.log(`📊 Rate Limit qaydaları:`);
  console.log(`   - Ümumi: 200 sorğu/15 dəq`);
  console.log(`   - Auth (istifadəçi): 10 cəhd/15 dəq`);
  console.log(`   - Admin login: 5 cəhd/15 dəq`);
  console.log(`   - Admin əməliyyatları: 50 əməliyyat/15 dəq`);
});