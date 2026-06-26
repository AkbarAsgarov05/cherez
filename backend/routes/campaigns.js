import express from 'express';
import Campaign from '../models/Campaign.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// ========== İSTİFADƏÇİLƏR ÜÇÜN (auth tələb olunmur) ==========

// ✅ Aktiv kampaniyaları get (yalnız cari aktiv olanlar - endirim tətbiqi üçün)
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: 'active'  // Yalnız aktiv statusda olanlar
    }).select('-__v').sort({ createdAt: -1 });
    
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ YENİ ENDPOINT - Bütün kampaniyalar (bitmişlər də daxil) - İstifadəçi üçün
router.get('/all', async (req, res) => {
  try {
    const now = new Date();
    
    // Başlamış bütün kampaniyalar (aktiv və bitmiş)
    const campaigns = await Campaign.find({
      startDate: { $lte: now }  // Başlamış olanlar (keçmiş və indiki)
    })
    .select('-__v')
    .sort({ createdAt: -1 });
    
    // Hər kampaniyaya əlavə məlumat əlavə et
    const enrichedCampaigns = campaigns.map(campaign => {
      const campaignObj = campaign.toObject();
      const isActive = campaign.startDate <= now && campaign.endDate >= now && campaign.status === 'active';
      const isExpired = campaign.endDate < now || campaign.status === 'completed';
      const isUpcoming = campaign.startDate > now;
      
      return {
        ...campaignObj,
        isActive: isActive,
        isExpired: isExpired,
        isUpcoming: isUpcoming,
        displayStatus: isExpired ? 'completed' : (isActive ? 'active' : 'inactive'),
        canUse: isActive  // Yalnız aktiv kampaniyalardan istifadə oluna bilər
      };
    });
    
    res.json({
      success: true,
      campaigns: enrichedCampaigns,
      total: enrichedCampaigns.length
    });
  } catch (err) {
    console.error('Get all campaigns error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Tək kampaniya get - İSTİFADƏÇİLƏR ÜÇÜN (auth yoxdur!)
router.get('/public/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .select('-__v');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Kampaniya tapılmadı' });
    }
    
    const now = new Date();
    const isActive = campaign.startDate <= now && campaign.endDate >= now && campaign.status === 'active';
    const isExpired = campaign.endDate < now || campaign.status === 'completed';
    
    res.json({
      ...campaign.toObject(),
      isActive: isActive,
      isExpired: isExpired,
      canUse: isActive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Promo kod yoxlama - İSTİFADƏÇİLƏR ÜÇÜN (auth yoxdur!)
router.post('/validate-promo', async (req, res) => {
  try {
    const { promoCode, productId } = req.body;
    const now = new Date();
    
    const campaign = await Campaign.findOne({
      promoCode: promoCode.toUpperCase(),
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    if (!campaign) {
      return res.status(404).json({ valid: false, message: 'Promo kod etibarsızdır' });
    }
    
    if (campaign.usageLimit && campaign.usageCount >= campaign.usageLimit) {
      return res.status(400).json({ valid: false, message: 'Promo kod istifadə limiti dolmuşdur' });
    }
    
    let applicable = false;
    if (campaign.applyTo === 'all') {
      applicable = true;
    } else if (campaign.applyTo === 'products' && productId) {
      applicable = campaign.products.some(p => p.toString() === productId);
    }
    
    if (!applicable) {
      return res.status(400).json({ valid: false, message: 'Bu promo kod bu məhsula aid deyil' });
    }
    
    res.json({
      valid: true,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      campaignId: campaign._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== ADMIN PANEL ÜÇÜN (auth tələb olunur) ==========

// Bütün kampaniyaları get (filtr, axtarış, səhifələmə ilə) - YALNIZ ADMIN
router.get('/', protect, admin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('products', 'name price')
      .populate('categories', 'name');

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tək kampaniya get (admin üçün detallı) - YALNIZ ADMIN
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('products', 'name price')
      .populate('categories', 'name');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Kampaniya tapılmadı' });
    }
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Yeni kampaniya yarat - YALNIZ ADMIN
router.post('/', protect, admin, async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate)
    };
    
    const campaign = new Campaign(campaignData);
    await campaign.save();
    
    const populatedCampaign = await Campaign.findById(campaign._id)
      .populate('products', 'name price')
      .populate('categories', 'name');
    
    res.status(201).json(populatedCampaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Kampaniya yenilə - YALNIZ ADMIN
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('products', 'name price')
     .populate('categories', 'name');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Kampaniya tapılmadı' });
    }
    res.json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Kampaniya sil - YALNIZ ADMIN
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Kampaniya tapılmadı' });
    }
    res.json({ message: 'Kampaniya silindi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Kampaniyanı dərhal bitir (YALNIZ status dəyişir, endDate DƏYİŞMİR!)
router.patch('/:id/end-now', protect, admin, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    
    if (!campaign) {
      return res.status(404).json({ message: 'Kampaniya tapılmadı' });
    }
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Kampaniyanı aktiv et (statusu active edir)
router.patch('/:id/activate', protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Kampaniya tapılmadı' });
    }
    
    // Tarix yoxlaması
    if (campaign.startDate > now) {
      return res.status(400).json({ message: 'Kampaniyanın başlama tarixi gələcək tarixdir. Aktiv etmək mümkün deyil.' });
    }
    
    if (campaign.endDate < now) {
      return res.status(400).json({ message: 'Kampaniyanın bitmə tarixi keçmişdir. Aktiv etmək mümkün deyil.' });
    }
    
    campaign.status = 'active';
    await campaign.save();
    
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Kampaniya statistikasını yenilə - YALNIZ ADMIN
router.patch('/:id/update-stats', protect, admin, async (req, res) => {
  try {
    const { orders = 0, productsSold = 0, revenue = 0 } = req.body;
    
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          'stats.orders': orders,
          'stats.productsSold': productsSold,
          'stats.revenue': revenue,
          usageCount: 1
        }
      },
      { new: true }
    );
    
    if (!campaign) {
      return res.status(404).json({ message: 'Kampaniya tapılmadı' });
    }
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;