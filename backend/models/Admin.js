import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "admin",
    enum: ["admin"]
  },
  name: {
    type: String,
    default: "Admin"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Admin", AdminSchema);