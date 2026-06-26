import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// İstifadəçinin ümumi xərcini yeniləyən köməkçi funksiya
const updateUserTotalSpent = async (order) => {
  try {
    const user = await User.findOne({ phone: order.phone });
    if (!user) return;
    
    const completedOrders = await Order.find({
      phone: order.phone,
      status: 'completed'
    });
    
    const orderCount = completedOrders.length;
    const totalSpent = completedOrders.reduce((sum, ord) => sum + (ord.amount || 0), 0);
    
    user.totalSpent = totalSpent;
    user.orderCount = orderCount;
    await user.save();
    
    console.log(`✅ İstifadəçi ${user.phone} üçün xərc yeniləndi: ${totalSpent} AZN, ${orderCount} sifariş`);
  } catch (error) {
    console.error("Xərc yeniləmə xətası:", error);
  }
};

// GET - bütün sifarişlər (yalnız admin)
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - tək sifariş
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      $or: [
        { orderNumber: req.params.id },
        { _id: req.params.id }
      ]
    });
    if (!order) {
      return res.status(404).json({ message: "Sifariş tapılmadı" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ DÜZƏLDİLMİŞ - POST yeni sifariş (STOK AZALDIRILMIR - YALNIZ YOXLANIR)
router.post("/", async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const { firstName, lastName, phone, address, amount, items, products, paymentMethod, note } = req.body;
    
    const orderProducts = [];
    
    for (const item of products) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `${item.name} tapılmadı` });
      }
      
      const userQuantity = parseFloat(item.quantity);
      let quantityForDB, displayQuantity;
      
      if (product.unitType === 'kg') {
        if (userQuantity >= 100) {
          // İstifadəçi qram göndərib (5000 = 5 kq)
          quantityForDB = userQuantity;
          displayQuantity = userQuantity / 1000;
        } else {
          // İstifadəçi kiloqram göndərib (5 = 5 kq)
          quantityForDB = userQuantity * 1000;
          displayQuantity = userQuantity;
        }
      } else {
        quantityForDB = userQuantity;
        displayQuantity = userQuantity;
      }
      
      // ✅ YALNIZ STOK YOXLANIR, AZALDILMIR
      if (product.stock < displayQuantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          message: `${product.name} məhsulundan kifayət qədər stok yoxdur. 
          Mövcud stok: ${product.stock} ${product.unitType === 'kg' ? 'kq' : 'ədəd'}` 
        });
      }
      
      orderProducts.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: quantityForDB,
        unitType: product.unitType,
        displayQuantity: displayQuantity,
        totalPrice: product.price * displayQuantity,
        weight: `${displayQuantity} ${product.unitType === 'kg' ? 'kq' : 'ədəd'}`
      });
    }
    
    const orderNumber = await Order.generateOrderNumber();
    const now = new Date();
    const date = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const totalAmount = orderProducts.reduce((sum, p) => sum + p.totalPrice, 0);
    
    const order = new Order({
      orderNumber,
      firstName: firstName || "",
      lastName: lastName || "",
      customer: `${firstName || ""} ${lastName || ""}`.trim(),
      phone: phone || "",
      address: address || "",
      amount: totalAmount,
      items: orderProducts.length,
      products: orderProducts,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      note: note || "",
      date,
      time
    });
    
    await order.save({ session });
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json(order);
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Sifariş yaratma xətası:", error);
    res.status(400).json({ message: error.message });
  }
});

