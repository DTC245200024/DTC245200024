const fs = require("fs").promises;
const path = require("path");
const User = require("./userModel");

const DATA_FILE = path.join(__dirname, "../data/bookings.json");

async function readBookings() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading bookings data:", error);
    return [];
  }
}

async function writeBookings(bookings) {
  await fs.writeFile(DATA_FILE, JSON.stringify(bookings, null, 2), "utf-8");
}

function generateUniqueBookingCode(existingBookings) {
  const currentYear = new Date().getFullYear();
  let maxNumber = 1000;

  for (const b of existingBookings) {
    const code = b.bookingCode || b.id || "";
    const match = code.match(/BK-\d{4}-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  return `BK-${currentYear}-${maxNumber + 1}`;
}

module.exports = {
  // Lấy danh sách toàn bộ đơn đặt phòng (hỗ trợ lọc theo trạng thái, tìm kiếm, userId)
  async getAll(filters = {}) {
    let bookings = await readBookings();

    // Lọc theo userId nếu có yêu cầu từ phía client
    if (filters.userId) {
      const targetUserId = String(filters.userId).trim();
      bookings = bookings.filter(b => b.userId === targetUserId);
    }

    // Lọc theo trạng thái
    if (filters.status && filters.status !== "Tất cả") {
      const targetStatus = String(filters.status).toLowerCase().trim();
      bookings = bookings.filter(b => (b.status || "").toLowerCase().trim() === targetStatus);
    }

    // Tìm kiếm tổng quát theo mã đơn, tên khách, sđt, email, tên phòng
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      bookings = bookings.filter(b => 
        (b.bookingCode && b.bookingCode.toLowerCase().includes(q)) ||
        (b.id && b.id.toLowerCase().includes(q)) ||
        (b.customerName && b.customerName.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (b.roomName && b.roomName.toLowerCase().includes(q))
      );
    }

    // Sắp xếp đơn mới nhất lên đầu
    return bookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  // Tìm đơn đặt phòng theo ID hoặc Mã đơn (hỗ trợ case-insensitive và trim)
  async getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim().toLowerCase();
    const bookings = await readBookings();

    const booking = bookings.find(b => {
      const idMatch = b.id && String(b.id).trim().toLowerCase() === cleanId;
      const codeMatch = b.bookingCode && String(b.bookingCode).trim().toLowerCase() === cleanId;
      return idMatch || codeMatch;
    });

    return booking || null;
  },

  // Tạo đơn đặt phòng mới
  async create(bookingData) {
    const bookings = await readBookings();
    const code = generateUniqueBookingCode(bookings);

    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const nights = bookingData.nights || diffDays;
    const roomPrice = Number(bookingData.roomPrice) || 0;
    const totalPrice = bookingData.totalPrice ? Number(bookingData.totalPrice) : (nights * roomPrice);

    // Xác định userId nếu có liên kết tài khoản
    let userId = bookingData.userId || null;
    if (!userId && (bookingData.email || bookingData.phone)) {
      try {
        const user = (await User.findByEmail(bookingData.email)) || (await User.findByPhone(bookingData.phone));
        if (user) {
          userId = user.id;
        }
      } catch (e) {
        console.error("Error finding user for booking:", e);
      }
    }

    // Chuẩn hóa phương thức thanh toán
    const paymentMethod = bookingData.paymentMethod || "cash";

    // Phân biệt rõ trạng thái thanh toán theo yêu cầu nghiệp vụ
    let paymentStatus = bookingData.paymentStatus;
    if (!paymentStatus) {
      if (paymentMethod === "bank_transfer") {
        paymentStatus = "Chờ xác nhận chuyển khoản";
      } else {
        paymentStatus = "Chưa thanh toán";
      }
    }

    const newBooking = {
      id: code,
      bookingCode: code,
      userId: userId,
      customerName: bookingData.customerName,
      phone: bookingData.phone,
      email: bookingData.email,
      roomId: bookingData.roomId,
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
      status: "Chờ xác nhận", // Bắt buộc khởi tạo ở trạng thái Chờ xác nhận
      checkInStatus: "Chưa nhận phòng",
      checkOutStatus: "Chưa trả phòng",
      specialRequests: bookingData.specialRequests || "",
      createdAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    await writeBookings(bookings);
    return newBooking;
  },

  // Cập nhật thông tin đơn đặt phòng
  async update(id, updateData) {
    if (!id) return null;
    const cleanId = String(id).trim().toLowerCase();
    const bookings = await readBookings();

    const index = bookings.findIndex(b => {
      const idMatch = b.id && String(b.id).trim().toLowerCase() === cleanId;
      const codeMatch = b.bookingCode && String(b.bookingCode).trim().toLowerCase() === cleanId;
      return idMatch || codeMatch;
    });

    if (index === -1) return null;

    const current = bookings[index];
    const updated = {
      ...current,
      ...updateData,
      id: current.id, // Luôn bảo toàn ID gốc
      bookingCode: current.bookingCode // Luôn bảo toàn bookingCode gốc
    };

    bookings[index] = updated;
    await writeBookings(bookings);
    return updated;
  },

  // Xóa đơn đặt phòng
  async delete(id) {
    if (!id) return false;
    const cleanId = String(id).trim().toLowerCase();
    const bookings = await readBookings();

    const index = bookings.findIndex(b => {
      const idMatch = b.id && String(b.id).trim().toLowerCase() === cleanId;
      const codeMatch = b.bookingCode && String(b.bookingCode).trim().toLowerCase() === cleanId;
      return idMatch || codeMatch;
    });

    if (index === -1) return false;

    bookings.splice(index, 1);
    await writeBookings(bookings);
    return true;
  }
};
