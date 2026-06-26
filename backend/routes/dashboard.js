// backend/routes/dashboard.js - TAM DÜZGÜN VERSİYA (GƏLİR HESABLAMASI + SATILAN MƏHSUL)
import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import { protect } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

// Dashboard statistikası - YALNIZ COMPLETED SİFARİŞLƏRƏ GÖRƏ
router.get("/stats", protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
      start = new Date();
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }
    
    // ✅ YALNIZ COMPLETED sifarişləri götür (gəlir üçün)
    const completedOrders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: "completed"
    });
    
    // Ümumi gəlir - YALNIZ COMPLETED sifarişlər
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    // Satılan məhsul statistikası (kq və ədəd ayrılıqda)
    let totalSoldKg = 0;
    let totalSoldPiece = 0;
    
    for (const order of completedOrders) {
      if (order.products && order.products.length) {
        for (const item of order.products) {
          if (item.unitType === 'kg') {
            totalSoldKg += item.quantity / 1000;  // qram -> kq
          } else {
            totalSoldPiece += item.quantity;
          }
        }
      }
    }
    
    // Gözləyən sifarişlər (pending statuslu, lakin completed olmayanlar)
    const pendingOrders = await Order.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: "pending"
    });
    
    // Əvvəlki dövr üçün growth (yalnız completed sifarişlər)
    const duration = end - start;
    const prevStart = new Date(start - duration);
    const prevEnd = new Date(start);
    
    const prevCompletedOrders = await Order.find({
      createdAt: { $gte: prevStart, $lte: prevEnd },
      status: "completed"
    });
    const prevRevenue = prevCompletedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const revenueGrowth = prevRevenue > 0 
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100 * 10) / 10 
      : totalRevenue > 0 ? 100 : 0;
    
    const prevOrdersCount = prevCompletedOrders.length;
    const ordersGrowth = prevOrdersCount > 0 
      ? Math.round(((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 * 10) / 10 
      : totalOrders > 0 ? 100 : 0;
    
    // Satış qrafiki (yalnız completed sifarişlər)
    const salesChart = await getSalesChartData(start, end);
    
    // Ən çox satılan məhsullar (yalnız completed sifarişlər)
    const topProducts = await getTopProducts(start, end);
    
    // Müştəri analitikası (yalnız completed sifarişlər)
    const customerAnalytics = await getCustomerAnalytics(start, end);
    
    res.json({
      kpi: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        pendingOrders,
        revenueGrowth,
        ordersGrowth,
        totalSoldKg: totalSoldKg.toFixed(2),
        totalSoldPiece: totalSoldPiece
      },
      salesChart,
      topProducts,
      customerAnalytics
    });
    
  } catch (error) {
    console.error("Dashboard xətası:", error);
    res.status(500).json({ message: "Server xətası", error: error.message });
  }
});

// Satış qrafiki - YALNIZ COMPLETED SİFARİŞLƏR
async function getSalesChartData(startDate, endDate) {
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: "completed"
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]);
  
  return result.map((item, index) => ({
    name: daysDiff <= 31 ? `${index + 1}` : item._id,
    revenue: item.revenue,
    orders: item.orders
  }));
}

// Ən çox satılan məhsullar - YALNIZ COMPLETED SİFARİŞLƏR
async function getTopProducts(startDate, endDate) {
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: "completed"
  });
  
  const productSales = {};
  
  for (const order of orders) {
    if (order.products && order.products.length) {
      for (const item of order.products) {
        const productId = item.productId;
        const quantity = item.quantity || 0;
        const revenue = item.totalPrice || 0;
        
        if (!productSales[productId]) {
          productSales[productId] = { totalSold: 0, totalRevenue: 0, name: item.name };
        }
        productSales[productId].totalSold += quantity;
        productSales[productId].totalRevenue += revenue;
      }
    }
  }
  
  const sorted = Object.entries(productSales)
    .sort((a, b) => b[1].totalSold - a[1].totalSold)
    .slice(0, 5);
  
  const result = [];
  for (const [productId, data] of sorted) {
    let product = null;
    
    try {
      if (mongoose.Types.ObjectId.isValid(productId)) {
        product = await Product.findById(productId).select("name category unitType");
      } else {
        product = await Product.findOne({ _id: productId }).select("name category unitType");
      }
    } catch (err) {
      console.log("Product tapılmadı:", productId);
    }
    
    const unitType = product?.unitType || 'piece';
    let formattedSales;
    let displayUnit;
    
    if (unitType === 'kg') {
      formattedSales = (data.totalSold / 1000).toFixed(2);
      displayUnit = 'kq';
    } else {
      formattedSales = data.totalSold;
      displayUnit = 'ədəd';
    }
    
    result.push({
      name: product?.name || data.name || "Bilinməyən məhsul",
      sales: formattedSales,
      revenue: data.totalRevenue,
      unit: displayUnit
    });
  }
  
  return result;
}

