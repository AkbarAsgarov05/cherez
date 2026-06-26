import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// LOGIN - admin girişi
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Email və ya şifrə yanlışdır" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email və ya şifrə yanlışdır" });
    }

    // Token payload - id və role əlavə edildi
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      success: true,
      token, 
      admin: { 
        id: admin._id, 
        email: admin.email,
        role: "admin" 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server xətası" });
  }
});

// PROFILE ROUTE - qorunan route
router.get("/profile", protect, admin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ message: "Server xətası" });
  }
});

export default router;