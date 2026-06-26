// services/userStatsService.js
import User from '../models/User.js';
import Order from '../models/Order.js';

/**
 * İstifadəçinin ümumi xərcini və sifariş sayını hesablayır
 * @param {string} phone - İstifadəçinin telefon nömrəsi
 * @returns {Promise<{totalSpent: number, orderCount: number}>}
 */
export const calculateUserStatsByPhone = async (phone) => {
  try {
    // İstifadəçinin tamamlanmış sifarişlərini tap
    const completedOrders = await Order.find({
      phone: phone,
      status: 'completed'
    });
    
    const orderCount = completedOrders.length;
    const totalSpent = completedOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    
    return { totalSpent, orderCount };
  } catch (error) {
    console.error('Statistika hesablama xətası (phone):', error);
    return { totalSpent: 0, orderCount: 0 };
  }
};

/**
 * İstifadəçinin ümumi xərcini və sifariş sayını hesablayır
 * @param {string} userId - İstifadəçinin ID-si
 * @returns {Promise<{totalSpent: number, orderCount: number}>}
 */
export const calculateUserStatsById = async (userId) => {
  try {
    // İstifadəçinin tamamlanmış sifarişlərini tap
    const completedOrders = await Order.find({
      customerId: userId,
      status: 'completed'
    });
    
    const orderCount = completedOrders.length;
    const totalSpent = completedOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    
    return { totalSpent, orderCount };
  } catch (error) {
    console.error('Statistika hesablama xətası (id):', error);
    return { totalSpent: 0, orderCount: 0 };
  }
};

/**
 * İstifadəçinin ümumi xərcini yeniləyir (telefon nömrəsi ilə)
 * @param {string} phone - İstifadəçinin telefon nömrəsi
 * @returns {Promise<{success: boolean, totalSpent: number, orderCount: number}>}
 */
export const updateUserTotalSpentByPhone = async (phone) => {
  try {
    // Telefon nömrəsi ilə istifadəçini tap
    const user = await User.findOne({ phone });
    if (!user) {
      console.log(`İstifadəçi tapılmadı: ${phone}`);
      return { success: false, totalSpent: 0, orderCount: 0 };
    }
    
    // Statistikaları hesabla
    const { totalSpent, orderCount } = await calculateUserStatsByPhone(phone);
    
    // İstifadəçini yenilə
    user.totalSpent = totalSpent;
    user.orderCount = orderCount;
    await user.save();
    
    console.log(`✅ İstifadəçi ${user.phone} (${user.name}) üçün xərc yeniləndi: ${totalSpent} AZN, ${orderCount} sifariş`);
    
    return { success: true, totalSpent, orderCount };
  } catch (error) {
    console.error('Xərc yeniləmə xətası (phone):', error);
    return { success: false, totalSpent: 0, orderCount: 0 };
  }
};

/**
 * İstifadəçinin ümumi xərcini yeniləyir (ID ilə)
 * @param {string} userId - İstifadəçinin ID-si
 * @returns {Promise<{success: boolean, totalSpent: number, orderCount: number}>}
 */
export const updateUserTotalSpentById = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`İstifadəçi tapılmadı: ${userId}`);
      return { success: false, totalSpent: 0, orderCount: 0 };
    }
    
    // Statistikaları hesabla
    const { totalSpent, orderCount } = await calculateUserStatsById(userId);
    
    // İstifadəçini yenilə
    user.totalSpent = totalSpent;
    user.orderCount = orderCount;
    await user.save();
    
    console.log(`✅ İstifadəçi ${user.phone} (${user.name}) üçün xərc yeniləndi: ${totalSpent} AZN, ${orderCount} sifariş`);
    
    return { success: true, totalSpent, orderCount };
  } catch (error) {
    console.error('Xərc yeniləmə xətası (id):', error);
    return { success: false, totalSpent: 0, orderCount: 0 };
  }
};

/**
 * Bütün istifadəçilərin statistikalarını yeniləyir
 * @returns {Promise<{updated: number, errors: number}>}
 */
export const updateAllUsersStats = async () => {
  try {
    const users = await User.find();
    let updated = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        const { totalSpent, orderCount } = await calculateUserStatsByPhone(user.phone);
        user.totalSpent = totalSpent;
        user.orderCount = orderCount;
        await user.save();
        updated++;
      } catch (err) {
        console.error(`Xəta: ${user.phone}`, err);
        errors++;
      }
    }
    
    console.log(`✅ Bütün istifadəçilər yeniləndi: ${updated} uğurlu, ${errors} xəta`);
    return { updated, errors };
  } catch (error) {
    console.error('Bütün istifadəçiləri yeniləmə xətası:', error);
    return { updated: 0, errors: 1 };
  }
};

// Default export
export default {
  calculateUserStatsByPhone,
  calculateUserStatsById,
  updateUserTotalSpentByPhone,
  updateUserTotalSpentById,
  updateAllUsersStats
};