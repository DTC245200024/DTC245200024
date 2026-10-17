const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Nạp các biến môi trường từ root .env hoặc backend .env
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

function getMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  const user = process.env.DB_USER || "hotel_admin";
  const pass = process.env.DB_PASSWORD || "HotelSecurePassword2026";
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = process.env.DB_PORT || 27017;
  const dbName = process.env.DB_NAME || "hotel_booking_db";
  return `mongodb://${user}:${encodeURIComponent(pass)}@${host}:${port}/${dbName}?authSource=admin`;
}

let isConnecting = false;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once("open", resolve);
      mongoose.connection.once("error", reject);
    });
  }

  isConnecting = true;
  const uri = getMongoUri();

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true
    });
    console.log(`🍃 [MongoDB] Đã kết nối thành công tới database: "${mongoose.connection.name}"`);
    isConnecting = false;
    return mongoose.connection;
  } catch (error) {
    isConnecting = false;
    console.error(`❌ [MongoDB] Lỗi kết nối cơ sở dữ liệu MongoDB (${uri}):`, error.message);
    throw error;
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ [MongoDB] Mất kết nối tới cơ sở dữ liệu MongoDB");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 [MongoDB] Đã kết nối lại thành công tới cơ sở dữ liệu MongoDB");
});

module.exports = {
  connectDB,
  getMongoUri,
  mongoose
};
