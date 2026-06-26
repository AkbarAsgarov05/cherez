import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { sendResetPasswordCode, sendEmailChangeVerification, sendEmailChangeNotification } from "../utils/email.js";

const router = express.Router();

// ========== ADMIN LOGIN ==========
// @desc    Admin girişi
// @route   POST /api/auth/admin-login
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Admin login cəhdi:', email);
    
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      console.log('❌ Admin tapılmadı:', email);
      return res.status(401).json({ success: false, message: "Email və ya şifrə yanlışdır" });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('🔑 Şifrə doğrulandı?', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email və ya şifrə yanlışdır" });
    }
    
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: admin.role || 'admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('✅ Admin token yaradıldı:', admin.email);
    
    res.json({
      success: true,
      token,
      accessToken: token,
      user: {
        id: admin._id,
        name: admin.name || admin.username || 'Admin',
        email: admin.email,
        role: admin.role || 'admin'
      }
    });
  } catch (error) {
    console.error("Admin login xətası:", error);
    res.status(500).json({ success: false, message: "Server xətası" });
  }
});

// ========== İSTİFADƏÇİ LOGIN ==========
// @desc    İstifadəçi girişi
// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Email və ya şifrə yanlışdır" });
    }
    
    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Hesabınız bloklanıb. Dəstək ilə əlaqə saxlayın" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email və ya şifrə yanlışdır" });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
    
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, isRefreshToken: true },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    user.refreshToken = refreshToken;
    await user.save();
    
    res.json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: 1800,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'user',
        status: user.status,
        registerDate: user.registerDate,
        forcePasswordChange: user.forcePasswordChange || false
      }
    });
  } catch (error) {
    console.error("Login xətası:", error);
    res.status(500).json({ success: false, message: "Server xətası" });
  }
});

// ========== İSTİFADƏÇİ QEYDİYYAT ==========
// @desc    İstifadəçi qeydiyyatı
// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Bu email artıq qeydiyyatdan keçib" });
    }
    
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: "Bu telefon nömrəsi artıq qeydiyyatdan keçib" });
    }
    
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      status: "active",
      registerDate: new Date()
    });
    
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
    
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, isRefreshToken: true },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    user.refreshToken = refreshToken;
    await user.save();
    
    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: 1800,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'user',
        status: user.status,
        registerDate: user.registerDate,
        forcePasswordChange: false
      }
    });
  } catch (error) {
    console.error("Register xətası:", error);
    res.status(500).json({ success: false, message: "Server xətası" });
  }
});

// ========== REFRESH TOKEN ==========
// @desc    Refresh Token ilə yeni Access Token almaq
// @route   POST /api/auth/refresh-token
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token tapılmadı" });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    if (!decoded.isRefreshToken) {
      return res.status(401).json({ success: false, message: "Keçərsiz refresh token" });
    }
    
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: "Keçərsiz refresh token" });
    }
    
    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
    
    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: 1800
    });
  } catch (error) {
    console.error("Refresh token xətası:", error);
    res.status(401).json({ success: false, message: "Keçərsiz refresh token" });
  }
});

// ========== İSTİFADƏÇİ MƏLUMATLARI ==========
// @desc    İstifadəçi məlumatlarını gətir (token ilə)
// @route   GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Token tapılmadı" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Əvvəlcə Admin yoxla
    let user = await Admin.findById(decoded.id).select("-password");
    let role = 'admin';
    
    // Admin deyilsə User yoxla
    if (!user) {
      user = await User.findById(decoded.id).select("-password");
      role = 'user';
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: "İstifadəçi tapılmadı" });
    }
    
    res.json({ 
      success: true, 
      user: {
        ...user.toObject(),
        role: role,
        forcePasswordChange: user.forcePasswordChange || false
      }
    });
  } catch (error) {
    console.error("Auth me xətası:", error);
    res.status(401).json({ success: false, message: "Token keçərsiz" });
  }
});

