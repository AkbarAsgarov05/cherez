import express from "express";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/auth.js";  // ✅ DƏYİŞDİ: auth -> protect, admin

const router = express.Router();

// ==================== GET ROUTES ====================
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Kateqoriya tapılmadı" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== POST ROUTES ====================
router.post("/", protect, admin, async (req, res) => {  // ✅ DƏYİŞDİ
  try {
    const { name, description, image } = req.body;
    
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Bu adda kateqoriya artıq var" });
    }
    
    const category = new Category({ name, description, image });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== PUT ROUTES ====================
router.put("/:id", protect, admin, async (req, res) => {  // ✅ DƏYİŞDİ
  try {
    const { name, description, image } = req.body;
    
    console.log("🚀 Kateqoriya yeniləmə başladı. Yeni ad:", name);
    
    const oldCategory = await Category.findById(req.params.id);
    if (!oldCategory) {
      return res.status(404).json({ message: "Kateqoriya tapılmadı" });
    }
    
    const oldName = oldCategory.name;
    const newName = name || oldName;
    
    console.log(`📌 Köhnə ad: "${oldName}", Yeni ad: "${newName}"`);
    
    if (name && name !== oldName) {
      const existingCategory = await Category.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      if (existingCategory) {
        return res.status(400).json({ message: "Bu adda kateqoriya artıq var" });
      }
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: newName, description, image },
      { new: true, runValidators: true }
    );
    
    if (oldName !== newName) {
      console.log(`🔄 "${oldName}" kateqoriyasındakı məhsullar yenilənir...`);
      const result = await Product.updateMany(
        { category: oldName },
        { $set: { category: newName } }
      );
      console.log(`✅ ${result.modifiedCount} məhsulun kateqoriyası "${oldName}"-dan "${newName}"-a dəyişdirildi`);
    }
    
    res.json(category);
  } catch (error) {
    console.error("❌ Xəta:", error);
    res.status(400).json({ message: error.message });
  }
});

// ==================== DELETE ROUTES ====================
router.delete("/:id", protect, admin, async (req, res) => {  // ✅ DƏYİŞDİ
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Kateqoriya tapılmadı" });
    }
    
    const categoryName = category.name;
    
    const deletedProducts = await Product.deleteMany({ category: categoryName });
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: `"${categoryName}" kateqoriyası və ona aid ${deletedProducts.deletedCount} məhsul silindi`,
      deletedCategory: categoryName,
      deletedProductsCount: deletedProducts.deletedCount
    });
  } catch (error) {
    console.error('Kateqoriya silinərkən xəta:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// ✅ EXPORT
// ========================================
export default router;