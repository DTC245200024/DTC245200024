const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const fs = require("fs");
const path = require("path");

const SETTINGS_FILE = path.join(__dirname, "../data/settings.json");

function loadSystemSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error loading settings from file:", err);
  }
  return {
    hotelName: "HOTEL 5 SAO",
    hotelAddress: "ngã ba bản kè, xã Lâm Bình, tỉnh Tuyên Quang",
    hotelPhone: "1900 6868 - (028) 3822 8888",
    hotelEmail: "nguyenthuychang519@gmail.com",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    cancelPolicyHours: 24,
    vatRate: 10,
    bankName: "Ngân hàng TMCP Quân Đội (MB Bank)",
    bankAccount: "0964880630",
    bankAccountName: "NGUYEN THUY CHANG",
    allowPayAtHotel: true,
    maintenanceMode: false,
    qrCodeUrl: ""
  };
}

function saveSystemSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving settings to file:", err);
  }
}

let systemSettings = loadSystemSettings();

module.exports = {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { name, email, phone, password, confirmPassword } = req.body;

      if (!name || !email || !phone || !password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ các thông tin: Họ tên, Email, Số điện thoại và Mật khẩu"
        });
      }

      if (confirmPassword && password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu xác nhận không trùng khớp"
        });
      }

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng email khác."
        });
      }

      const existingPhone = await User.findByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Số điện thoại này đã được sử dụng."
        });
      }

      const newUser = await User.create({
        name,
        email,
        phone,
        password
      });

      const { password: _, ...userSafe } = newUser;

      res.status(201).json({
        success: true,
        message: "Đăng ký tài khoản khách hàng thành công!",
        data: userSafe,
        user: userSafe
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi đăng ký tài khoản" });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { identifier, email, phone, password } = req.body;
      const loginKey = (identifier || email || phone || "").trim();
      const clientIp = req.ip || req.connection?.remoteAddress || "unknown";

      if (!loginKey || !password) {
        console.warn(`[AUTH] LOGIN_FAILED: Missing identifier or password (IP: ${clientIp})`);
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập Email hoặc Số điện thoại cùng Mật khẩu"
        });
      }

      let user = await User.findByEmail(loginKey);
      if (!user) {
        user = await User.findByPhone(loginKey);
      }

      if (!user) {
        console.warn(`[AUTH] LOGIN_FAILED: Account not found for identifier="${loginKey}" (IP: ${clientIp})`);
        return res.status(401).json({
          success: false,
          message: "Tài khoản không tồn tại. Vui lòng kiểm tra lại email hoặc số điện thoại."
        });
      }

      if (user.status === "locked") {
        console.warn(`[AUTH] LOGIN_FAILED: Account is locked for user_id=${user.id}, email="${user.email}" (IP: ${clientIp})`);
        return res.status(403).json({
          success: false,
          message: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Quản trị viên hệ thống."
        });
      }

      // Xác thực mật khẩu với bcryptjs (so sánh với hash lưu trong PostgreSQL)
      let isPasswordValid = User.comparePassword(password, user.password);

      // Dự phòng thông minh cho tài khoản Quản trị viên (Admin Default):
      // Nếu mật khẩu khớp với ADMIN_PASSWORD trong env hoặc mật khẩu chuẩn Admin@123 / admin123
      const envAdminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
      if (!isPasswordValid && (user.role === "ADMIN" || user.email === "admin@grandpalace.vn")) {
        if (password === envAdminPassword || password === "Admin@123" || password === "admin123") {
          isPasswordValid = true;
          try {
            const newHash = User.hashPassword(password);
            await User.update(user.id, { password: newHash });
          } catch (syncErr) {
            console.warn("Không thể tự động đồng bộ admin hash:", syncErr.message);
          }
        }
      }

      if (!isPasswordValid) {
        console.warn(`[AUTH] LOGIN_FAILED: Invalid password for user_id=${user.id}, email="${user.email}" (IP: ${clientIp})`);
        return res.status(401).json({
          success: false,
          message: "Mật khẩu không chính xác. Vui lòng thử lại."
        });
      }

      // Tự động nâng cấp mật khẩu plaintext sang bcrypt hash nếu phát hiện chưa được hash
      if (!User.isBcryptHash(user.password)) {
        try {
          const newHash = User.hashPassword(password);
          await User.update(user.id, { password: newHash });
        } catch (upgradeErr) {
          console.warn("Lưu ý: Không thể tự động nâng cấp bcrypt hash:", upgradeErr.message);
        }
      }

      const { password: _, ...userSafe } = user;

      console.info(`[AUTH] LOGIN_SUCCESS: user_id=${user.id}, email="${user.email}", role="${user.role}" (IP: ${clientIp})`);

      res.json({
        success: true,
        message: `Đăng nhập thành công! Chào mừng ${user.name} (${user.role})`,
        data: userSafe,
        user: userSafe
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi đăng nhập" });
    }
  },

  // GET /api/auth/users (Admin / Staff: Get customers list)
  async getAllUsers(req, res) {
    try {
      const users = await User.getAll();
      const bookings = await Booking.getAll();

      // Filter only customer accounts
      const customers = users.filter(u => u.role === "CUSTOMER");

      const userStats = customers.map(u => {
        const { password: _, ...safe } = u;
        const userBookings = bookings.filter(b => 
          (b.email && b.email.toLowerCase() === u.email.toLowerCase()) ||
          (b.phone && b.phone === u.phone)
        );

        const totalSpent = userBookings
          .filter(b => b.status !== "Đã hủy")
          .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

        return {
          ...safe,
          bookingsCount: userBookings.length,
          totalSpent: totalSpent
        };
      });

      res.json({
        success: true,
        count: userStats.length,
        data: userStats
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách người dùng" });
    }
  },

  // GET /api/staff (Get staff accounts)
  async getStaffList(req, res) {
    try {
      const users = await User.getAll();
      const staffList = users
        .filter(u => u.role === "STAFF")
        .map(u => {
          const { password: _, ...safe } = u;
          return safe;
        });

      res.json({
        success: true,
        count: staffList.length,
        data: staffList
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách lễ tân" });
    }
  },

  // POST /api/staff (Create new staff account)
  async createStaff(req, res) {
    try {
      const { name, email, phone, password } = req.body;
      if (!name || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ thông tin: Họ tên, Email và Số điện thoại"
        });
      }

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email này đã được sử dụng bởi một tài khoản khác trong hệ thống"
        });
      }

      const existingPhone = await User.findByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Số điện thoại này đã được đăng ký bởi tài khoản khác"
        });
      }

      const newStaff = await User.createStaff({
        name,
        email,
        phone,
        password: password || "Staff@123",
        department: "Lễ tân"
      });

      const { password: _, ...safe } = newStaff;
      res.status(201).json({
        success: true,
        message: "Tạo tài khoản lễ tân thành công",
        data: safe,
        user: safe
      });
    } catch (error) {
      console.error("Create staff error:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi tạo tài khoản lễ tân: " + error.message });
    }
  },

  // PUT /api/staff/:id/status (Lock/Unlock staff account)
  async toggleStaffStatus(req, res) {
    try {
      const updated = await User.toggleStaffStatus(req.params.id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài khoản lễ tân hoặc không thể thao tác"
        });
      }
      const { password: _, ...safe } = updated;
      res.json({
        success: true,
        message: `Đã ${updated.status === "active" ? "mở khóa" : "tạm khóa"} tài khoản lễ tân ${updated.name}`,
        data: safe,
        user: safe
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái lễ tân" });
    }
  },

  // DELETE /api/staff/:id (Delete staff)
  async deleteStaff(req, res) {
    try {
      const success = await User.deleteStaff(req.params.id);
      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy hoặc không có quyền xóa tài khoản này"
        });
      }
      res.json({
        success: true,
        message: "Đã xóa tài khoản lễ tân thành công"
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi xóa tài khoản lễ tân" });
    }
  },

  // GET /api/auth/settings (Admin only: System Settings)
  async getSettings(req, res) {
    res.json({
      success: true,
      data: systemSettings
    });
  },

  // PUT /api/auth/settings (Admin only: Update System Settings)
  async updateSettings(req, res) {
    try {
      systemSettings = {
        ...systemSettings,
        ...req.body
      };
      saveSystemSettings(systemSettings);
      res.json({
        success: true,
        message: "Cập nhật cấu hình hệ thống thành công",
        data: systemSettings
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi lưu cấu hình hệ thống" });
    }
  },

  // POST /api/auth/settings/qr-upload (Admin only: Upload VietQR Image)
  async uploadQrCode(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Không tìm thấy tệp ảnh tải lên" });
      }

      // Xóa ảnh QR cũ nếu tồn tại trong thư mục uploads/qr
      if (systemSettings.qrCodeUrl && systemSettings.qrCodeUrl.startsWith("/uploads/qr/")) {
        const oldPath = path.join(__dirname, "..", systemSettings.qrCodeUrl);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {
            console.error("Không thể xóa ảnh QR cũ:", e);
          }
        }
      }

      const relativeUrl = `/uploads/qr/${req.file.filename}`;
      systemSettings = {
        ...systemSettings,
        qrCodeUrl: relativeUrl
      };
      saveSystemSettings(systemSettings);

      res.json({
        success: true,
        message: "Tải lên ảnh mã QR thanh toán VietQR thành công",
        qrCodeUrl: relativeUrl,
        data: {
          qrCodeUrl: relativeUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          settings: systemSettings
        }
      });
    } catch (error) {
      console.error("Lỗi khi upload QR code:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi tải lên ảnh QR: " + error.message });
    }
  },

  // DELETE /api/auth/settings/qr-code (Admin only: Delete VietQR Image)
  async deleteQrCode(req, res) {
    try {
      if (systemSettings.qrCodeUrl && systemSettings.qrCodeUrl.startsWith("/uploads/qr/")) {
        const oldPath = path.join(__dirname, "..", systemSettings.qrCodeUrl);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {
            console.error("Lỗi khi xóa tệp ảnh QR:", e);
          }
        }
      }

      systemSettings = {
        ...systemSettings,
        qrCodeUrl: ""
      };
      saveSystemSettings(systemSettings);

      res.json({
        success: true,
        message: "Đã xóa ảnh mã QR thanh toán thành công",
        data: {
          qrCodeUrl: "",
          settings: systemSettings
        }
      });
    } catch (error) {
      console.error("Lỗi khi xóa QR code:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi xóa ảnh QR: " + error.message });
    }
  },

  // GET /api/auth/users/:id/bookings
  async getUserBookings(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
      }

      const bookings = await Booking.getAll();
      const userBookings = bookings.filter(b => 
        (b.email && b.email.toLowerCase() === user.email.toLowerCase()) ||
        (b.phone && b.phone === user.phone)
      );

      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
        count: userBookings.length,
        data: userBookings
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi lấy lịch sử đặt phòng của khách hàng" });
    }
  },

  // GET /api/auth/me/:id
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
      }
      const { password: _, ...userSafe } = user;
      res.json({ success: true, data: userSafe });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi lấy thông tin người dùng" });
    }
  },

  // PUT /api/auth/profile/:id
  async updateProfile(req, res) {
    try {
      const { name, phone } = req.body;
      const updated = await User.update(req.params.id, { name, phone });
      if (!updated) {
        return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản để cập nhật" });
      }
      const { password: _, ...userSafe } = updated;
      res.json({ success: true, message: "Cập nhật thông tin thành công", data: userSafe });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi cập nhật thông tin tài khoản" });
    }
  }
};