// Müştəri analitikası - YALNIZ COMPLETED SİFARİŞLƏR
async function getCustomerAnalytics(startDate, endDate) {
  const periodOrders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: "completed"
  });
  
  const customerSet = new Set();
  periodOrders.forEach(order => {
    if (order.phone) customerSet.add(order.phone);
  });
  
  const activeCustomers = customerSet.size;
  let newCustomers = 0;
  let repeatCustomers = 0;
  
  for (const phone of customerSet) {
    const firstOrder = await Order.findOne({
      phone: phone,
      status: "completed"
    }).sort({ createdAt: 1 });
    
    if (firstOrder) {
      if (firstOrder.createdAt >= startDate) {
        newCustomers++;
      } else {
        repeatCustomers++;
      }
    }
  }
  
  return { active: activeCustomers, new: newCustomers, repeat: repeatCustomers };
}

// STOK ANALİTİKASI
router.get("/stock", protect, async (req, res) => {
  try {
    console.log("📦 Stock API çağırıldı");
    
    const allProducts = await Product.find({}).select("name stock category unitType");
    
    const lowStock = [];
    const outOfStock = [];
    
    for (const product of allProducts) {
      if (product.stock === 0) {
        outOfStock.push({
          name: product.name,
          category: product.category || "Kateqoriyasız",
          unitLabel: product.unitType === 'kg' ? 'kq' : 'ədəd'
        });
      } 
      else if (product.unitType === 'kg') {
        const stockKg = product.stock;
        if (stockKg > 0 && stockKg < 30) {
          lowStock.push({
            name: product.name,
            stock: stockKg.toFixed(2),
            threshold: "30.00",
            category: product.category || "Kateqoriyasız",
            unitLabel: "kq"
          });
        }
      } 
      else {
        if (product.stock > 0 && product.stock < 30) {
          lowStock.push({
            name: product.name,
            stock: product.stock,
            threshold: "30",
            category: product.category || "Kateqoriyasız",
            unitLabel: "ədəd"
          });
        }
      }
    }
    
    // ƏN ÇOX DÖVRİYYƏ (yalnız completed sifarişlər)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const orders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo },
      status: "completed"
    });
    
    const productSales = {};
    
    for (const order of orders) {
      if (order.products && order.products.length) {
        for (const item of order.products) {
          const productId = item.productId;
          const quantity = item.quantity || 0;
          const productName = item.name;
          
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = { totalSold: 0, name: productName };
            }
            productSales[productId].totalSold += quantity;
          }
        }
      }
    }
    
    const sortedProducts = Object.entries(productSales)
      .sort((a, b) => b[1].totalSold - a[1].totalSold)
      .slice(0, 10);
    
    const highTurnover = [];
    for (const [productId, data] of sortedProducts) {
      let product = await Product.findById(productId).select("name category unitType");
      
      if (!product) {
        product = await Product.findOne({ name: data.name }).select("name category unitType");
      }
      
      let displayTurnover;
      let unitLabel;
      let productName;
      let category;
      
      if (product) {
        productName = product.name;
        category = product.category || "Kateqoriyasız";
        
        if (product.unitType === 'kg') {
          displayTurnover = (data.totalSold / 1000).toFixed(2);
          unitLabel = 'kq';
        } else {
          displayTurnover = data.totalSold;
          unitLabel = 'ədəd';
        }
      } else {
        productName = data.name || "Məhsul tapılmadı";
        category = "Kateqoriyasız";
        
        if (data.totalSold >= 1000) {
          displayTurnover = (data.totalSold / 1000).toFixed(2);
          unitLabel = 'kq';
        } else {
          displayTurnover = data.totalSold;
          unitLabel = 'ədəd';
        }
      }
      
      highTurnover.push({
        name: productName,
        displayTurnover: displayTurnover,
        category: category,
        unitLabel: unitLabel
      });
    }
    
    res.json({
      lowStock: lowStock,
      outOfStock: outOfStock,
      highTurnover: highTurnover
    });
    
  } catch (error) {
    console.error("❌ Stock xətası:", error);
    res.status(500).json({ 
      message: "Server xətası", 
      error: error.message 
    });
  }
});

// Stok hərəkətləri tarixçəsi
router.get("/stock-movements", protect, async (req, res) => {
  try {
    const { limit = 50, page = 1, type } = req.query;
    
    let filter = {};
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    const movements = await StockMovement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await StockMovement.countDocuments(filter);
    
    res.json({
      movements: movements.map(m => ({
        id: m._id,
        productName: m.productName,
        type: m.type,
        quantity: m.quantity,
        reason: m.reason,
        admin: m.admin,
        oldStock: m.oldStock,
        newStock: m.newStock,
        date: m.createdAt,
        unitLabel: m.unitType === 'kg' ? 'kq' : 'ədəd'
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Stok hərəkətləri xətası:", error);
    res.status(500).json({ message: "Server xətası" });
  }
});

export default router;