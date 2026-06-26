import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";

// ========================================
// DEVELOPMENT MODE YOXLAMASI (console.log üçün)
// ========================================
const isDevelopment = process.env.NODE_ENV !== 'production';

// Şərtli log funksiyası (yalnız development-də yazır)
const devLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

const devError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

// ========================================
// İstifadəçi və ya Admin tokenini yoxlamaq üçün
// ========================================
export const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Admin modelində yoxla
      let user = await Admin.findById(decoded.id).select('email name role');
      
      if (user) {
        user = user.toObject();
      }
      
      // Admin deyilsə, User modelində yoxla
      if (!user) {
        user = await User.findById(decoded.id).select('email name phone address');
        if (user) {
          user = user.toObject();
          user.role = 'user';
        }
      }
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'İcazə yoxdur, token keçərsiz' });
      }
      
      // req.user-ə həm _id, həm də id əlavə et
      req.user = {
        ...user,
        id: user._id,
        _id: user._id
      };
      
      // ✅ YALNIZ DEVELOPMENT-də log yaz
      devLog('✅ Auth olunan istifadəçi:', req.user.email, 'Rolu:', req.user.role);
      devLog('✅ User ID:', req.user._id);
      
      next();
    } catch (error) {
      devError(error);
      return res.status(401).json({ success: false, message: 'İcazə yoxdur, token keçərsiz' });
    }
  }
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'İcazə yoxdur, token tapılmadı' });
  }
};

// ========================================
// Yalnız Admin üçün middleware
// ========================================
export const admin = (req, res, next) => {
  devLog('🔍 Admin check - User role:', req.user?.role);
  
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    devLog('✅ Admin icazəsi verildi');
    next();
  } else {
    devLog('❌ Admin icazəsi rədd edildi');
    res.status(403).json({ success: false, message: 'İcazə yoxdur, yalnız adminlər' });
  }
};

// ========================================
// Köhnə auth middleware-i (geriyə uyğunluq üçün)
// ========================================
export const auth = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ message: "Token tapılmadı. Giriş edin!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded.admin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token etibarsızdır!" });
  }
};