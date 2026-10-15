const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Đảm bảo thư mục lưu trữ ảnh QR tồn tại
const QR_UPLOAD_DIR = path.join(__dirname, "../uploads/qr");
if (!fs.existsSync(QR_UPLOAD_DIR)) {
  fs.mkdirSync(QR_UPLOAD_DIR, { recursive: true });
}

// Cấu hình lưu trữ tệp tin
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(QR_UPLOAD_DIR)) {
      fs.mkdirSync(QR_UPLOAD_DIR, { recursive: true });
    }
    cb(null, QR_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, `vietqr-${uniqueSuffix}${ext || ".png"}`);
  }
});

// Kiểm tra định dạng tệp tin cho phép
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml"
  ];
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error("Định dạng tệp không hợp lệ! Hệ thống chỉ chấp nhận ảnh mã QR có định dạng PNG, JPG, JPEG, WEBP hoặc SVG."),
      false
    );
  }
};

// Cấu hình giới hạn kích thước tối đa 5MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
}).single("qrImage");

// Middleware wrapper để xử lý lỗi multer và phản hồi JSON thân thiện
function uploadQr(req, res, next) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Kích thước tệp vượt quá giới hạn tối đa 5MB. Vui lòng nén hoặc chọn tệp ảnh QR nhỏ hơn."
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi tải tệp lên: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Tệp tải lên không hợp lệ."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn tệp hình ảnh mã QR cần tải lên."
      });
    }

    next();
  });
}

module.exports = {
  uploadQr,
  QR_UPLOAD_DIR
};