// ========== EMAİL DƏYİŞMƏ TƏSDİQİ ==========
// @desc    Yeni emailə gələn link ilə təsdiq etmə
// @route   GET /api/auth/verify-email-change
router.get("/verify-email-change", async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ success: false, message: "Token tapılmadı" });
    }
    
    const user = await User.findOne({
      emailChangeToken: token,
      emailChangeExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: "Token keçərsizdir və ya vaxtı keçib" });
    }
    
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailChangeToken = null;
    user.emailChangeExpires = null;
    user.emailVerified = true;
    await user.save();
    
    user.refreshToken = null;
    await user.save();
    
    res.json({
      success: true,
      message: "Email uğurla dəyişdirildi. Zəhmət olmasa yeni email ilə yenidən daxil olun."
    });
    
  } catch (error) {
    console.error("Email təsdiq xətası:", error);
    res.status(500).json({ success: false, message: "Server xətası" });
  }
});

// @desc    Email dəyişmə ləğvi (Köhnə emaildən)
// @route   GET /api/auth/cancel-email-change
router.get("/cancel-email-change", async (req, res) => {
  try {
    const { token } = req.query;
    
    const user = await User.findOne({ emailChangeToken: token });
    
    if (!user) {
      return res.status(400).json({ success: false, message: "Token keçərsizdir" });
    }
    
    user.pendingEmail = null;
    user.emailChangeToken = null;
    user.emailChangeExpires = null;
    user.emailChangeRequestedBy = null;
    await user.save();
    
    res.json({
      success: true,
      message: "Email dəyişmə əməliyyatı ləğv edildi. Hesabınız təhlükəsizdir."
    });
    
  } catch (error) {
    console.error("Email ləğv xətası:", error);
    res.status(500).json({ success: false, message: "Server xətası" });
  }
});

// ========== ŞİFRƏ SIFIRLAMA (Forgot Password) ==========
// @desc    Şifrə sıfırlama üçün təsdiq kodu göndər
// @route   POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "Bu email ilə hesab tapılmadı" });
    }
    
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpire = new Date();
    resetCodeExpire.setMinutes(resetCodeExpire.getMinutes() + 10);
    
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpire = resetCodeExpire;
    await user.save();
    
    const emailSent = await sendResetPasswordCode(email, resetCode, user.name);
    
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: "Email göndərilərkən xəta baş verdi. Daha sonra yenidən cəhd edin." 
      });
    }
    
    console.log(`📧 Şifrə sıfırlama kodu (${email}): ${resetCode}`);
    
    res.json({
      success: true,
      message: "Təsdiq kodu email ünvanınıza göndərildi",
      resetToken: resetCode
    });
    
  } catch (error) {
    console.error("Forgot password xətası:", error);
    res.status(500).json({ success: false, message: "Server xətası" });
  }
});

// @desc    Şifrə sıfırlama (kodu təsdiq et və şifrəni yenilə)
// @route   POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    console.log(`🔐 Şifrə sıfırlama cəhdi: ${email}, kod: ${code}`);
    
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: code,
      resetPasswordExpire: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "Təsdiq kodu keçərsizdir və ya vaxtı bitib" 
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log(`🔑 Yeni şifrə hash-ləndi: ${email}`);
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpire: null,
          forcePasswordChange: false,
          refreshToken: null
        }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(500).json({ 
        success: false, 
        message: "Şifrə yenilənərkən xəta baş verdi" 
      });
    }
    
    console.log(`✅ Şifrə uğurla yeniləndi: ${email}`);
    
    res.json({
      success: true,
      message: "Şifrə uğurla yeniləndi"
    });
    
  } catch (error) {
    console.error("Reset password xətası:", error);
    res.status(500).json({ success: false, message: "Server xətası: " + error.message });
  }
});

// ========== LOGOUT ==========
// @desc    Logout - refresh token-i sil
// @route   POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded && decoded.id) {
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      }
    }
    
    res.json({ success: true, message: "Çıxış edildi" });
  } catch (error) {
    console.error("Logout xətası:", error);
    res.status(500).json({ success: false, message: "Server xətası" });
  }
});

export default router;