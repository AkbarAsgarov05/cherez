import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { protect, admin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { sendResetPasswordCode, sendEmailChangeVerification, sendEmailChangeNotification } from '../utils/email.js';

const router = express.Router();

// ========== PROFİL VƏ ŞİFRƏ ROUTELARI (ƏN YUXARIDA) ==========

// @desc    İstifadəçi öz profilini yeniləyir
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, firstName, lastName, email, phone, address, paymentMethod } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }
    
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Bu email artıq istifadə olunur' });
      }
      user.email = email;
    }
    
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'Bu telefon nömrəsi artıq istifadə olunur' });
      }
      user.phone = phone;
    }
    
    if (firstName !== undefined || lastName !== undefined) {
      user.firstName = firstName !== undefined ? firstName : user.firstName;
      user.lastName = lastName !== undefined ? lastName : user.lastName;
      user.name = `${user.firstName} ${user.lastName}`.trim();
    } else if (name) {
      user.name = name;
      const nameParts = name.trim().split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    if (address !== undefined) {
      if (typeof address === 'string') {
        user.address = { street: address, city: '', state: '', zipCode: '', country: '' };
      } else {
        user.address = address;
      }
    }
    
    if (paymentMethod) {
      user.paymentMethod = paymentMethod;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profil məlumatları yeniləndi',
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        paymentMethod: user.paymentMethod,
        status: user.status,
        forcePasswordChange: user.forcePasswordChange || false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// ========== DÜZƏLDİLMİŞ ŞİFRƏ DƏYİŞDİRMƏ ENDPOINT-İ ==========
// @desc    İstifadəçi öz şifrəsini dəyişir
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    console.log("=========================================");
    console.log("🔐 ŞİFRƏ DƏYİŞDİRMƏ CƏHDİ");
    console.log("User ID:", req.user._id);
    
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      console.log("❌ İstifadəçi tapılmadı");
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }
    
    console.log("✅ İstifadəçi tapıldı:", user.email);
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log("🔑 Cari şifrə uyğunluğu:", isMatch);
    
    if (!isMatch) {
      console.log("❌ Cari şifrə yanlışdır");
      return res.status(400).json({ success: false, message: 'Cari şifrə yanlışdır' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    console.log("🔐 Yeni hash-lənmiş şifrə yaradıldı");
    
    // ✅ findByIdAndUpdate ilə yenilə (daha etibarlı)
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          password: hashedPassword,
          forcePasswordChange: false
        }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      console.log("❌ Yeniləmə uğursuz oldu");
      return res.status(500).json({ success: false, message: 'Şifrə yenilənmədi' });
    }
    
    console.log("✅ Şifrə uğurla dəyişdirildi!");
    console.log("📝 forcePasswordChange:", updatedUser.forcePasswordChange);
    console.log("=========================================");
    
    res.json({
      success: true,
      message: 'Şifrə uğurla dəyişdirildi'
    });
  } catch (error) {
    console.error("❌ Şifrə dəyişdirmə xətası:", error);
    res.status(500).json({ success: false, message: 'Server xətası: ' + error.message });
  }
});

// ========== ADMIN ROUTELARI (yalnız adminlər üçün) ==========

const calculateUserStats = async (user) => {
  const completedOrders = await Order.find({
    $or: [
      { customerId: user._id },
      { phone: user.phone }
    ],
    status: 'completed'
  });
  
  const orderCount = completedOrders.length;
  const totalSpent = completedOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
  
  return { orderCount, totalSpent };
};

