import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kampaniya adı tələb olunur'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: [true, 'Endirim dəyəri tələb olunur'],
    min: 0
  },
  startDate: {
    type: Date,
    required: [true, 'Başlama tarixi tələb olunur']
  },
  endDate: {
    type: Date,
    required: [true, 'Bitmə tarixi tələb olunur']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  applyTo: {
    type: String,
    enum: ['all', 'products', 'categories'],
    default: 'all'
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  banner: {
    type: String,
    default: ''
  },
  promoCode: {
    type: String,
    uppercase: true,
    trim: true,
    sparse: true
  },
  usageLimit: {
    type: Number,
    min: 0,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  stats: {
    orders: { type: Number, default: 0 },
    productsSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }
}, { 
  timestamps: true 
});

// Virtual field - kampaniyanın bitib-bitmədiyini yoxlamaq üçün
campaignSchema.virtual('isExpired').get(function() {
  const now = new Date();
  return now > new Date(this.endDate);
});

// Virtual field - kampaniyanın başlayıb-başlamadığını yoxlamaq üçün
campaignSchema.virtual('isStarted').get(function() {
  const now = new Date();
  return now >= new Date(this.startDate);
});

// Statusu real vaxtda hesablayan metod
campaignSchema.methods.getCurrentStatus = function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  // Əgər admin tərəfindən deaktiv edilibsə
  if (this.status === 'inactive') return 'inactive';
  
  // Tarixə görə yoxlama
  if (now < start) return 'inactive';
  if (now > end) return 'completed';
  return 'active';
};

// Statusu yeniləyən metod - SİLİNMİR, SADƏCƏ STATUS DƏYİŞİR
campaignSchema.methods.updateStatusByDate = async function() {
  const currentStatus = this.getCurrentStatus();
  if (this.status !== currentStatus && currentStatus !== 'inactive') {
    this.status = currentStatus;
    await this.save();
    return true;
  }
  return false;
};

// Statik metod - İstifadəçi üçün aktiv kampaniyaları tap (bitmişləri də qaytarır)
campaignSchema.statics.findForUser = function() {
  const now = new Date();
  return this.find({
    status: { $in: ['active', 'completed'] }  // 'completed' olanları da göstər
  }).sort({ createdAt: -1 });
};

// Statik metod - Yalnız aktiv kampaniyalar (endirim tətbiqi üçün)
campaignSchema.statics.findActiveForDiscount = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

// Statik metod - Vaxtı keçənləri 'completed' et (cron job üçün)
campaignSchema.statics.updateExpiredCampaigns = async function() {
  const now = new Date();
  
  // Vaxtı keçən amma hələ 'active' statusunda olan kampaniyaları tap
  const expiredCampaigns = await this.find({
    status: 'active',
    endDate: { $lt: now }
  });
  
  let updatedCount = 0;
  for (const campaign of expiredCampaigns) {
    campaign.status = 'completed';
    await campaign.save();
    updatedCount++;
    console.log(`📅 Kampaniya tamamlandı: ${campaign.name}`);
  }
  
  return updatedCount;
};

// Promo kodun etibarlılığını yoxlamaq üçün metod
campaignSchema.methods.isPromoCodeValid = function(code) {
  if (!this.promoCode) return false;
  if (this.promoCode !== code.toUpperCase()) return false;
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
  
  const now = new Date();
  if (this.startDate > now || this.endDate < now) return false;
  if (this.status !== 'active') return false;
  
  return true;
};

// toJSON transform - virtual field'ları daxil et
campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

// save middleware - sadəcə startDate/endDate dəyişəndə statusu yenilə
campaignSchema.pre('save', function(next) {
  // Yalnız startDate və ya endDate dəyişibsə, və ya yeni sənəddirsə
  if (this.isModified('startDate') || this.isModified('endDate') || this.isNew) {
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (now < start) {
      this.status = 'inactive';
    } else if (now > end) {
      this.status = 'completed';
    } else if (this.status !== 'inactive') {
      // Əgər admin tərəfindən inactive edilməyibsə
      this.status = 'active';
    }
  }
  next();
});

export default mongoose.model('Campaign', campaignSchema);