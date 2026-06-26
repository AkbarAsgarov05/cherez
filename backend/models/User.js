import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ad soyad daxil edilməlidir'],
    trim: true,
    minlength: [3, 'Ad soyad minimum 3 simvol olmalıdır'],
    maxlength: [100, 'Ad soyad maksimum 100 simvol ola bilər']
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Email daxil edilməlidir'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Zəhmət olmasa düzgün email daxil edin'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Telefon nömrəsi daxil edilməlidir'],
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Şifrə daxil edilməlidir'],
    minlength: [6, 'Şifrə minimum 6 simvol olmalıdır'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  avatar: {
    type: String,
    default: null
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  totalSpent: {
    type: Number,
    default: 0
  },
  orderCount: {
    type: Number,
    default: 0
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  forcePasswordChange: {
    type: Boolean,
    default: false
  },
  // ✅ REFRESH TOKEN
  refreshToken: {
    type: String,
    default: null
  },
  // ✅ EMAİL DƏYİŞMƏ SAHƏLƏRİ (YENİ)
  pendingEmail: {
    type: String,
    default: null
  },
  emailChangeToken: {
    type: String,
    default: null
  },
  emailChangeExpires: {
    type: Date,
    default: null
  },
  emailChangeRequestedBy: {
    type: String,
    default: null
  },
  lastLogin: Date,
  registerDate: {
    type: Date,
    default: Date.now
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }
}, {
  timestamps: true
});

// Şifrəni hash etmə (save olmazdan əvvəl)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Şifrəni müqayisə etmə metod
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;