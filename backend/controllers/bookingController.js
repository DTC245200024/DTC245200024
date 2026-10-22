const Booking = require("../models/bookingModel");
const Room = require("../models/roomModel");
const User = require("../models/userModel");

module.exports = {
  // GET /api/bookings
  async getAllBookings(req, res) {
    try {
      const { status, search, userId } = req.query;
      const userRole = (req.headers["x-user-role"] || "").toUpperCase();
      const currentUserId = req.headers["x-user-id"];

      const filters = { status, search };
      
      // Nếu là khách hàng thông thường truy vấn, chỉ trả về các đơn của khách đó
      if (userRole === "CUSTOMER" && currentUserId) {
        filters.userId = currentUserId;
      } else if (userId) {
        filters.userId = userId;
      }

      const bookings = await Booking.getAll(filters);
      res.json({
        success: true,
        count: bookings.length,
        data: bookings
      });
    } catch (error) {
      console.error("Error in getAllBookings:", error);
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
      console.error("Error in getBookingById:", error);
      res.status(500).json({ success: false, message: "Lỗi khi lấy chi tiết đơn đặt phòng" });
    }
  },

  // POST /api/bookings
  async createBooking(req, res) {
    try {
      const { customerName, phone, email, roomId, checkIn, checkOut, paymentMethod } = req.body;
      if (!customerName || !phone || !email || !roomId || !checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ: Họ tên, Số điện thoại, Email, Phòng, Ngày nhận và Ngày trả phòng"
        });
      }

      // Kiểm tra tính hợp lệ của ngày đặt phòng
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Định dạng ngày nhận hoặc ngày trả phòng không hợp lệ"
        });
      }

      if (outDate <= inDate) {
        return res.status(400).json({
          success: false,
          message: "Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm"
        });
      }

      const rawRoomId = roomId || req.body.roomCode || req.body.room_id || req.body.id;
      let room = await Room.getById(rawRoomId);

      // Nếu chưa thấy bằng id/mã phòng, thử tìm theo tên phòng (nếu có truyền)
      if (!room && req.body.roomName) {
        room = await Room.getByName(req.body.roomName);
      }

      // Tự động phục hồi & nạp dữ liệu mẫu nếu database đang trống phòng
      if (!room) {
        try {
          const totalRooms = await Room.count();
          if (totalRooms === 0) {
            const { autoSeedDatabase } = require("../config/seed");
            await autoSeedDatabase();
            room = (await Room.getById(rawRoomId)) || (req.body.roomName ? await Room.getByName(req.body.roomName) : null);
          }
        } catch (seedErr) {
          console.error("Auto-seed check error:", seedErr.message);
        }
      }

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Phòng khách sạn đã chọn không tồn tại hoặc đã ngừng phục vụ"
        });
      }

      let roomPrice = req.body.roomPrice || room.price;
      let roomName = req.body.roomName || room.name;
      let roomType = req.body.roomType || room.type;

      let userId = req.body.userId || req.headers["x-user-id"] || null;
      
      // Chuẩn hóa phương thức thanh toán
      const normalizedPaymentMethod = paymentMethod === "bank_transfer" ? "bank_transfer" : "cash";

      // Phân biệt rõ trạng thái thanh toán theo nghiệp vụ (Requirement 2, 3, 6)
      // Mặc định luôn là Chờ xác nhận chuyển khoản (đối với chuyển khoản) hoặc Chưa thanh toán (tại quầy)
      const paymentStatus = normalizedPaymentMethod === "bank_transfer" 
        ? "Chờ xác nhận chuyển khoản" 
        : "Chưa thanh toán";

      const bookingPayload = {
        ...req.body,
        roomId: room.id,
        roomCode: room.roomCode,
        userId,
        roomPrice,
        roomName,
        roomType,
        paymentMethod: normalizedPaymentMethod,
        paymentStatus: paymentStatus,
        status: "Chờ xác nhận", // Đơn mới luôn có trạng thái Chờ xác nhận (Pending)
        checkInStatus: "Chưa nhận phòng",
        checkOutStatus: "Chưa trả phòng"
      };

      const newBooking = await Booking.create(bookingPayload);

      res.status(201).json({
        success: true,
        message: "Đặt phòng thành công! Mã đơn của quý khách là " + newBooking.bookingCode + ". Đơn đang ở trạng thái Chờ xác nhận.",
        data: newBooking
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error.code === "ROOM_CONFLICT") {
        return res.status(409).json({ success: false, message: error.message });
      }
      if (error.status === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi xử lý đặt phòng: " + error.message });
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

      // Kiểm tra trạng thái hiện tại (Requirement 5)
      if (booking.status === "Đã xác nhận") {
        return res.status(400).json({
          success: false,
          message: `Đơn đặt phòng ${booking.bookingCode} đã được xác nhận trước đó.`
        });
      }

      if (booking.status === "Đã hủy") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng này đã bị hủy, không thể xác nhận."
        });
      }

      if (booking.status === "Đã nhận phòng" || booking.status === "Đã trả phòng") {
        return res.status(400).json({
          success: false,
          message: `Đơn đặt phòng đang ở trạng thái "${booking.status}", không thể xác nhận lại.`
        });
      }

      // Kiểm tra phòng tồn tại
      const room = await Room.getById(booking.roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Phòng của đơn đặt không tồn tại trong hệ thống."
        });
      }

      // Kiểm tra trùng lịch phòng + cập nhật trạng thái trong CÙNG MỘT transaction PostgreSQL
      // (Requirement 5: Không cho xác nhận trùng hoặc đặt phòng bị trùng lịch)
      // LƯU Ý (Requirement 6): Việc xác nhận đơn KHÔNG đồng nghĩa với xác nhận đã thanh toán -> GIỮ NGUYÊN paymentStatus
      const result = await Booking.confirm(req.params.id, {
        status: "Đã xác nhận",
        checkInStatus: "Chưa nhận phòng",
        checkOutStatus: "Chưa trả phòng",
        confirmedAt: new Date().toISOString(),
        confirmedBy: req.body.staffName || (userRole === "ADMIN" ? "Quản trị viên" : "Lễ tân")
      });

      if (result.notFound) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng để xác nhận" });
      }

      if (result.conflict) {
        const c = result.conflict;
        return res.status(400).json({
          success: false,
          message: `Không thể xác nhận: Phòng "${booking.roomName}" đã có đơn "${c.bookingCode}" (Khách: ${c.customerName}) đặt trùng lịch từ ${c.checkIn} đến ${c.checkOut}.`
        });
      }

      const updated = result.booking;

      // Cập nhật tình trạng phòng sang "Đã đặt" nếu phòng đang trống
      if (room.status === "Trống") {
        await Room.update(booking.roomId, { status: "Đã đặt" });
      }

      res.json({
        success: true,
        message: `Đã xác nhận đơn đặt phòng ${updated.bookingCode} thành công.`,
        data: updated
      });
    } catch (error) {
      console.error("Error confirming booking:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi xác nhận đơn đặt phòng: " + error.message });
    }
  },

  // PUT /api/bookings/:id/payment (Staff / Admin: Xác nhận thu tiền / thanh toán)
  async confirmPayment(req, res) {
    try {
      const userRole = (req.headers["x-user-role"] || "").toUpperCase();
      if (userRole && userRole !== "ADMIN" && userRole !== "STAFF") {
        return res.status(403).json({
          success: false,
          message: "Chỉ Quản trị viên (ADMIN) hoặc Lễ tân (STAFF) mới có quyền xác nhận thanh toán."
        });
      }

      const booking = await Booking.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng để cập nhật thanh toán" });
      }

      const updateData = {
        paymentStatus: "Đã thanh toán",
        paidAt: new Date().toISOString(),
        paymentConfirmedBy: req.body.staffName || (userRole === "ADMIN" ? "Quản trị viên" : "Lễ tân")
      };

      if (req.body.paymentMethod) {
        updateData.paymentMethod = req.body.paymentMethod;
      }

      const updated = await Booking.update(req.params.id, updateData);

      res.json({
        success: true,
        message: `Đã xác nhận thanh toán thành công cho đơn ${updated.bookingCode}.`,
        data: updated
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi xác nhận thanh toán: " + error.message });
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

      // 1. Kiểm tra quyền sở hữu (Chủ đơn hoặc Admin/Lễ tân)
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

      // 2. Kiểm tra trạng thái đơn: Chỉ cho phép hủy khi đang Chờ xác nhận
      if (booking.status === "Đã xác nhận" || booking.confirmedAt) {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng đã được Lễ tân xác nhận. Quý khách không thể tự hủy đơn này. Vui lòng liên hệ quầy Lễ tân."
        });
      }

      if (booking.status === "Đã nhận phòng" || booking.checkInStatus === "Đã nhận phòng") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng đã làm thủ tục nhận phòng, không thể hủy."
        });
      }

      if (booking.status === "Đã trả phòng" || booking.checkOutStatus === "Đã trả phòng") {
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

      if (booking.status !== "Chờ xác nhận") {
        return res.status(400).json({
          success: false,
          message: `Không thể hủy đơn đặt phòng đang ở trạng thái "${booking.status}". Chỉ cho phép hủy khi đơn ở trạng thái "Chờ xác nhận".`
        });
      }

      // 3. Cập nhật trạng thái đơn thành "Đã hủy"
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
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi hủy đơn đặt phòng: " + error.message });
    }
  },

  // PUT /api/bookings/:id/request-checkin (Customer - không đổi trạng thái sang 'Khách yêu cầu nhận phòng')
  async requestCheckIn(req, res) {
    try {
      const booking = await Booking.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
      }

      if (booking.status !== "Đã xác nhận") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể làm thủ tục nhận phòng cho đơn đã được Lễ tân xác nhận."
        });
      }

      if (booking.checkInStatus === "Đã nhận phòng") {
        return res.status(400).json({
          success: false,
          message: "Quý khách đã làm thủ tục nhận phòng trước đó."
        });
      }

      res.json({
        success: true,
        message: "Đơn đặt phòng đã được xác nhận. Quý khách vui lòng xuất trình mã đơn tại quầy Lễ tân khi đến nhận phòng.",
        data: booking
      });
    } catch (error) {
      console.error("Error in requestCheckIn:", error);
      res.status(500).json({ success: false, message: "Lỗi khi xử lý yêu cầu nhận phòng" });
    }
  },

  // PUT /api/bookings/:id/request-checkout (Customer)
  async requestCheckout(req, res) {
    try {
      const booking = await Booking.getById(req.params.id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt phòng" });
      }

      const isCheckedIn = booking.checkInStatus === "Đã nhận phòng" || booking.status === "Đã nhận phòng";
      if (!isCheckedIn) {
        return res.status(400).json({
          success: false,
          message: "Quý khách chưa hoàn tất thủ tục nhận phòng nên chưa thể gửi yêu cầu trả phòng."
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
      console.error("Error in requestCheckout:", error);
      res.status(500).json({ success: false, message: "Lỗi khi gửi yêu cầu trả phòng" });
    }
  },

  // PUT /api/bookings/:id/checkin (Staff / Admin làm thủ tục nhận phòng)
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

      // Requirement 7: Chỉ cho phép check-in khi đơn ĐÃ ĐƯỢC XÁC NHẬN
      if (booking.status === "Chờ xác nhận") {
        return res.status(400).json({
          success: false,
          message: "Đơn đặt phòng đang ở trạng thái 'Chờ xác nhận'. Vui lòng kiểm tra và duyệt xác nhận đơn trước khi làm thủ tục nhận phòng."
        });
      }

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

      // Phải ở trạng thái "Đã xác nhận"
      if (booking.status !== "Đã xác nhận") {
        return res.status(400).json({
          success: false,
          message: `Chỉ được thực hiện nhận phòng khi đơn đặt phòng đã được xác nhận (Trạng thái hiện tại: "${booking.status}").`
        });
      }

      // Requirement 7: Kiểm tra điều kiện ngày nhận phòng
      const todayStr = new Date().toISOString().split("T")[0];
      if (todayStr < booking.checkIn && !req.body.forceEarlyCheckIn) {
        return res.status(400).json({
          success: false,
          message: `Chưa đến ngày nhận phòng (${booking.checkIn}). Ngày hiện tại là ${todayStr}. Quý khách vui lòng làm thủ tục vào đúng ngày nhận phòng.`
        });
      }

      // Kiểm tra xem phòng có đang bị khách khác sử dụng chưa trả không
      const allBookings = await Booking.getAll();
      const currentOccupant = allBookings.find(b => 
        b.roomId === booking.roomId && 
        b.id !== booking.id && 
        b.bookingCode !== booking.bookingCode &&
        (b.status === "Đã nhận phòng" || b.checkInStatus === "Đã nhận phòng") &&
        b.status !== "Đã trả phòng"
      );

      if (currentOccupant) {
        return res.status(400).json({
          success: false,
          message: `Phòng ${booking.roomName} hiện đang có khách lưu trú (Đơn ${currentOccupant.bookingCode} - ${currentOccupant.customerName}). Vui lòng hoàn tất thủ tục trả phòng cho khách trước khi làm thủ tục nhận phòng mới.`
        });
      }

      // Cập nhật trạng thái đơn sang "Đã nhận phòng"
      const updated = await Booking.update(req.params.id, {
        status: "Đã nhận phòng",
        checkInStatus: "Đã nhận phòng",
        checkOutStatus: "Chưa trả phòng",
        actualCheckInTime: new Date().toISOString(),
        checkedInBy: req.body.staffName || (userRole === "ADMIN" ? "Quản trị viên" : "Lễ tân")
      });

      // Cập nhật trạng thái phòng sang "Đang sử dụng"
      if (booking.roomId) {
        await Room.update(booking.roomId, { status: "Đang sử dụng" });
      }

      res.json({
        success: true,
        message: `Thực hiện thủ tục nhận phòng thành công cho đơn ${updated.bookingCode}!`,
        data: updated
      });
    } catch (error) {
      console.error("Error in checkInBooking:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi xử lý nhận phòng: " + error.message });
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

      // Kiểm tra trạng thái thanh toán trước khi trả phòng (Requirement 6)
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
        checkedOutBy: req.body.staffName || (userRole === "ADMIN" ? "Quản trị viên" : "Lễ tân")
      });

      // Cập nhật phòng sang "Đang dọn dẹp"
      if (booking.roomId) {
        await Room.update(booking.roomId, { status: "Đang dọn dẹp" });
      }

      res.json({
        success: true,
        message: `Đã xác nhận trả phòng thành công cho đơn ${updated.bookingCode}. Phòng đã chuyển sang trạng thái Đang dọn dẹp.`,
        data: updated
      });
    } catch (error) {
      console.error("Error in checkOutBooking:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi xử lý trả phòng: " + error.message });
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
      console.error("Error updating booking:", error);
      if (error.code === "ROOM_CONFLICT") {
        return res.status(409).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi cập nhật đơn đặt phòng: " + error.message });
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
        message: "Đã xóa đơn đặt phòng thành công"
      });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi xóa đơn đặt phòng: " + error.message });
    }
  },

  // GET /api/stats (Dashboard statistics)
  async getDashboardStats(req, res) {
    try {
      const bookings = await Booking.getAll();
      const rooms = await Room.getAll();

      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => b.status === "Chờ xác nhận").length;
      const confirmedBookings = bookings.filter(b => b.status === "Đã xác nhận").length;
      const inUseBookings = bookings.filter(b => b.status === "Đã nhận phòng" || b.checkInStatus === "Đã nhận phòng").length;
      const completedBookings = bookings.filter(b => b.status === "Đã trả phòng").length;
      const cancelledBookings = bookings.filter(b => b.status === "Đã hủy").length;

      // Doanh thu chỉ tính các đơn đã thanh toán hoặc đã hoàn tất trả phòng
      const revenue = bookings
        .filter(b => b.paymentStatus === "Đã thanh toán" && b.status !== "Đã hủy")
        .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

      const totalRooms = rooms.length;
      const availableRooms = rooms.filter(r => r.status === "Trống").length;
      const bookedRooms = rooms.filter(r => r.status === "Đã đặt").length;
      const occupiedRooms = rooms.filter(r => r.status === "Đang sử dụng").length;
      const cleaningRooms = rooms.filter(r => r.status === "Đang dọn dẹp").length;

      res.json({
        success: true,
        data: {
          totalBookings,
          pendingBookings,
          confirmedBookings,
          inUseBookings,
          completedBookings,
          cancelledBookings,
          revenue,
          rooms: {
            total: totalRooms,
            available: availableRooms,
            booked: bookedRooms,
            occupied: occupiedRooms,
            cleaning: cleaningRooms
          }
        }
      });
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy thống kê" });
    }
  }
};
