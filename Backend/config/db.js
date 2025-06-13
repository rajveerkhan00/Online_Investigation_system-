// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = "mongodb+srv://wwwalijaved00:8PWFuL2wTvN62LPZ@cluster0.yv6myll.mongodb.net/?retryWrites=true&w=majority";
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
