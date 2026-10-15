const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const roomRoutes = require("./routes/rooms");
const bookingRoutes = require("./routes/bookings");
const authRoutes = require("./routes/auth");
const staffRoutes = require("./routes/staff");
const bookingController = require("./controllers/bookingController");

const app = express();
const PORT = process.env.PORT || 5001;

// Fully permissive CORS for development pair programming
app.use(cors({
  origin: "*",
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
  res.json({
    status: "online",
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
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// Phục vụ giao diện Frontend tích hợp (gộp chung 1 link / 1 cổng)
const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Lỗi máy chủ nội bộ: " + err.message,
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`🏨 HOTEL BOOKING BACKEND SERVER ĐANG CHẠY TẠI:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`👉 Staff API: http://localhost:${PORT}/api/staff`);
  console.log(`👉 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👉 Danh sách phòng: http://localhost:${PORT}/api/rooms`);
  console.log(`👉 Danh sách đặt phòng: http://localhost:${PORT}/api/bookings`);
  console.log(`======================================================`);
});
