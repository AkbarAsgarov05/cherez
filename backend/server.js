// backend/server.js - VERCEL ÜÇÜN TAM DÜZƏLDİLMİŞ VERSİYA
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
// 1. HELMET
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
          "https://*.cloudinary.com"
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
// 2. CORS - BÜTÜN SORĞULARA İCAZƏ (TEST ÜÇÜN)
// ========================================
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === 'true';

// Production-da belə bütün origin-lərə icazə veririk (yalnız test üçün)
app.use(cors({
  origin: '*',  // ✅ BÜTÜN SORĞULARA İCAZƏ VERİR
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

console.log(`🌐 CORS: BÜTÜN ORIGIN-LƏRƏ İCAZƏ VERİLİR (${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'})`);

// ========================================
// 3. JSON
// ========================================
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ========================================
// 4. RATE LIMIT
// ========================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Çox sorğu göndərdiniz. 15 dəqiqə gözləyin.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/admin') && req.method === 'GET'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Çox uğursuz cəhd. 15 dəqiqə gözləyin.' }
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Çox uğursuz admin giriş cəhdi. 15 dəqiqə gözləyin.' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin/login', adminLoginLimiter);

// ========================================
// 5. ROUTES
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
app.use('/api/uploads', uploadRoutes);

// ========================================
// 6. HEALTH CHECK
// ========================================
app.get("/", (req, res) => {
  res.json({
    status: 'online',
    service: 'Cherez API',
    version: '1.0.0',
    environment: isProduction ? 'production' : 'development',
    platform: isVercel ? 'vercel' : 'local',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'connecting'
  });
});

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  res.json({
    status: 'OK',
    database: states[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ========================================
// 7. ERROR HANDLER
// ========================================
app.use((err, req, res, next) => {
  if (err.message === 'CORS policy violation') {
    return res.status(403).json({
      success: false,
      message: 'Bu domain-dən sorğu göndərmək icazəniz yoxdur'
    });
  }
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ========================================
// 8. MONGODB CONNECTION
// ========================================
let isDbConnected = false;

async function connectDB() {
  if (isDbConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    isDbConnected = true;
    console.log("✅ MongoDB connected");

    const adminExists = await Admin.findOne({ email: "admin@example.com" });
    if (!adminExists) {
      const defaultPassword = isProduction
        ? crypto.randomBytes(8).toString('hex')
        : "admin123";

      if (isProduction) {
        console.log('========================================');
        console.log(`🔐 ADMIN PASSWORD: ${defaultPassword}`);
        console.log('📧 Email: admin@example.com');
        console.log('========================================');
      }

      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await Admin.create({
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        name: "Super Admin"
      });
      console.log("✅ Default admin created");
    }

    if (!isVercel) {
      cron.schedule('0 0 * * *', async () => {
        console.log('🔄 Campaign date check...');
        try {
          const now = new Date();
          await Campaign.updateMany(
            { endDate: { $lt: now }, status: { $ne: 'completed' } },
            { status: 'completed' }
          );
          await Campaign.updateMany(
            { startDate: { $gt: now }, status: 'active' },
            { status: 'inactive' }
          );
        } catch (error) {
          console.error('❌ Cron error:', error);
        }
      });
      console.log('⏰ Cron job started');
    }

  } catch (error) {
    console.log("❌ MongoDB error:", error.message);
    isDbConnected = false;
    if (!isVercel) {
      throw error;
    }
  }
}

// ========================================
// 9. VERCEL EXPORT
// ========================================
export default async function handler(req, res) {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  return app(req, res);
}

// ========================================
// 10. LOKAL İŞLƏTMƏ
// ========================================
if (!isVercel) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portda işləyir`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('❌ Server başlada bilmədi:', err);
    process.exit(1);
  });
}