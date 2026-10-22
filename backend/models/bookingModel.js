const { query, withTransaction } = require("../config/db");
const User = require("./userModel");

// Các trạng thái đơn đang "chiếm giữ" phòng (phải khớp với ràng buộc EXCLUDE trong schema)
const OCCUPYING_STATUSES = ["Đã xác nhận", "Đã nhận phòng", "Khách yêu cầu trả phòng"];

const SELECT_COLUMNS = `
  booking_code, user_id, customer_name, phone, email, room_id, room_code, room_name, room_type,
  check_in, check_out, nights, guests, room_price, total_price, payment_method, payment_status,
  status, check_in_status, check_out_status, special_requests, confirmed_at, confirmed_by,
  actual_check_in_time, checked_in_by, actual_check_out_time, checked_out_by, paid_at,
  payment_confirmed_by, cancelled_at, cancelled_by, cancel_reason, checkout_requested_at,
  checkout_requested_date, early_checkout_reason, created_at, updated_at`;

const iso = (v) => (v ? v.toISOString() : null);

// Chuyển hàng PostgreSQL sang đối tượng có cùng cấu trúc với API cũ
function mapBooking(row) {
  if (!row) return null;
  return {
    id: row.booking_code,
    bookingCode: row.booking_code,
    userId: row.user_id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    roomId: row.room_id || row.room_code,
    roomName: row.room_name,
    roomType: row.room_type,
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights: row.nights,
    guests: row.guests,
    roomPrice: row.room_price,
    totalPrice: row.total_price,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    checkInStatus: row.check_in_status,
    checkOutStatus: row.check_out_status,
    specialRequests: row.special_requests,
    confirmedAt: iso(row.confirmed_at),
    confirmedBy: row.confirmed_by,
    actualCheckInTime: iso(row.actual_check_in_time),
    checkedInBy: row.checked_in_by,
    actualCheckOutTime: iso(row.actual_check_out_time),
    checkedOutBy: row.checked_out_by,
    paidAt: iso(row.paid_at),
    paymentConfirmedBy: row.payment_confirmed_by,
    cancelledAt: iso(row.cancelled_at),
    cancelledBy: row.cancelled_by,
    cancelReason: row.cancel_reason,
    checkoutRequestedAt: iso(row.checkout_requested_at),
    checkoutRequestedDate: row.checkout_requested_date,
    earlyCheckoutReason: row.early_checkout_reason,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

// Chuẩn hóa giá trị ngày về dạng "YYYY-MM-DD"
function normalizeDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) {
    const err = new Error("Định dạng ngày không hợp lệ");
    err.status = 400;
    throw err;
  }
  return d.toISOString().slice(0, 10);
}

