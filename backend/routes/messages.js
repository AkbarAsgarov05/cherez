import express from "express";
import Message from "../models/Message.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// ========== ADMIN ROUTES (YALNIZ ADMIN ÜÇÜN) ==========

// Bütün mesajları getir
router.get('/', protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search || '';
    
    const skip = (page - 1) * limit;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // ✅ DÜZƏLDİLMİŞ AXTARIŞ - regex ilə qismən uyğunluq
    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { subject: searchRegex },
        { message: searchRegex }
      ];
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Message.countDocuments(query);
    const unreadCount = await Message.countDocuments({ status: 'unread' });
    const readCount = await Message.countDocuments({ status: 'read' });
    
    res.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        unreadCount,
        totalCount: total,
        readCount
      }
    });
  } catch (error) {
    console.error('Mesajları getirərkən xəta:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Tək mesajı getir
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Mesaj tapılmadı' });
    }
    res.json({ success: true, message });
  } catch (error) {
    console.error('Mesaj getirərkən xəta:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Mesajı oxundu olaraq işarələ
router.put('/:id/read', protect, admin, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Mesaj tapılmadı' });
    }
    message.status = 'read';
    await message.save();
    res.json({ success: true, message: 'Mesaj oxundu olaraq işarələndi' });
  } catch (error) {
    console.error('Mesaj statusu yenilənərkən xəta:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Bütün mesajları oxundu olaraq işarələ
router.put('/read-all', protect, admin, async (req, res) => {
  try {
    const result = await Message.updateMany({ status: 'unread' }, { status: 'read' });
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} mesaj oxundu olaraq işarələndi` 
    });
  } catch (error) {
    console.error('Mesajlar yenilənərkən xəta:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Mesajı sil
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Mesaj tapılmadı' });
    }
    await message.deleteOne();
    res.json({ success: true, message: 'Mesaj uğurla silindi' });
  } catch (error) {
    console.error('Mesaj silinərkən xəta:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Çoxlu mesaj sil
router.post('/bulk-delete', protect, admin, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Silinəcək mesajlar seçilməyib' });
    }
    const result = await Message.deleteMany({ _id: { $in: ids } });
    res.json({ 
      success: true, 
      message: `${result.deletedCount} mesaj uğurla silindi`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Çoxlu mesaj silinərkən xəta:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// Mesaja cavab ver
router.post('/:id/reply', protect, admin, async (req, res) => {
  try {
    const { replyMessage } = req.body;
    if (!replyMessage || replyMessage.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Cavab mesajı daxil edilməlidir' });
    }
    
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Mesaj tapılmadı' });
    }
    
    message.replied = true;
    message.replyMessage = replyMessage;
    message.repliedAt = new Date();
    message.status = 'read';
    await message.save();
    
    res.json({ 
      success: true, 
      message: 'Cavab uğurla göndərildi',
      reply: {
        message: replyMessage,
        sentAt: message.repliedAt
      }
    });
  } catch (error) {
    console.error('Cavab göndərərkən xəta:', error);
    res.status(500).json({ success: false, message: 'Server xətası' });
  }
});

// ========== PUBLIC ROUTES (AUTH LAZIM DEYİL) ==========

// Yeni mesaj göndər (istifadəçi)
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    const errors = [];
    if (!name || name.trim().length < 2) errors.push('Ad soyad minimum 2 simvol olmalıdır');
    if (email && email.trim() !== "" && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.push('Düzgün email daxil edin');
    }
    if (!phone || phone.trim().length < 5) errors.push('Telefon nömrəsi daxil edilməlidir');
    if (!subject || subject.trim().length < 2) errors.push('Mövzu daxil edilməlidir');
    if (!message || message.trim().length < 5) errors.push('Mesaj minimum 5 simvol olmalıdır');
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const newMessage = await Message.create({
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : '',
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: ipAddress?.toString() || '',
      userAgent: userAgent || ''
    });
    
    console.log(`✅ Yeni mesaj: ${newMessage.name} (${newMessage.email || 'email yoxdur'})`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Mesajınız uğurla göndərildi. Ən qısa zamanda sizinlə əlaqə saxlanılacaq.',
      data: {
        id: newMessage._id,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Mesaj göndərərkən xəta:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    
    res.status(500).json({ success: false, message: 'Mesaj göndərilərkən xəta baş verdi' });
  }
});

export default router;