// @desc    Bütün istifadəçiləri gətir (Admin üçün)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    const users = await User.find(filter)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpire -forcePasswordChange')
      .sort({ registerDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const { orderCount, totalSpent } = await calculateUserStats(user);
      
      return {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        registerDate: user.registerDate,
        status: user.status,
        avatar: user.avatar,
        orders: orderCount,
        totalSpent: totalSpent,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        paymentMethod: user.paymentMethod
      };
    }));
    
    res.json({
      success: true,
      users: usersWithStats,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// @desc    Tək istifadəçini gətir
// @route   GET /api/users/:id
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpire -forcePasswordChange');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }
    
    const { orderCount, totalSpent } = await calculateUserStats(user);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        registerDate: user.registerDate,
        status: user.status,
        avatar: user.avatar,
        orders: orderCount,
        totalSpent: totalSpent,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        address: user.address,
        paymentMethod: user.paymentMethod
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// @desc    İstifadəçini yenilə (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, firstName, lastName, email, phone, status, totalSpent, orderCount } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }
    
    if (firstName !== undefined || lastName !== undefined) {
      user.firstName = firstName !== undefined ? firstName : user.firstName;
      user.lastName = lastName !== undefined ? lastName : user.lastName;
      user.name = `${user.firstName} ${user.lastName}`.trim();
    } else if (name) {
      user.name = name;
      const nameParts = name.trim().split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (status) user.status = status;
    
    if (totalSpent !== undefined) user.totalSpent = totalSpent;
    if (orderCount !== undefined) user.orderCount = orderCount;
    
    await user.save();
    
    const { orderCount: newOrderCount, totalSpent: newTotalSpent } = await calculateUserStats(user);
    
    res.json({
      success: true,
      message: 'İstifadəçi məlumatları yeniləndi',
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        orders: newOrderCount,
        totalSpent: newTotalSpent
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// @desc    İstifadəçinin statusunu dəyiş
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Yanlış status dəyəri' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }
    
    user.status = status;
    await user.save();
    
    res.json({
      success: true,
      message: `İstifadəçi statusu ${status} olaraq dəyişdirildi`,
      status: user.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// ✅ YENİ - EMAİL DƏYİŞMƏ SORĞUSU (ADMIN)
router.post('/:id/request-email-change', protect, admin, async (req, res) => {
  try {
    const { newEmail } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }
    
    // Yeni email artıq istifadə olunurmu?
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Bu email artıq istifadə olunur' });
    }
    
    // Token yarat (32 bayt random string)
    const changeToken = crypto.randomBytes(32).toString('hex');
    const changeExpires = new Date();
    changeExpires.setHours(changeExpires.getHours() + 1); // 1 saat
    
    // Pending məlumatları saxla
    user.pendingEmail = newEmail.toLowerCase();
    user.emailChangeToken = changeToken;
    user.emailChangeExpires = changeExpires;
    user.emailChangeRequestedBy = req.user._id;
    await user.save();
    
    // ✅ FRONTEND_URL - SİZİN ÜNVANINIZA UYĞUN
    const frontendUrl = 'http://192.168.1.72:5173';
    const verifyLink = `${frontendUrl}/verify-email-change?token=${changeToken}`;
    const cancelLink = `${frontendUrl}/cancel-email-change?token=${changeToken}`;
    
    console.log('🔗 Təsdiq linki:', verifyLink);
    console.log('🔗 Ləğv linki:', cancelLink);
    
    // 1. YENİ EMAİLƏ TƏSDİQ LİNKİ GÖNDƏR
    await sendEmailChangeVerification(newEmail, user.name, verifyLink);
    
    // 2. KÖHNƏ EMAİLƏ XƏBƏRDARLIQ GÖNDƏR
    await sendEmailChangeNotification(user.email, user.name, cancelLink);
    
    res.json({
      success: true,
      message: `Təsdiq linki ${newEmail} ünvanına göndərildi. Köhnə emailə də xəbərdarlıq göndərildi.`
    });
    
  } catch (error) {
    console.error('Email dəyişmə xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// ✅ ŞİFRƏ SIFIRLAMA ENDPOINT-İ (Admin panel üçün)
router.post('/:id/reset-password', protect, admin, async (req, res) => {
  try {
    const tempPassword = Math.random().toString(36).slice(-8);
    console.log('🔑 YARANAN MÜVƏQQƏTİ ŞİFRƏ:', tempPassword);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    console.log('🔐 HASH EDİLMİŞ ŞİFRƏ:', hashedPassword);
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          password: hashedPassword,
          forcePasswordChange: true
        }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }
    
    console.log('✅ Şifrə yeniləndi - İstifadəçi:', updatedUser.email);
    
    try {
      await sendResetPasswordCode(updatedUser.email, tempPassword, updatedUser.name);
      console.log(`✅ Email göndərildi: ${updatedUser.email}`);
    } catch (emailError) {
      console.error(`❌ Email göndərilə bilmədi: ${updatedUser.email}`, emailError.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Şifrə sıfırlandı',
      tempPassword: tempPassword
    });
    
  } catch (error) {
    console.error('❌ Şifrə sıfırlama xətası:', error);
    res.status(500).json({ success: false, message: 'Server xətası: ' + error.message });
  }
});

// @desc    İstifadəçini sil (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
    }
    
    await user.deleteOne();
    
    res.json({ success: true, message: 'İstifadəçi silindi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// @desc    İstifadəçi statistikası (Admin)
// @route   GET /api/users/stats/all
// @access  Private/Admin
router.get('/stats/all', protect, admin, async (req, res) => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ status: 'active' });
    const inactive = await User.countDocuments({ status: 'inactive' });
    const blocked = await User.countDocuments({ status: 'blocked' });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ registerDate: { $gte: thirtyDaysAgo } });
    
    res.json({
      success: true,
      stats: {
        total,
        active,
        inactive,
        blocked,
        newUsers
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

export default router;