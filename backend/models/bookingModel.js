const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const { connectDB } = require("../config/db");
const User = require("./userModel");

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "bookings.json");

// Schema MongoDB chuẩn cho collection 'bookings' trong database 'hotel_booking_db'
const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true },
    bookingCode: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: null, index: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    roomId: { type: String, required: true, index: true },
    roomName: { type: String, default: "Phòng khách sạn" },
    roomType: { type: String, default: "Phòng tiêu chuẩn" },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    nights: { type: Number, required: true, min: 1 },
    guests: { type: Number, default: 1, min: 1 },
    roomPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: "cash" },
    paymentStatus: { type: String, default: "Chưa thanh toán" },
    status: { type: String, default: "Chờ xác nhận", index: true },
    checkInStatus: { type: String, default: "Chưa nhận phòng" },
    checkOutStatus: { type: String, default: "Chưa trả phòng" },
    specialRequests: { type: String, default: "" },
    confirmedAt: { type: String, default: null },
    confirmedBy: { type: String, default: null },
    actualCheckInTime: { type: String, default: null },
    checkedInBy: { type: String, default: null },
    actualCheckOutTime: { type: String, default: null },
    checkedOutBy: { type: String, default: null },
    paidAt: { type: String, default: null },
    paymentConfirmedBy: { type: String, default: null },
    cancelledAt: { type: String, default: null },
    cancelledBy: { type: String, default: null },
    cancelReason: { type: String, default: null },
    checkoutRequestedAt: { type: String, default: null },
    checkoutRequestedDate: { type: String, default: null },
    earlyCheckoutReason: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: "bookings",
    timestamps: false,
    versionKey: false
  }
);

// Tạo Model Mongoose liên kết trực tiếp collection bookings
const BookingDoc = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

