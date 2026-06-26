import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  // ✅ DB-DƏ SAXLANILAN MİQDAR (kg üçün QRAM, piece üçün ƏDƏD)
  quantity: { 
    type: Number, 
    required: true 
  },
  // ✅ SATIŞ VAHİDİ ('kg' və ya 'piece')
  unitType: { 
    type: String, 
    enum: ['kg', 'piece'], 
    default: 'kg',
    required: true
  },
  // ✅ İSTİFADƏÇİYƏ GÖSTƏRİLƏCƏK MİQDAR (kq və ya ədəd)
  displayQuantity: { 
    type: Number, 
    required: true 
  },
  // ✅ TOPLAM QİYMƏT (vahid qiymət × miqdar)
  totalPrice: { 
    type: Number, 
    required: true 
  },
  // ✅ KÖHNƏ (legacy) - geriyə uyğunluq üçün
  weight: { 
    type: String, 
    default: "" 
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  // Ad və Soyad ayrı-ayrı
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  customer: { 
    type: String 
  },
  phone: { 
    type: String,
    default: "" 
  },
  address: { 
    type: String, 
    default: "" 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  items: { 
    type: Number, 
    default: 0 
  },
  // ✅ DÜZƏLDİLMİŞ - məhsullar massivi
  products: {
    type: [orderItemSchema],
    default: []
  },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'online'],
    default: 'cash' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending' 
  },
  note: { 
    type: String, 
    default: "" 
  },
  date: { 
    type: String, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

// Sifariş nömrəsi yaratmaq üçün static metod
orderSchema.statics.generateOrderNumber = async function() {
  const lastOrder = await this.findOne().sort({ orderNumber: -1 });
  if (!lastOrder) return "ORD-001";
  
  const lastNumber = parseInt(lastOrder.orderNumber.split('-')[1]);
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `ORD-${newNumber}`;
};

// SAVE etməzdən əvvəl customer sahəsini yarat
orderSchema.pre('save', function(next) {
  this.customer = `${this.firstName} ${this.lastName}`.trim();
  next();
});

// ✅ VİRTUAL - məhsulun formatlı miqdarını qaytarır
orderSchema.virtual('formattedProducts').get(function() {
  return this.products.map(product => {
    if (product.unitType === 'kg') {
      const kgValue = product.displayQuantity;
      return {
        ...product.toObject(),
        formattedQuantity: Number.isInteger(kgValue) ? `${kgValue} kq` : `${kgValue.toFixed(2)} kq`
      };
    } else {
      return {
        ...product.toObject(),
        formattedQuantity: `${product.displayQuantity} ədəd`
      };
    }
  });
});

// ✅ VİRTUAL - sifarişin ümumi məhsul sayını qaytarır (əgər items yoxdursa)
orderSchema.virtual('calculatedItems').get(function() {
  if (this.items > 0) return this.items;
  return this.products.length;
});

export default mongoose.model("Order", orderSchema);