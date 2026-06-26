import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ad soyad daxil edilməlidir'],
    trim: true,
    minlength: [2, 'Ad soyad minimum 2 simvol olmalıdır'],
    maxlength: [100, 'Ad soyad maksimum 100 simvol ola bilər']
  },
  email: {
    type: String,
    required: false, // ✅ EMAİL OPTIONAL - MƏCBURİ DEYİL!
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Düzgün email formatı daxil edin'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Telefon nömrəsi daxil edilməlidir'],
    trim: true
  },
  subject: {
    type: String,
    required: false, // ✅ SUBJECT OPTIONAL - MƏCBURİ DEYİL!
    trim: true,
    default: 'Əlaqə formu', // ✅ DEFAULT DƏYƏR
    minlength: [2, 'Mövzu minimum 2 simvol olmalıdır'],
    maxlength: [200, 'Mövzu maksimum 200 simvol ola bilər']
  },
  message: {
    type: String,
    required: [true, 'Mesaj daxil edilməlidir'],
    trim: true,
    minlength: [5, 'Mesaj minimum 5 simvol olmalıdır'],
    maxlength: [5000, 'Mesaj maksimum 5000 simvol ola bilər']
  },
  status: {
    type: String,
    enum: ['read', 'unread'],
    default: 'unread'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  replied: {
    type: Boolean,
    default: false
  },
  replyMessage: {
    type: String,
    default: ''
  },
  repliedAt: {
    type: Date
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  isSpam: {
    type: Boolean,
    default: false
  },
  adminNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Axtarış üçün indexlər
messageSchema.index({ name: 'text', email: 'text', subject: 'text', message: 'text' });
messageSchema.index({ status: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ email: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;