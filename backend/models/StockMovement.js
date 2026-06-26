import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  productName: { 
    type: String, 
    required: true 
  },
  // ✅ YENİ - Satış vahidi (kq/ədəd)
  unitType: { 
    type: String, 
    enum: ['kg', 'piece'], 
    default: 'kg' 
  },
  type: { 
    type: String, 
    enum: ['in', 'out'], 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 0 
  },
  reason: { 
    type: String, 
    default: '' 
  },
  admin: { 
    type: String, 
    default: 'Admin' 
  },
  oldStock: { 
    type: Number, 
    required: true 
  },
  newStock: { 
    type: Number, 
    required: true 
  }
}, { timestamps: true });

// Index for better query performance
stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ createdAt: -1 });
stockMovementSchema.index({ unitType: 1 });  // ✅ unitType indeksi

// ✅ Virtual field - vahid göstəricisi üçün
stockMovementSchema.virtual('unitLabel').get(function() {
  return this.unitType === 'kg' ? 'kq' : 'ədəd';
});

// ✅ Method - formatlı quantity göstəricisi üçün
stockMovementSchema.methods.getFormattedQuantity = function() {
  const unit = this.unitType === 'kg' ? 'kq' : 'ədəd';
  return `${this.quantity} ${unit}`;
};

export default mongoose.model("StockMovement", stockMovementSchema);