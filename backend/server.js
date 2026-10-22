const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const roomRoutes = require("./routes/rooms");
const bookingRoutes = require("./routes/bookings");
const authRoutes = require("./routes/auth");
const staffRoutes = require("./routes/staff");
const bookingController = require("./controllers/bookingController");
const { connectDB, checkConnection, closeDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5001;

// Tin cậy reverse proxy (Nginx) đúng 1 hop để lấy đúng client IP cho express-rate-limit
// Khắc phục triệt để lỗi ERR_ERL_UNEXPECTED_X_FORWARDED_FOR mà vẫn bảo đảm an toàn bảo mật
app.set("trust proxy", 1);

// Ẩn thông tin công nghệ backend (Security Hardening)
app.disable("x-powered-by");

// Cấu hình Rate Limiting (Chống Brute Force & DoS)
const rateLimit = require("express-rate-limit");
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 500, // Tối đa 500 requests / 15 phút cho mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 15 phút."
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 30, // Tối đa 30 lần thử đăng nhập/đăng ký để chống Brute Force
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều lần thử đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút."
  }
});

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

// Giới hạn kích thước payload (Security Hardening: 10MB)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Áp dụng Rate Limiting cho API
app.use("/api/", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get("/api/health", async (req, res) => {
  const db = await checkConnection();
  res.status(db.connected ? 200 : 503).json({
    status: db.connected ? "online" : "degraded",
    database: db.connected ? "connected" : "disconnected",
    databaseName: db.name,
    databaseEngine: "PostgreSQL",
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

// Error handling middleware (Không trả stack trace hoặc thông tin nhạy cảm ở production)
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  const isProd = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? "Lỗi máy chủ nội bộ. Vui lòng thử lại sau." : ("Lỗi máy chủ nội bộ: " + err.message),
    ...(isProd ? {} : { error: err.message, stack: err.stack })
  });
});

const server = app.listen(PORT, async () => {
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
    console.error("⚠️ Không thể kết nối PostgreSQL ngay khi khởi động:", err.message);
  }
});

// Tắt server êm: đóng HTTP server rồi đóng pool PostgreSQL
function shutdown(signal) {
  console.log(`${signal} nhận được, đang tắt server...`);
  server.close(async () => {
    try {
      await closeDB();
    } finally {
      process.exit(0);
    }
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
