// middleware/auth.js - VERCEL ÜÇÜN TAM DÜZGÜN VERSİYA
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";

// ========================================
// DEVELOPMENT MODE YOXLAMASI
// ========================================
const isDevelopment = process.env.NODE_ENV !== 'production';
const isVercel = process.env.VERCEL === 'true';

// Şərtli log funksiyası (yalnız development-də və lokalda yazır)
const devLog = (...args) => {
  if (isDevelopment && !isVercel) {
    console.log(...args);
  }
};

const devError = (...args) => {
  if (isDevelopment && !isVercel) {
    console.error(...args);
  }
};

// ========================================
// İstifadəçi və ya Admin tokenini yoxlamaq üçün
// ========================================
export const protect = async (req, res, next) => {
  let token;
  
  // 1. Authorization header-dan token al
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // 2. x-auth-token header-dan token al (köhnə sistemlər üçün)
  if (!token && req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }
  
  // 3. Token yoxdursa
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'İcazə yoxdur, token tapılmadı' 
    });
  }
  
  try {
    // 4. Token-i verify et
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 5. İstifadəçi ID-sini al
    const userId = decoded.id || decoded._id || decoded.userId || decoded.sub;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'İcazə yoxdur, token keçərsiz' 
      });
    }
    
    // 6. Admin modelində yoxla
    let user = await Admin.findById(userId)
      .select('email name role _id')
      .lean();
    
    // 7. Admin deyilsə, User modelində yoxla
    if (!user) {
      user = await User.findById(userId)
        .select('email name phone address _id')
        .lean();
      
      if (user) {
        user.role = 'user';
      }
    }
    
    // 8. İstifadəçi tapılmadı
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'İcazə yoxdur, istifadəçi tapılmadı' 
      });
    }
    
    // 9. req.user-ə əlavə et
    req.user = {
      ...user,
      id: user._id,
      _id: user._id
    };
    
    // 10. Log yaz (yalnız lokal development-də)
    devLog('✅ Auth olunan istifadəçi:', req.user.email, 'Rolu:', req.user.role);
    
    next();
    
  } catch (error) {
    devError('❌ Auth error:', error.message);
    
    // 11. Token xətalarını idarə et
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'İcazə yoxdur, token keçərsiz' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'İcazə yoxdur, token müddəti bitmişdir' 
      });
    }
    
    // 12. Digər xətalar
    return res.status(500).json({ 
      success: false, 
      message: 'Server xətası' 
    });
  }
};

// ========================================
// Yalnız Admin üçün middleware
// ========================================
export const admin = (req, res, next) => {
  // 1. İstifadəçi yoxdursa
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'İcazə yoxdur, əvvəlcə daxil olun' 
    });
  }
  
  // 2. Admin rollarını yoxla
  const adminRoles = ['admin', 'super_admin'];
  
  if (adminRoles.includes(req.user.role)) {
    devLog('✅ Admin icazəsi verildi:', req.user.email);
    next();
  } else {
    devLog('❌ Admin icazəsi rədd edildi:', req.user?.email, 'Rolu:', req.user?.role);
    res.status(403).json({ 
      success: false, 
      message: 'İcazə yoxdur, yalnız adminlər üçün' 
    });
  }
};

// ========================================
// Köhnə auth middleware-i (geriyə uyğunluq üçün)
// ========================================
export const auth = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Token tapılmadı. Giriş edin!" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded.admin || decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token müddəti bitmişdir!" 
      });
    }
    res.status(401).json({ 
      success: false, 
      message: "Token etibarsızdır!" 
    });
  }
};

// ========================================
// İsteğe bağlı: İstifadəçi rolu yoxlaması (çox rollu)
// ========================================
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'İcazə yoxdur, əvvəlcə daxil olun' 
      });
    }
    
    if (roles.includes(req.user.role)) {
      devLog('✅ Rol icazəsi verildi:', req.user.role);
      next();
    } else {
      devLog('❌ Rol icazəsi rədd edildi:', req.user.role);
      res.status(403).json({ 
        success: false, 
        message: `İcazə yoxdur, tələb olunan rol: ${roles.join(' və ya ')}` 
      });
    }
  };
};