function diffNights(checkIn, checkOut) {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

function createConflictError(conflict, roomName) {
  const err = new Error(
    `Phòng "${roomName || "đã chọn"}" đã có đơn "${conflict.booking_code}" (Khách: ${conflict.customer_name}) ` +
      `đặt trùng lịch từ ${conflict.check_in} đến ${conflict.check_out}.`
  );
  err.code = "ROOM_CONFLICT";
  err.status = 409;
  err.conflict = {
    bookingCode: conflict.booking_code,
    customerName: conflict.customer_name,
    checkIn: conflict.check_in,
    checkOut: conflict.check_out
  };
  return err;
}

// Tìm đơn đang chiếm phòng có khoảng ngày giao với [checkIn, checkOut)
async function findConflict(db, roomId, checkIn, checkOut, excludeCode) {
  const { rows } = await db.query(
    `SELECT booking_code, customer_name, check_in, check_out
       FROM bookings
      WHERE room_id = $1
        AND booking_code <> COALESCE($4, '')
        AND status = ANY($5)
        AND $2::date < check_out
        AND $3::date > check_in
      LIMIT 1`,
    [roomId, checkIn, checkOut, excludeCode || null, OCCUPYING_STATUSES]
  );
  return rows[0] || null;
}

// Sinh mã đặt phòng duy nhất dạng BK-YYYY-XXXX (gọi trong transaction đã khóa advisory)
async function generateBookingCode(client) {
  const year = String(new Date().getFullYear());
  const { rows } = await client.query(
    `SELECT COALESCE(MAX((substring(booking_code FROM '^BK-[0-9]{4}-([0-9]+)$'))::bigint), 1000) AS max_number
       FROM bookings
      WHERE booking_code LIKE $1`,
    [`BK-${year}-%`]
  );
  return `BK-${year}-${Number(rows[0].max_number) + 1}`;
}

// Ánh xạ trường API -> cột DB cho thao tác cập nhật
const UPDATE_FIELDS = {
  userId: ["user_id", (v) => v],
  customerName: ["customer_name", (v) => String(v).trim()],
  phone: ["phone", (v) => String(v).trim()],
  email: ["email", (v) => String(v).trim()],
  roomName: ["room_name", (v) => v],
  roomType: ["room_type", (v) => v],
  checkIn: ["check_in", normalizeDate],
  checkOut: ["check_out", normalizeDate],
  nights: ["nights", (v) => Number(v)],
  guests: ["guests", (v) => Number(v)],
  roomPrice: ["room_price", (v) => Number(v)],
  totalPrice: ["total_price", (v) => Number(v)],
  paymentMethod: ["payment_method", (v) => v],
  paymentStatus: ["payment_status", (v) => v],
  status: ["status", (v) => v],
  checkInStatus: ["check_in_status", (v) => v],
  checkOutStatus: ["check_out_status", (v) => v],
  specialRequests: ["special_requests", (v) => v],
  confirmedAt: ["confirmed_at", (v) => v],
  confirmedBy: ["confirmed_by", (v) => v],
  actualCheckInTime: ["actual_check_in_time", (v) => v],
  checkedInBy: ["checked_in_by", (v) => v],
  actualCheckOutTime: ["actual_check_out_time", (v) => v],
  checkedOutBy: ["checked_out_by", (v) => v],
  paidAt: ["paid_at", (v) => v],
  paymentConfirmedBy: ["payment_confirmed_by", (v) => v],
  cancelledAt: ["cancelled_at", (v) => v],
  cancelledBy: ["cancelled_by", (v) => v],
  cancelReason: ["cancel_reason", (v) => v],
  checkoutRequestedAt: ["checkout_requested_at", (v) => v],
  checkoutRequestedDate: ["checkout_requested_date", normalizeDate],
  earlyCheckoutReason: ["early_checkout_reason", (v) => v]
};

async function runUpdate(db, id, updateData) {
  const sets = [];
  const values = [];

  for (const [key, [column, convert]] of Object.entries(UPDATE_FIELDS)) {
    if (updateData[key] === undefined) continue;
    const value = updateData[key] === null ? null : convert(updateData[key]);
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }

  // Đổi phòng: chỉ chấp nhận khi phòng tồn tại, đồng thời cập nhật bản chụp room_code
  if (updateData.roomId) {
    const { rows } = await db.query(
      "SELECT id, room_code FROM rooms WHERE id = $1 OR room_code = $1 ORDER BY (id = $1) DESC LIMIT 1",
      [String(updateData.roomId).trim()]
    );
    if (rows[0]) {
      values.push(rows[0].id);
      sets.push(`room_id = $${values.length}`);
      values.push(rows[0].room_code);
      sets.push(`room_code = $${values.length}`);
    }
  }

  sets.push("updated_at = now()");
  values.push(String(id).trim());

  try {
    const { rows } = await db.query(
      `UPDATE bookings SET ${sets.join(", ")}
        WHERE booking_code = $${values.length}
        RETURNING ${SELECT_COLUMNS}`,
      values
    );
    return mapBooking(rows[0]);
  } catch (err) {
    // 23P01 = exclusion_violation: DB chặn đơn trùng lịch phòng
    if (err.code === "23P01") {
      const conflictErr = new Error("Phòng đã có đơn khác đang giữ chỗ trùng khoảng thời gian này.");
      conflictErr.code = "ROOM_CONFLICT";
      conflictErr.status = 409;
      throw conflictErr;
    }
    throw err;
  }
}

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

module.exports = {
  OCCUPYING_STATUSES,

  // 1. Lấy danh sách đơn đặt phòng (có lọc)
  async getAll(filters = {}) {
    const where = [];
    const values = [];

    if (filters.userId) {
      values.push(String(filters.userId).trim());
      where.push(`user_id = $${values.length}`);
    }

    if (filters.status && filters.status !== "Tất cả" && filters.status !== "ALL") {
      const st = String(filters.status).trim();
      if (st.toLowerCase() === "pending") {
        where.push("status = 'Chờ xác nhận'");
      } else {
        values.push(st);
        where.push(`lower(status) = lower($${values.length})`);
      }
    }

    if (filters.search) {
      values.push(`%${escapeLike(String(filters.search).trim())}%`);
      const p = `$${values.length}`;
      where.push(
        `(booking_code ILIKE ${p} OR customer_name ILIKE ${p} OR phone ILIKE ${p} OR email ILIKE ${p} OR room_name ILIKE ${p})`
      );
    }

    const sql = `SELECT ${SELECT_COLUMNS} FROM bookings
                 ${where.length ? "WHERE " + where.join(" AND ") : ""}
                 ORDER BY created_at DESC, booking_code DESC`;
    const { rows } = await query(sql, values);
    return rows.map(mapBooking);
  },

  // 2. Tìm đơn theo mã đơn
  async getById(id) {
    if (!id) return null;
    const { rows } = await query(
      `SELECT ${SELECT_COLUMNS} FROM bookings WHERE booking_code = $1`,
      [String(id).trim()]
    );
    return mapBooking(rows[0]);
  },

  // 3. Tạo đơn đặt phòng mới trong transaction, khóa phòng để chống đặt trùng
  async create(bookingData) {
    const checkIn = normalizeDate(bookingData.checkIn);
    const checkOut = normalizeDate(bookingData.checkOut);
    if (!checkIn || !checkOut) {
      const err = new Error("Thiếu ngày nhận hoặc ngày trả phòng");
      err.status = 400;
      throw err;
    }

    const diffDays = diffNights(checkIn, checkOut);
    if (diffDays < 1) {
      const err = new Error("Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm");
      err.status = 400;
      throw err;
    }

    const nights = Number(bookingData.nights) >= 1 ? Number(bookingData.nights) : diffDays;
    const roomPrice = Number(bookingData.roomPrice) || 0;
    const totalPrice = bookingData.totalPrice ? Number(bookingData.totalPrice) : nights * roomPrice;

    // Xác định userId nếu có tài khoản liên kết
    let userId = bookingData.userId || null;
    if (userId) {
      const existing = await User.findById(userId);
      userId = existing ? existing.id : null;
    }
    if (!userId && (bookingData.email || bookingData.phone)) {
      try {
        const user = (await User.findByEmail(bookingData.email)) || (await User.findByPhone(bookingData.phone));
        if (user) userId = user.id;
      } catch (e) {
        console.error("Lỗi tìm kiếm user theo thông tin booking:", e.message);
      }
    }

    const paymentMethod = bookingData.paymentMethod || "cash";
    const paymentStatus =
      bookingData.paymentStatus ||
      (paymentMethod === "bank_transfer" ? "Chờ xác nhận chuyển khoản" : "Chưa thanh toán");

    return withTransaction(async (client) => {
      // Khóa dòng phòng: các đơn đặt cùng một phòng được xử lý tuần tự
      const roomRes = await client.query(
        `SELECT id, room_code, name, type FROM rooms
          WHERE id = $1 OR room_code = $1
          ORDER BY (id = $1) DESC LIMIT 1 FOR UPDATE`,
        [String(bookingData.roomId).trim()]
      );
      const room = roomRes.rows[0] || null;

      if (room) {
        const conflict = await findConflict(client, room.id, checkIn, checkOut, null);
        if (conflict) throw createConflictError(conflict, bookingData.roomName || room.name);
      }

      // Khóa advisory để sinh mã đơn tuần tự, không bao giờ trùng mã
      await client.query("SELECT pg_advisory_xact_lock(7001)");
      const code = await generateBookingCode(client);

      const { rows } = await client.query(
        `INSERT INTO bookings (
           booking_code, user_id, customer_name, phone, email, room_id, room_code, room_name, room_type,
           check_in, check_out, nights, guests, room_price, total_price, payment_method, payment_status,
           status, check_in_status, check_out_status, special_requests
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         RETURNING ${SELECT_COLUMNS}`,
        [
          code,
          userId,
          String(bookingData.customerName).trim(),
          String(bookingData.phone).trim(),
          String(bookingData.email).trim(),
          room ? room.id : null,
          room ? room.room_code : String(bookingData.roomId).trim(),
          bookingData.roomName || (room && room.name) || "Phòng khách sạn",
          bookingData.roomType || (room && room.type) || "Phòng tiêu chuẩn",
          checkIn,
          checkOut,
          nights,
          Number(bookingData.guests) || 1,
          roomPrice,
          totalPrice,
          paymentMethod,
          paymentStatus,
          bookingData.status || "Chờ xác nhận",
          bookingData.checkInStatus || "Chưa nhận phòng",
          bookingData.checkOutStatus || "Chưa trả phòng",
          bookingData.specialRequests || ""
        ]
      );

      const created = mapBooking(rows[0]);
      console.log(`✅ [PostgreSQL] Đã lưu đơn đặt phòng mới: ${created.bookingCode} (Khách: ${created.customerName})`);
      return created;
    });
  },

  // 4. Cập nhật thông tin đơn đặt phòng
  async update(id, updateData) {
    if (!id) return null;
    return runUpdate({ query }, id, updateData || {});
  },

  // 4b. Xác nhận đơn: kiểm tra trùng lịch + cập nhật trong CÙNG một transaction (có khóa phòng)
  // Trả về { notFound: true } | { conflict: {...} } | { booking }
  async confirm(id, updateData) {
    const code = String(id).trim();
    return withTransaction(async (client) => {
      const pre = await client.query("SELECT room_id FROM bookings WHERE booking_code = $1", [code]);
      if (!pre.rows[0]) return { notFound: true };

      const roomId = pre.rows[0].room_id;
      if (roomId) await client.query("SELECT 1 FROM rooms WHERE id = $1 FOR UPDATE", [roomId]);

      const cur = await client.query(
        "SELECT check_in, check_out, room_name FROM bookings WHERE booking_code = $1 FOR UPDATE",
        [code]
      );
      if (!cur.rows[0]) return { notFound: true };

      if (roomId) {
        const conflict = await findConflict(client, roomId, cur.rows[0].check_in, cur.rows[0].check_out, code);
        if (conflict) {
          return {
            conflict: {
              bookingCode: conflict.booking_code,
              customerName: conflict.customer_name,
              checkIn: conflict.check_in,
              checkOut: conflict.check_out
            }
          };
        }
      }

      const booking = await runUpdate(client, code, updateData);
      return { booking };
    });
  },

  // 5. Xóa đơn đặt phòng
  async delete(id) {
    if (!id) return false;
    const { rowCount } = await query("DELETE FROM bookings WHERE booking_code = $1", [String(id).trim()]);
    return rowCount > 0;
  }
};
