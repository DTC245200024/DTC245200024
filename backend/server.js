const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const roomRoutes = require("./routes/rooms");
const bookingRoutes = require("./routes/bookings");
const authRoutes = require("./routes/auth");
const staffRoutes = require("./routes/staff");
const bookingController = require("./controllers/bookingController");
const { connectDB, mongoose } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5001;

// Cấu hình CORS linh hoạt cho Production (Render) và Local Development
const clientEnv = process.env.CLIENT_URL || process.env.FRONTEND_URL;
const allowedOrigins = clientEnv 
  ? clientEnv.split(",").map(url => url.trim().replace(/\/+$/, "")) 
  : null;

app.use(cors({
  origin: function (origin, callback) {
    // Cho phép request không có origin (same-origin, mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Nếu có danh sách cấu hình cụ thể
    if (allowedOrigins && (allowedOrigins.includes("*") || allowedOrigins.includes(origin))) {
      return callback(null, true);
    }

    // Tự động cho phép localhost và các domain deploy trên render.com
    if (
      origin.includes("localhost") || 
      origin.includes("127.0.0.1") || 
      origin.endsWith(".onrender.com")
    ) {
      return callback(null, true);
    }

    // Fallback cho phép an toàn để không chặn nhầm frontend
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-role", "*"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "online",
    database: dbStatus,
    databaseName: mongoose.connection.name || "hotel_booking_db",
    message: "Hệ thống Đặt phòng Khách sạn API đang hoạt động bình thường",
    timestamp: new Date().toISOString()
  });
});

// Dashboard stats endpoint
app.get("/api/stats", bookingController.getDashboardStats);

// Main REST Routes
app.use("/api/staff", staffRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);

// Fallback 404 for unknown APIs
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint không tồn tại: " + req.originalUrl
  });
});

// Phục vụ tệp tĩnh ảnh tải lên (Ảnh mã QR VietQR, v.v.)
const uploadsPath = path.join(__dirname, "uploads");
const qrUploadsPath = path.join(uploadsPath, "qr");
if (!fs.existsSync(qrUploadsPath)) {
  fs.mkdirSync(qrUploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// Phục vụ giao diện Frontend tích hợp (khi build monorepo hoặc chạy 1 link duy nhất trên Render)
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Lỗi máy chủ nội bộ: " + err.message,
    error: err.message
  });
});

app.listen(PORT, async () => {
  console.log(`======================================================`);
  console.log(`🏨 HOTEL BOOKING BACKEND SERVER ĐANG CHẠY TẠI:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`👉 Staff API: http://localhost:${PORT}/api/staff`);
  console.log(`👉 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👉 Danh sách phòng: http://localhost:${PORT}/api/rooms`);
  console.log(`👉 Danh sách đặt phòng: http://localhost:${PORT}/api/bookings`);
  console.log(`======================================================`);

  try {
    await connectDB();
  } catch (err) {
    console.error("⚠️ Không thể kết nối MongoDB ngay khi khởi động:", err.message);
  }
});