// PUT - sifariş yenilə
router.put("/:id", auth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (updateData.items !== undefined) updateData.items = parseInt(updateData.items) || 0;
    if (updateData.amount !== undefined) updateData.amount = parseFloat(updateData.amount) || 0;
    
    if (updateData.firstName !== undefined || updateData.lastName !== undefined) {
      const existingOrder = await Order.findOne({ orderNumber: req.params.id });
      if (existingOrder) {
        const firstName = updateData.firstName !== undefined ? updateData.firstName : existingOrder.firstName;
        const lastName = updateData.lastName !== undefined ? updateData.lastName : existingOrder.lastName;
        updateData.customer = `${firstName || ""} ${lastName || ""}`.trim();
      }
    }
    
    const order = await Order.findOneAndUpdate(
      { orderNumber: req.params.id },
      updateData,
      { new: true, runValidators: false }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Sifariş tapılmadı" });
    }
    
    if (updateData.status === 'completed') {
      await updateUserTotalSpent(order);
    }
    
    res.json(order);
  } catch (error) {
    console.error("Sifariş yeniləmə xətası:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ DÜZƏLDİLMİŞ - PATCH status yenilə (STOK AZALDIRIR VƏ YA GERİ QAYTARIR)
router.patch("/:id/status", auth, async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();
  
  try {
    const { status } = req.body;
    
    const oldOrder = await Order.findOne({ orderNumber: req.params.id }).session(session);
    if (!oldOrder) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Sifariş tapılmadı" });
    }
    
    // ✅ ƏGƏR STATUS "completed" OLURSA VƏ ƏVVƏL "completed" DEYİLDİSƏ - STOKU AZALT
    if (status === 'completed' && oldOrder.status !== 'completed') {
      for (const item of oldOrder.products) {
        const product = await Product.findById(item.productId).session(session);
        
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: `${item.name} tapılmadı` });
        }
        
        const quantityToDecrement = item.displayQuantity;
        
        if (product.stock < quantityToDecrement) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ 
            message: `${product.name} məhsulundan kifayət qədər stok yoxdur. 
            Mövcud stok: ${product.stock} ${product.unitType === 'kg' ? 'kq' : 'ədəd'}` 
          });
        }
        
        await Product.findOneAndUpdate(
          { _id: item.productId },
          { $inc: { stock: -quantityToDecrement } },
          { session, new: true }
        );
        
        console.log(`📦 Stok azaldı: ${product.name} - ${quantityToDecrement} ${product.unitType === 'kg' ? 'kq' : 'ədəd'}`);
      }
    }
    
    // ✅ ƏGƏR STATUS "completed" DƏN BAŞQA BİR ŞEYƏ DƏYİŞİR - STOKU GERİ QAYTAR
    if (oldOrder.status === 'completed' && status !== 'completed') {
      for (const item of oldOrder.products) {
        const product = await Product.findById(item.productId).session(session);
        
        if (product) {
          const quantityToAdd = item.displayQuantity;
          
          await Product.findOneAndUpdate(
            { _id: item.productId },
            { $inc: { stock: quantityToAdd } },
            { session, new: true }
          );
          
          console.log(`📦 Stok geri qaytarıldı: ${product.name} +${quantityToAdd} ${product.unitType === 'kg' ? 'kq' : 'ədəd'}`);
        }
      }
    }
    
    const order = await Order.findOneAndUpdate(
      { orderNumber: req.params.id },
      { status },
      { session, new: true }
    );
    
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Sifariş tapılmadı" });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    if (status === 'completed') {
      await updateUserTotalSpent(order);
    }
    
    if (oldOrder.status === 'completed' && status !== 'completed') {
      await updateUserTotalSpent(order);
    }
    
    res.json(order);
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Status yeniləmə xətası:", error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE - sifariş sil (əgər completed idisə stoku geri qaytar)
router.delete("/:id", auth, async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();
  
  try {
    const order = await Order.findOne({ orderNumber: req.params.id }).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Sifariş tapılmadı" });
    }
    
    // ✅ Əgər silinən sifariş "completed" idisə, stoku geri qaytar
    if (order.status === 'completed') {
      for (const item of order.products) {
        const product = await Product.findById(item.productId).session(session);
        
        if (product) {
          const quantityToAdd = item.displayQuantity;
          
          await Product.findOneAndUpdate(
            { _id: item.productId },
            { $inc: { stock: quantityToAdd } },
            { session, new: true }
          );
          
          console.log(`📦 Silindi, stok geri qaytarıldı: ${product.name} +${quantityToAdd} ${product.unitType === 'kg' ? 'kq' : 'ədəd'}`);
        }
      }
    }
    
    await Order.findOneAndDelete({ orderNumber: req.params.id }).session(session);
    
    await session.commitTransaction();
    session.endSession();
    
    if (order.phone) {
      await updateUserTotalSpent(order);
    }
    
    res.json({ message: "Sifariş silindi" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
});

// GET - statistika
router.get("/stats/summary", auth, async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const completed = await Order.countDocuments({ status: 'completed' });
    const pending = await Order.countDocuments({ status: 'pending' });
    const processing = await Order.countDocuments({ status: 'processing' });
    const cancelled = await Order.countDocuments({ status: 'cancelled' });
    
    const result = await Order.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);
    const totalAmount = result[0]?.totalAmount || 0;
    
    res.json({ total, completed, pending, processing, cancelled, totalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;