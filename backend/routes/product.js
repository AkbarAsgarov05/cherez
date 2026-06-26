import express from "express";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// ==================== GET ROUTES ====================

// 1. GET - bütün məhsullar
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ featured: -1, order: 1, createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. GET - yalnız featured məhsullar
router.get("/featured", async (req, res) => {
  try {
    const featuredProducts = await Product.find({ featured: true }).sort({ order: 1 });
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. GET - kateqoriyaya görə məhsullar
router.get("/category/:category", async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category }).sort({ featured: -1, order: 1, createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. GET - məhsulun stok hərəkətləri
router.get("/:id/stock-movements", auth, async (req, res) => {
  try {
    const movements = await StockMovement.find({ productId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. GET - bütün stok hərəkətləri (admin üçün)
router.get("/stock-movements/all", auth, async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. GET - tək məhsul (ID ilə)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Məhsul tapılmadı" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== POST ROUTES ====================

// 7. POST - yeni məhsul (unitType dəstəkli)
router.post("/", auth, async (req, res) => {
  try {
    const { 
      name, 
      price, 
      stock, 
      unitType,
      description, 
      category, 
      image, 
      images, 
      featured 
    } = req.body;
    
    let order = 0;
    
    if (featured === true) {
      const lastFeatured = await Product.findOne({ featured: true }).sort({ order: -1 });
      order = lastFeatured ? lastFeatured.order + 1 : 1;
    }
    
    const productData = { 
      name, 
      price, 
      stock: stock || 0, 
      unitType: unitType || 'kg',
      description: description || '', 
      category, 
      image: image || '', 
      images: images || [], 
      featured: featured || false, 
      order 
    };
    
    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Məhsul yaratma xətası:', error);
    res.status(400).json({ message: error.message });
  }
});

// 8. POST - birdən çox featured məhsulun sırasını yenilə
router.post("/reorder", auth, async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ message: "productIds array olmalıdır" });
    }
    
    const session = await Product.startSession();
    session.startTransaction();
    
    try {
      for (let i = 0; i < productIds.length; i++) {
        await Product.findByIdAndUpdate(
          productIds[i],
          { order: i + 1 },
          { session }
        );
      }
      await session.commitTransaction();
      res.json({ message: "Sıralama uğurla yeniləndi", success: true });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ✅ 9. POST - stok hərəkəti əlavə et (unitType dəstəkli)
router.post("/:id/stock-movement", auth, async (req, res) => {
  try {
    const { type, quantity, reason, oldStock, newStock } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Məhsul tapılmadı" });
    }
    
    const movement = new StockMovement({
      productId: product._id,
      productName: product.name,
      unitType: product.unitType || 'kg',  // ✅ unitType əlavə edildi
      type,
      quantity,
      reason: reason || (type === 'in' ? 'Stok əlavə edildi' : 'Stok azaldıldı'),
      admin: req.admin?.name || 'Admin',
      oldStock,
      newStock
    });
    
    await movement.save();
    res.status(201).json(movement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== PUT ROUTES ====================

// 10. PUT - məhsul yenilə (unitType dəstəkli)
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      price, 
      stock, 
      unitType,
      description, 
      category, 
      image, 
      images, 
      featured 
    } = req.body;
    
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Məhsul tapılmadı" });
    }
    
    let order = existingProduct.order;
    
    if (featured !== undefined && featured !== existingProduct.featured) {
      if (featured === true) {
        const lastFeatured = await Product.findOne({ featured: true }).sort({ order: -1 });
        order = lastFeatured ? lastFeatured.order + 1 : 1;
      } else {
        order = 0;
        
        const remainingFeatured = await Product.find({ 
          featured: true, 
          _id: { $ne: id } 
        }).sort({ order: 1 });
        
        for (let i = 0; i < remainingFeatured.length; i++) {
          if (remainingFeatured[i].order !== i + 1) {
            remainingFeatured[i].order = i + 1;
            await remainingFeatured[i].save();
          }
        }
      }
    }
    
    const updateData = {
      name: name !== undefined ? name : existingProduct.name,
      price: price !== undefined ? price : existingProduct.price,
      stock: stock !== undefined ? stock : existingProduct.stock,
      unitType: unitType || existingProduct.unitType || 'kg',
      description: description !== undefined ? description : existingProduct.description,
      category: category !== undefined ? category : existingProduct.category,
      image: image !== undefined ? image : existingProduct.image,
      images: images !== undefined ? images : existingProduct.images,
      featured: featured !== undefined ? featured : existingProduct.featured,
      order: order
    };
    
    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: "Məhsul tapılmadı" });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Məhsul yeniləmə xətası:', error);
    res.status(400).json({ message: error.message });
  }
});

// ==================== PATCH ROUTES ====================

// 11. PATCH - yalnız order yenilə
router.patch("/:id/order", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Məhsul tapılmadı" });
    }
    
    if (!product.featured) {
      return res.status(400).json({ message: "Yalnız featured məhsulların sırası dəyişdirilə bilər" });
    }
    
    product.order = order;
    await product.save();
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ✅ 12. PATCH - stok yenilə (unitType dəstəkli)
router.patch("/:id/stock", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, reason } = req.body;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Məhsul tapılmadı" });
    }
    
    const oldStock = product.stock;
    const newStock = stock;
    const stockChange = newStock - oldStock;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { stock: newStock },
      { new: true }
    );
    
    if (stockChange !== 0) {
      const movementType = stockChange > 0 ? 'in' : 'out';
      const movement = new StockMovement({
        productId: product._id,
        productName: product.name,
        unitType: product.unitType || 'kg',  // ✅ unitType əlavə edildi
        type: movementType,
        quantity: Math.abs(stockChange),
        reason: reason || (movementType === 'in' ? 'Stok əlavə edildi' : 'Stok azaldıldı'),
        admin: req.admin?.name || 'Admin',
        oldStock,
        newStock
      });
      await movement.save();
    }
    
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== DELETE ROUTES ====================

// 13. DELETE - məhsul sil
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Məhsul tapılmadı" });
    }
    
    const wasFeatured = product.featured === true;
    
    await StockMovement.deleteMany({ productId: req.params.id });
    await Product.findByIdAndDelete(req.params.id);
    
    if (wasFeatured) {
      const remainingFeatured = await Product.find({ featured: true }).sort({ order: 1 });
      for (let i = 0; i < remainingFeatured.length; i++) {
        if (remainingFeatured[i].order !== i + 1) {
          remainingFeatured[i].order = i + 1;
          await remainingFeatured[i].save();
        }
      }
    }
    
    res.json({ message: "Məhsul silindi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;