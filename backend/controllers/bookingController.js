const Booking = require("../models/bookingModel");
const Room = require("../models/roomModel");
const User = require("../models/userModel");

module.exports = {
  // GET /api/bookings
  async getAllBookings(req, res) {
    try {
      const { status, search } = req.query;
      const bookings = await Booking.getAll({ status, search });
      res.json({
        success: true,
        count: bookings.length,
        data: bookings
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy danh sách đặt phòng" });
    }
  },

  // GET /api/bookings/:id
  async getBookingById(req, res) {
    try {
      const booking = await Booking.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
      }
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi lấy chi tiết đơn đặt phòng" });
    }
  },

  // POST /api/bookings
  async createBooking(req, res) {
    try {
      const { customerName, phone, email, roomId, checkIn, checkOut } = req.body;
      if (!customerName || !phone || !email || !roomId || !checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ: Họ tên, Số điện thoại, Email, Phòng, Ngày nhận và Ngày trả phòng"
        });
      }

      const room = await Room.getById(roomId);
      let roomPrice = req.body.roomPrice;
      let roomName = req.body.roomName;
      let roomType = req.body.roomType;

      if (room) {
        roomPrice = roomPrice || room.price;
        roomName = roomName || room.name;
        roomType = roomType || room.type;
      }

      let userId = req.body.userId || req.headers["x-user-id"] || null;
      const bookingPayload = {
        ...req.body,
        userId,
        roomPrice,
        roomName,
        roomType,
        status: req.body.status || "Chờ xác nhận",
        checkInStatus: req.body.checkInStatus || "Chưa nhận phòng",
        checkOutStatus: req.body.checkOutStatus || "Chưa trả phòng",
        paymentStatus: req.body.paymentStatus || (req.body.paymentMethod === "bank_transfer" ? "Đã thanh toán" : "Chờ thanh toán")
      };

      const newBooking = await Booking.create(bookingPayload);

      res.status(201).json({
        success: true,
        message: "Đặt phòng thành công! Mã đơn của bạn là " + newBooking.bookingCode,
        data: newBooking
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi xử lý đặt phòng" });
    }
  },

  // PUT /api/bookings/:id/confirm (Staff / Admin)
  async confirmBooking(req, res) {
    try {
      const userRole = (req.headers["x-user-role"] || "").toUpperCase();
      if (userRole && userRole !== "ADMIN" && userRole !== "STAFF") {
        return res.status(403).json({
          success: false,
          message: "Chỉ Quản trị viên (ADMIN) hoặc Lễ tân (STAFF) mới có quyền xác nhận đơn đặt phòng."
        });
      }

      const booking = await Booking.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng để xác nhận" });
      }

      if (booking.status !== "Chờ xác nhận" && booking.status !== "Chờ thanh toán") {
        return res.status(400).json({
          success: false,
          message: `Đơn đặt phòng đang ở trạng thái "${booking.status}", không thể xác nhận lại.`
        });
      }

      const updated = await Booking.update(req.params.id, {
        status: "Đã xác nhận",
        checkInStatus: "Chưa nhận phòng",
        checkOutStatus: "Chưa trả phòng",
        confirmedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: "Đã xác nhận đơn đặt phòng thành công.",
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi xác nhận đơn đặt phòng" });
    }
  },

  // PUT /api/bookings/:id/cancel (Customer / Staff / Admin)
  async cancelBooking(req, res) {
    try {
      const bookingId = req.params.id;
      const booking = await Booking.getById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn đặt phòng."
        });
      }

      // 1. Kiểm tra quyền sở hữu (Chỉ chủ đơn hoặc Admin/Lễ tân mới được hủy)
      const requestingUserId = req.headers["x-user-id"] || req.body?.userId;
      const userRole = (req.headers["x-user-role"] || "").toUpperCase();
      const isStaffOrAdmin = userRole === "ADMIN" || userRole === "STAFF";

      let isOwner = false;
      if (requestingUserId && booking.userId && requestingUserId === booking.userId) {
        isOwner = true;
      }
      if (!isOwner && requestingUserId) {
        const user = await User.findById(requestingUserId);
        if (user) {
          if (user.email && booking.email && user.email.toLowerCase() === booking.email.toLowerCase()) {
            isOwner = true;
          }
          if (user.phone && booking.phone && user.phone === booking.phone) {
            isOwner = true;
          }
        }
      }
      if (!isOwner && req.body?.email && booking.email && req.body.email.toLowerCase() === booking.email.toLowerCase()) {
        isOwner = true;
      }

      if (!isOwner && !isStaffOrAdmin) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền hủy đơn đặt phòng này. Chỉ tài khoản chủ đơn mới được phép hủy."
        });
      }

      // 2. Kiểm tra trạng thái đơn: Không cho phép hủy nếu Lễ tân đã xác nhận, đã nhận phòng, đã trả phòng hoặc đã hủy
      if (booking.status === "Đã xác nhận" || booking.confirmedAt) {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng đã được Lễ tân xác nhận. Quý khách không thể tự hủy đơn này."
        });
      }

      if (booking.status === "Đã nhận phòng" || booking.checkInStatus === "Đã nhận phòng" || booking.status === "Khách yêu cầu nhận phòng") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng đang trong quá trình nhận phòng hoặc đã nhận phòng, không thể hủy."
        });
      }

      if (booking.status === "Đã trả phòng" || booking.checkOutStatus === "Đã trả phòng" || booking.status === "Khách yêu cầu trả phòng") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng đã hoàn tất thủ tục trả phòng, không thể hủy."
        });
      }

      if (booking.status === "Đã hủy") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng này đã được hủy trước đó."
        });
      }

      // Chỉ cho phép hủy khi trạng thái là "Chờ xác nhận"
      if (booking.status !== "Chờ xác nhận") {
        return res.status(400).json({
          success: false,
          message: `Không thể hủy đơn đặt phòng đang ở trạng thái "${booking.status}". Chỉ cho phép hủy khi đơn ở trạng thái "Chờ xác nhận".`
        });
      }

      // 3. Cập nhật trạng thái đơn thành "Đã hủy" (giữ nguyên thông tin thanh toán, không xóa hóa đơn)
      const updateData = {
        status: "Đã hủy",
        cancelledAt: new Date().toISOString(),
        cancelledBy: requestingUserId || (isStaffOrAdmin ? "Lễ tân" : "Khách hàng"),
        cancelReason: req.body?.reason || "Khách hàng xác nhận hủy đơn trên website"
      };

      const updated = await Booking.update(bookingId, updateData);

      // 4. Giải phóng phòng đã giữ nếu phòng đang ở trạng thái "Đã đặt"
      if (booking.roomId) {
        const room = await Room.getById(booking.roomId);
        if (room && (room.status === "Đã đặt" || room.status === "Đang giữ chỗ")) {
          await Room.update(booking.roomId, { status: "Trống" });
        }
      }

      res.json({
        success: true,
        message: "Hủy đơn đặt phòng thành công.",
        data: updated
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi hủy đơn đặt phòng" });
    }
  },

  // PUT /api/bookings/:id/request-checkin (Customer)
  async requestCheckIn(req, res) {
    try {
      const booking = await Booking.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
      }

      if (booking.status !== "Đã xác nhận" && booking.checkInStatus === "Đã nhận phòng") {
        return res.status(400).json({
          success: false,
          message: `Không thể gửi yêu cầu nhận phòng cho đơn này.`
        });
      }

      const updated = await Booking.update(req.params.id, {
        status: "Khách yêu cầu nhận phòng",
        checkInStatus: "Chờ lễ tân xác nhận",
        checkInRequestedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: "Đã gửi yêu cầu nhận phòng. Vui lòng chờ Lễ tân xác nhận.",
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi gửi yêu cầu nhận phòng" });
    }
  },

  // PUT /api/bookings/:id/request-checkout (Customer)
  async requestCheckout(req, res) {
    try {
      const booking = await Booking.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
      }

      // Customer CANNOT request checkout if not checked in yet!
      const isCheckedIn = booking.checkInStatus === "Đã nhận phòng" || booking.status === "Đã nhận phòng";
      if (!isCheckedIn) {
        return res.status(400).json({
          success: false,
          message: `Quý khách chưa hoàn tất thủ tục nhận phòng nên chưa thể gửi yêu cầu trả phòng.`
        });
      }

      const requestedDate = req.body.requestedDate || new Date().toISOString().split("T")[0];
      const updated = await Booking.update(req.params.id, {
        status: "Khách yêu cầu trả phòng",
        checkOutStatus: "Chờ lễ tân xác nhận",
        checkoutRequestedAt: new Date().toISOString(),
        checkoutRequestedDate: requestedDate,
        earlyCheckoutReason: req.body.reason || "Yêu cầu trả phòng từ khách hàng"
      });

      res.json({
        success: true,
        message: "Đã gửi yêu cầu trả phòng. Vui lòng chờ Lễ tân xác nhận.",
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi gửi yêu cầu trả phòng" });
    }
  },

  // PUT /api/bookings/:id/checkin (Staff / Admin)
  async checkInBooking(req, res) {
    try {
      const userRole = (req.headers["x-user-role"] || "").toUpperCase();
      if (userRole && userRole !== "ADMIN" && userRole !== "STAFF") {
        return res.status(403).json({
          success: false,
          message: "Chỉ Quản trị viên (ADMIN) hoặc Lễ tân (STAFF) mới có quyền thực hiện thủ tục nhận phòng."
        });
      }

      const booking = await Booking.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
      }

      // Không cho phép nhận phòng lặp lại hoặc khi đã ở trạng thái cuối
      if (booking.status === "Đã nhận phòng" || booking.checkInStatus === "Đã nhận phòng") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng này đã hoàn tất thủ tục nhận phòng trước đó."
        });
      }

      if (booking.status === "Đã trả phòng" || booking.checkOutStatus === "Đã trả phòng") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng này đã hoàn tất thủ tục trả phòng, không thể nhận phòng lại."
        });
      }

      if (booking.status === "Đã hủy") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng này đã bị hủy, không thể làm thủ tục nhận phòng."
        });
      }

      const updated = await Booking.update(req.params.id, {
        status: "Đã nhận phòng",
        checkInStatus: "Đã nhận phòng",
        checkOutStatus: "Chưa trả phòng",
        actualCheckInTime: new Date().toISOString(),
        checkedInBy: req.body.staffName || "Lễ tân"
      });

      // Update room status to "Đang sử dụng"
      if (booking.roomId) {
        await Room.update(booking.roomId, { status: "Đang sử dụng" });
      }

      res.json({
        success: true,
        message: "Thực hiện thủ tục nhận phòng thành công!",
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi xử lý nhận phòng" });
    }
  },

  // PUT /api/bookings/:id/checkout (Staff / Admin)
  async checkOutBooking(req, res) {
    try {
      const userRole = (req.headers["x-user-role"] || "").toUpperCase();
      if (userRole && userRole !== "ADMIN" && userRole !== "STAFF") {
        return res.status(403).json({
          success: false,
          message: "Chỉ Quản trị viên (ADMIN) hoặc Lễ tân (STAFF) mới có quyền xác nhận trả phòng."
        });
      }

      const booking = await Booking.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
      }

      // Không cho phép trả phòng lặp lại
      if (booking.status === "Đã trả phòng" || booking.checkOutStatus === "Đã trả phòng") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng này đã hoàn tất thủ tục trả phòng trước đó."
        });
      }

      // Chỉ cho phép trả phòng khi đơn đang ở trạng thái đã nhận phòng hoặc khách yêu cầu trả phòng
      const isCheckedIn = booking.status === "Đã nhận phòng" || booking.checkInStatus === "Đã nhận phòng" || booking.status === "Khách yêu cầu trả phòng";
      if (!isCheckedIn) {
        return res.status(400).json({
          success: false,
          message: "Khách hàng chưa làm thủ tục nhận phòng nên không thể thực hiện trả phòng."
        });
      }

      // Check payment status
      const isPaid = booking.paymentStatus === "Đã thanh toán" || req.body.processPayment === true;
      if (!isPaid) {
        return res.status(400).json({
          success: false,
          requiresPayment: true,
          message: "Đơn chưa hoàn tất thanh toán. Vui lòng thu tiền và xác nhận thanh toán trước khi trả phòng."
        });
      }

      const updated = await Booking.update(req.params.id, {
        status: "Đã trả phòng",
        checkInStatus: "Đã nhận phòng",
        checkOutStatus: "Đã trả phòng",
        paymentStatus: "Đã thanh toán",
        actualCheckOutTime: new Date().toISOString(),
        checkedOutBy: req.body.staffName || "Lễ tân"
      });

      // Update room status sang "Đang dọn dẹp" (cần dọn dẹp) theo quy tắc nghiệp vụ khách sạn
      if (booking.roomId) {
        await Room.update(booking.roomId, { status: "Đang dọn dẹp" });
      }

      res.json({
        success: true,
        message: "Đã xác nhận trả phòng thành công. Phòng đã chuyển sang trạng thái Đang dọn dẹp.",
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi xử lý trả phòng" });
    }
  },

  // PUT /api/bookings/:id
  async updateBooking(req, res) {
    try {
      if (req.body && req.body.status === "Đã hủy") {
        return module.exports.cancelBooking(req, res);
      }
      const updated = await Booking.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng để cập nhật" });
      }
      res.json({
        success: true,
        message: "Cập nhật đơn đặt phòng thành công",
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi cập nhật đơn đặt phòng" });
    }
  },

  // DELETE /api/bookings/:id
  async deleteBooking(req, res) {
    try {
      const success = await Booking.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng để xóa" });
      }
      res.json({
        success: true,
        message: "Xóa đơn đặt phòng thành công"
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi xóa đơn đặt phòng" });
    }
  },

  // GET /api/stats (Admin Dashboard metrics)
  async getDashboardStats(req, res) {
    try {
      const rooms = await Room.getAll();
      const bookings = await Booking.getAll();
      const users = await User.getAll();

      const totalRooms = rooms.length;
      const availableRooms = rooms.filter(r => r.status === "Trống").length;
      const bookedRooms = rooms.filter(r => r.status === "Đã đặt" || r.status === "Đang sử dụng").length;
      const maintenanceRooms = rooms.filter(r => r.status === "Đang bảo trì").length;

      const customers = users.filter(u => u.role === "CUSTOMER");
      const totalCustomers = customers.length;

      const totalBookings = bookings.length;
      const pendingConfirmation = bookings.filter(b => b.status === "Chờ xác nhận").length;
      const pendingPayment = bookings.filter(b => b.status === "Chờ thanh toán").length;
      const confirmedBookings = bookings.filter(b => b.status === "Đã xác nhận" || b.status === "Đã nhận phòng" || b.status === "Khách yêu cầu nhận phòng" || b.status === "Khách yêu cầu trả phòng" || b.status === "Đã thanh toán").length;
      
      const totalRevenue = bookings
        .filter(b => b.status !== "Đã hủy")
        .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

      res.json({
        success: true,
        data: {
          totalRooms,
          availableRooms,
          bookedRooms,
          maintenanceRooms,
          totalCustomers,
          totalBookings,
          pendingConfirmation,
          pendingPayment,
          confirmedBookings,
          totalRevenue
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi lấy thống kê" });
    }
  }
};
