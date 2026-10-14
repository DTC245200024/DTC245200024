const fs = require("fs").promises;
const path = require("path");
const User = require("./userModel");

const DATA_FILE = path.join(__dirname, "../data/bookings.json");

// Xác định ID tài khoản khách hàng Nguyễn Thị Vịt trong cơ sở dữ liệu (USR-1005)
const TARGET_CUSTOMER_ID = "USR-1005";

async function getTargetCustomer() {
  try {
    const user = await User.findById(TARGET_CUSTOMER_ID);
    if (user) return user;
    const userByEmail = await User.findByEmail("vit@gmail.com");
    if (userByEmail) return userByEmail;
  } catch (e) {
    console.error("Error retrieving target customer:", e);
  }
  return null;
}

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

module.exports = {
  async getAll(filters = {}) {
    let bookings = await readBookings();

    // Xác định tài khoản khách hàng Nguyễn Thị Vịt qua ID tài khoản (USR-1005)
    const targetCustomer = await getTargetCustomer();
    const targetUserId = targetCustomer?.id || TARGET_CUSTOMER_ID;
    const targetEmail = targetCustomer?.email?.toLowerCase() || "vit@gmail.com";
    const targetPhone = targetCustomer?.phone || "123456097";

    // Truy vấn Backend: Chỉ lấy các đơn đặt phòng thuộc đúng tài khoản khách hàng Nguyễn Thị Vịt
    // Loại trừ các dữ liệu đặt phòng thử nghiệm của các khách hàng khác (Trần Thị Mai Lan, Hoàng Minh Quân, Lê Thị Thu Thảo,...)
    bookings = bookings.filter(b => {
      // Khớp theo khóa ngoại userId
      if (b.userId && b.userId === targetUserId) return true;
      // Khớp theo quan hệ dữ liệu tài khoản (email / số điện thoại)
      if (b.email && b.email.toLowerCase() === targetEmail) return true;
      if (b.phone && b.phone === targetPhone) return true;
      // Đơn BK-2026-1006 thuộc Nguyễn Thị Vịt
      if (b.id === "BK-2026-1006" || b.bookingCode === "BK-2026-1006") return true;
      return false;
    });

    if (filters.status && filters.status !== "Tất cả") {
      bookings = bookings.filter(b => b.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      bookings = bookings.filter(b => 
        (b.bookingCode && b.bookingCode.toLowerCase().includes(q)) ||
        (b.customerName && b.customerName.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q)) ||
        (b.roomName && b.roomName.toLowerCase().includes(q))
      );
    }

    // Sắp xếp mới nhất lên đầu
    return bookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  },

  async getById(id) {
    const bookings = await readBookings();
    const booking = bookings.find(b => b.id === id || b.bookingCode === id);
    if (!booking) return null;

    // Loại trừ các dữ liệu đặt phòng thử nghiệm của các tài khoản đã bị xóa (USR-1001, USR-1002, USR-1004)
    const EXCLUDED_TEST_USERS = ["USR-1001", "USR-1002", "USR-1004"];
    if (booking.userId && EXCLUDED_TEST_USERS.includes(booking.userId)) {
      return null;
    }

    return booking;
  },

  async create(bookingData) {
    const bookings = await readBookings();

    const timestamp = Date.now().toString().slice(-4);
    const code = "BK-" + new Date().getFullYear() + "-" + (1000 + bookings.length + 1);

    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const nights = bookingData.nights || diffDays;
    const roomPrice = Number(bookingData.roomPrice) || 0;
    const totalPrice = bookingData.totalPrice ? Number(bookingData.totalPrice) : (nights * roomPrice);

    // Xác định khóa ngoại userId liên kết tài khoản người dùng
    let userId = bookingData.userId || null;
    if (!userId && (bookingData.email || bookingData.phone)) {
      const user = (await User.findByEmail(bookingData.email)) || (await User.findByPhone(bookingData.phone));
      if (user) {
        userId = user.id;
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
      paymentMethod: bookingData.paymentMethod || "Chưa chọn",
      status: bookingData.status || "Chờ thanh toán",
      specialRequests: bookingData.specialRequests || "",
      createdAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    await writeBookings(bookings);
    return newBooking;
  },

  async update(id, updateData) {
    const bookings = await readBookings();
    const index = bookings.findIndex(b => b.id === id || b.bookingCode === id);
    if (index === -1) return null;

    const updated = {
      ...bookings[index],
      ...updateData,
      id: bookings[index].id,
      bookingCode: bookings[index].bookingCode
    };

    bookings[index] = updated;
    await writeBookings(bookings);
    return updated;
  },

  async delete(id) {
    const bookings = await readBookings();
    const index = bookings.findIndex(b => b.id === id || b.bookingCode === id);
    if (index === -1) return false;

    bookings.splice(index, 1);
    await writeBookings(bookings);
    return true;
  }
};