// Đọc và sao lưu tệp JSON phụ trợ để giữ tính tương thích
async function readBackupBookings() {
  try {
    if (fsSync.existsSync(DATA_FILE)) {
      const content = await fs.readFile(DATA_FILE, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (e) {
    console.error("Lỗi đọc backup bookings.json:", e.message);
  }
  return [];
}

async function writeBackupBookings(bookings) {
  try {
    if (!fsSync.existsSync(DATA_DIR)) {
      fsSync.mkdirSync(DATA_DIR, { recursive: true });
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(bookings, null, 2), "utf-8");
  } catch (e) {
    console.error("Lỗi ghi backup bookings.json:", e.message);
  }
}

// Đồng bộ các đơn đặt phòng từ JSON sang MongoDB khi khởi động (nếu MongoDB chưa có)
let hasSyncedInitial = false;
async function syncInitialData() {
  if (hasSyncedInitial) return;
  try {
    await connectDB();
    const backupList = await readBackupBookings();
    if (backupList.length > 0) {
      for (const b of backupList) {
        if (!b.bookingCode && !b.id) continue;
        const code = b.bookingCode || b.id;
        await BookingDoc.updateOne(
          { $or: [{ bookingCode: code }, { id: code }] },
          { $setOnInsert: { ...b, id: code, bookingCode: code } },
          { upsert: true }
        );
      }
    }
    hasSyncedInitial = true;
  } catch (err) {
    console.error("Lỗi đồng bộ dữ liệu ban đầu vào MongoDB:", err.message);
  }
}

// Tự động tạo mã đặt phòng duy nhất dạng BK-YYYY-XXXX dựa trên MongoDB
async function generateUniqueBookingCode() {
  await connectDB();
  const currentYear = new Date().getFullYear();
  let maxNumber = 1000;

  try {
    // 1. Quét mã từ MongoDB
    const docs = await BookingDoc.find(
      {
        $or: [
          { bookingCode: new RegExp(`^BK-${currentYear}-\\d+`, "i") },
          { id: new RegExp(`^BK-${currentYear}-\\d+`, "i") }
        ]
      },
      { bookingCode: 1, id: 1 }
    ).lean();

    for (const b of docs) {
      const code = b.bookingCode || b.id || "";
      const match = code.match(/BK-\d{4}-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    // 2. Kiểm tra thêm tệp backup để đảm bảo không trùng
    const backupList = await readBackupBookings();
    for (const b of backupList) {
      const code = b.bookingCode || b.id || "";
      const match = code.match(/BK-\d{4}-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  } catch (err) {
    console.error("Lỗi khi tìm mã booking lớn nhất:", err.message);
  }

  return `BK-${currentYear}-${maxNumber + 1}`;
}

// Khởi chạy đồng bộ ban đầu
syncInitialData().catch(e => console.error("Sync data error:", e));

module.exports = {
  BookingDoc,

  // 1. Lấy danh sách toàn bộ đơn đặt phòng từ MongoDB
  async getAll(filters = {}) {
    await connectDB();
    const query = {};

    // Lọc theo userId
    if (filters.userId) {
      query.userId = String(filters.userId).trim();
    }

    // Lọc theo trạng thái (hỗ trợ cả tiếng Việt và "pending")
    if (filters.status && filters.status !== "Tất cả" && filters.status !== "ALL") {
      const st = String(filters.status).trim();
      if (st.toLowerCase() === "pending") {
        query.status = { $in: ["Chờ xác nhận", "pending", "Pending"] };
      } else {
        query.status = new RegExp(`^${st}$`, "i");
      }
    }

    // Tìm kiếm tổng quát theo mã đơn, tên khách, sđt, email, tên phòng
    if (filters.search) {
      const q = String(filters.search).trim();
      const regex = new RegExp(q, "i");
      query.$or = [
        { bookingCode: regex },
        { id: regex },
        { customerName: regex },
        { phone: regex },
        { email: regex },
        { roomName: regex }
      ];
    }

    const bookings = await BookingDoc.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return bookings.map(b => ({
      ...b,
      id: b.id || b.bookingCode || String(b._id)
    }));
  },

  // 2. Tìm đơn đặt phòng theo ID hoặc Mã đơn từ MongoDB
  async getById(id) {
    if (!id) return null;
    await connectDB();
    const cleanId = String(id).trim();

    const query = {
      $or: [
        { id: cleanId },
        { bookingCode: cleanId }
      ]
    };

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      query.$or.push({ _id: cleanId });
    }

    const doc = await BookingDoc.findOne(query).lean();
    if (!doc) return null;

    return {
      ...doc,
      id: doc.id || doc.bookingCode || String(doc._id)
    };
  },

  // 3. Tạo đơn đặt phòng mới LƯU TRỰC TIẾP VÀO MONGODB
  async create(bookingData) {
    await connectDB();

    // Sinh mã đặt phòng duy nhất dạng BK-YYYY-XXXX
    const code = await generateUniqueBookingCode();

    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const nights = bookingData.nights || diffDays;
    const roomPrice = Number(bookingData.roomPrice) || 0;
    const totalPrice = bookingData.totalPrice ? Number(bookingData.totalPrice) : (nights * roomPrice);

    // Xác định userId nếu có tài khoản liên kết
    let userId = bookingData.userId || null;
    if (!userId && (bookingData.email || bookingData.phone)) {
      try {
        const user = (await User.findByEmail(bookingData.email)) || (await User.findByPhone(bookingData.phone));
        if (user) {
          userId = user.id;
        }
      } catch (e) {
        console.error("Lỗi tìm kiếm user theo thông tin booking:", e.message);
      }
    }

    // Chuẩn hóa phương thức thanh toán
    const paymentMethod = bookingData.paymentMethod || "cash";

    // Phân biệt trạng thái thanh toán mặc định
    let paymentStatus = bookingData.paymentStatus;
    if (!paymentStatus) {
      if (paymentMethod === "bank_transfer") {
        paymentStatus = "Chờ xác nhận chuyển khoản";
      } else {
        paymentStatus = "Chưa thanh toán";
      }
    }

    // Trạng thái đơn đặt phòng luôn khởi tạo ở trạng thái Chờ xác nhận
    const status = bookingData.status || "Chờ xác nhận";

    const newBooking = {
      id: code,
      bookingCode: code,
      userId: userId,
      customerName: String(bookingData.customerName).trim(),
      phone: String(bookingData.phone).trim(),
      email: String(bookingData.email).trim(),
      roomId: String(bookingData.roomId).trim(),
      roomName: bookingData.roomName || "Phòng khách sạn",
      roomType: bookingData.roomType || "Phòng tiêu chuẩn",
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      nights: nights,
      guests: Number(bookingData.guests) || 1,
      roomPrice: roomPrice,
      totalPrice: totalPrice,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      status: status,
      checkInStatus: bookingData.checkInStatus || "Chưa nhận phòng",
      checkOutStatus: bookingData.checkOutStatus || "Chưa trả phòng",
      specialRequests: bookingData.specialRequests || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 🚀 LƯU VÀO MONGODB COLLECTION BOOKINGS
    const savedDoc = await BookingDoc.create(newBooking);
    const plainBooking = savedDoc.toObject ? savedDoc.toObject() : savedDoc;
    plainBooking.id = plainBooking.id || plainBooking.bookingCode;

    // Đồng bộ vào tệp JSON sao lưu
    readBackupBookings().then(async (list) => {
      list.unshift(plainBooking);
      await writeBackupBookings(list);
    }).catch(e => console.error("Lỗi đồng bộ file sao lưu:", e.message));

    console.log(`✅ [MongoDB] Đã lưu thành công đơn đặt phòng mới vào MongoDB: ${plainBooking.bookingCode} (Khách: ${plainBooking.customerName})`);
    return plainBooking;
  },

  // 4. Cập nhật thông tin đơn đặt phòng trên MongoDB
  async update(id, updateData) {
    if (!id) return null;
    await connectDB();
    const cleanId = String(id).trim();

    const query = {
      $or: [
        { id: cleanId },
        { bookingCode: cleanId }
      ]
    };

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      query.$or.push({ _id: cleanId });
    }

    const safeUpdate = { ...updateData };
    delete safeUpdate._id;
    delete safeUpdate.id;
    delete safeUpdate.bookingCode;
    safeUpdate.updatedAt = new Date().toISOString();

    const updatedDoc = await BookingDoc.findOneAndUpdate(
      query,
      { $set: safeUpdate },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedDoc) return null;

    const plain = {
      ...updatedDoc,
      id: updatedDoc.id || updatedDoc.bookingCode
    };

    // Đồng bộ vào tệp JSON sao lưu
    readBackupBookings().then(async (list) => {
      const idx = list.findIndex(b => (b.id && b.id === plain.id) || (b.bookingCode && b.bookingCode === plain.bookingCode));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...plain };
      } else {
        list.unshift(plain);
      }
      await writeBackupBookings(list);
    }).catch(e => console.error("Lỗi đồng bộ file sao lưu khi update:", e.message));

    return plain;
  },

  // 5. Xóa đơn đặt phòng khỏi MongoDB
  async delete(id) {
    if (!id) return false;
    await connectDB();
    const cleanId = String(id).trim();

    const query = {
      $or: [
        { id: cleanId },
        { bookingCode: cleanId }
      ]
    };

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      query.$or.push({ _id: cleanId });
    }

    const result = await BookingDoc.findOneAndDelete(query);
    if (result) {
      readBackupBookings().then(async (list) => {
        const filtered = list.filter(b => b.id !== cleanId && b.bookingCode !== cleanId);
        await writeBackupBookings(filtered);
      }).catch(e => console.error("Lỗi đồng bộ file sao lưu khi delete:", e.message));
      return true;
    }
    return false;
  }
};
