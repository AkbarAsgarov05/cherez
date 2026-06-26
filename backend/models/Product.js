import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  description: { 
    type: String, 
    default: "" 
  },
  image: { 
    type: String, 
    default: "" 
  },
  images: { 
    type: [String], 
    default: [] 
  },
  category: { 
    type: String, 
    required: true 
  },
  stock: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  featured: { 
    type: Boolean, 
    default: false 
  },
  order: { 
    type: Number, 
    default: 0,
    index: true
  },
  // ✅ SATIŞ VAHİDİ (kq/ədəd)
  unitType: { 
    type: String, 
    enum: ['kg', 'piece'], 
    default: 'kg' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index: featured + order birlikdə sıralama üçün
productSchema.index({ featured: -1, order: 1, createdAt: -1 });

// Stoku atomik şəkildə azaltmaq üçün static metod
productSchema.statics.decrementStock = async function(productId, quantity, unitType) {
  // Əgər məhsul kg ilə satılırsa, quantity qramdır
  // Əgər piece ilə satılırsa, quantity ədəddir
  const product = await this.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );
  
  if (!product) {
    throw new Error(`Stok kifayət deyil və ya məhsul tapılmadı`);
  }
  
  return product;
};

// Stoku yoxlamaq üçün metod
productSchema.statics.checkStock = async function(productId, requiredQuantity, unitType) {
  const product = await this.findById(productId);
  if (!product) {
    throw new Error(`Məhsul tapılmadı`);
  }
  return product.stock >= requiredQuantity;
};

// Static method - featured məhsulların order-larını yeniləmək üçün
productSchema.statics.reorderFeaturedProducts = async function(productIds) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    for (let i = 0; i < productIds.length; i++) {
      await this.findByIdAndUpdate(
        productIds[i],
        { order: i + 1 },
        { session }
      );
    }
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Pre-save middleware - featured status dəyişdikdə order avtomatik təyin et
productSchema.pre('save', async function(next) {
  if (this.isModified('featured') && this.featured === true && this.order === 0) {
    const lastFeatured = await this.constructor.findOne({ featured: true })
      .sort({ order: -1 });
    this.order = lastFeatured ? lastFeatured.order + 1 : 1;
  }
  else if (this.isModified('featured') && this.featured === false) {
    this.order = 0;
  }
  next();
});

// Post-remove middleware - silinən featured məhsuldan sonra qalanların order-larını yenilə
productSchema.post('remove', async function(doc) {
  if (doc.featured === true) {
    const remainingFeatured = await this.constructor.find({ featured: true })
      .sort({ order: 1 });
    
    for (let i = 0; i < remainingFeatured.length; i++) {
      if (remainingFeatured[i].order !== i + 1) {
        remainingFeatured[i].order = i + 1;
        await remainingFeatured[i].save();
      }
    }
  }
});

export default mongoose.model("Product", productSchema);