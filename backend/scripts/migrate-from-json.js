/**
 * Migration dữ liệu MongoDB (đã export ra JSON) -> PostgreSQL.
 *
 * Cách dùng (trong container backend hoặc local):
 *   node scripts/migrate-from-json.js <thư_mục_export> [--dry-run]
 *
 * Thư mục export chứa users.json, rooms.json, bookings.json (mongoexport --jsonArray).
 *  - Chạy trong MỘT transaction: lỗi ở bất kỳ bước nào => ROLLBACK, không để dữ liệu dở dang.
 *  - Idempotent: chạy lại nhiều lần không tạo bản ghi trùng.
 *  - --dry-run: chạy toàn bộ rồi ROLLBACK để chỉ xem báo cáo.
 *  - Không xóa/ghi đè bản ghi nào đã có trong PostgreSQL.
 *
 * Xử lý dữ liệu "bẩn" của hệ thống cũ (được ghi rõ trong báo cáo):
 *  - Hai tài khoản trùng id: tài khoản sau được cấp id mới từ sequence.
 *  - Đơn tham chiếu userId không tồn tại  -> user_id = NULL.
 *  - Đơn tham chiếu phòng không tồn tại   -> room_id = NULL, giữ mã phòng cũ ở room_code.
 */
const fs = require("fs");
const path = require("path");
const { withTransaction, closeDB } = require("../config/db");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dir = path.resolve(args.find((a) => !a.startsWith("--")) || path.join(__dirname, "../../migration/export"));

function readJson(name) {
  const file = path.join(dir, `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Không tìm thấy file ${file}`);
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (!Array.isArray(data)) throw new Error(`${file} phải là mảng JSON (mongoexport --jsonArray)`);
  return data;
}

const toTs = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};
const toDate = (v) => {
  if (!v) return null;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};
const numPart = (id, prefix) => {
  const m = String(id || "").match(new RegExp(`^${prefix}-(\\d+)$`));
  return m ? Number(m[1]) : 0;
};

async function main() {
  const users = readJson("users");
  const rooms = readJson("rooms");
  const bookings = readJson("bookings");

  const report = {
    exported: { users: users.length, rooms: rooms.length, bookings: bookings.length },
    inserted: { users: 0, rooms: 0, bookings: 0 },
    skippedExisting: { users: 0, rooms: 0, bookings: 0 },
    warnings: []
  };

  await withTransaction(async (client) => {
    // ---------------------------------------------------------------- USERS
    // Gom các user theo id gốc (có thể trùng id) để về sau gán đơn đúng chủ.
    const usersByOldId = new Map();
    const resolvedIdByUser = new Map(); // object user -> id sau migration

    const referencedUserNums = bookings.map((b) => numPart(b.userId, "USR"));
    let maxUserNum = Math.max(1000, ...users.map((u) => numPart(u.id, "USR")), ...referencedUserNums);
    let maxStaffNum = Math.max(100, ...users.map((u) => numPart(u.id, "STAFF")));
    const usedIds = new Set();

    for (const u of users) {
      const email = String(u.email || "").toLowerCase().trim();
      if (!email) {
        report.warnings.push(`Bỏ qua user id=${u.id}: thiếu email`);
        continue;
      }

      const existing = (await client.query("SELECT id FROM users WHERE email = $1", [email])).rows[0];
      if (existing) {
        resolvedIdByUser.set(u, existing.id);
        report.skippedExisting.users++;
      } else {
        let id = String(u.id);
        if (usedIds.has(id) || (await client.query("SELECT 1 FROM users WHERE id = $1", [id])).rowCount) {
          const isStaff = u.role === "STAFF";
          const newId = isStaff ? `STAFF-${++maxStaffNum}` : `USR-${++maxUserNum}`;
          report.warnings.push(`User ${email}: id "${id}" bị trùng với tài khoản khác -> cấp id mới "${newId}"`);
          id = newId;
        }
        await client.query(
          `INSERT INTO users (id, name, email, phone, password_hash, role, status, department, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, now()))`,
          [
            id,
            u.name,
            email,
            String(u.phone).trim(),
            u.password,
            u.role || "CUSTOMER",
            u.status || "active",
            u.department || "",
            toTs(u.createdAt)
          ]
        );
        resolvedIdByUser.set(u, id);
        report.inserted.users++;
      }
      usedIds.add(resolvedIdByUser.get(u));
      const key = String(u.id);
      if (!usersByOldId.has(key)) usersByOldId.set(key, []);
      usersByOldId.get(key).push(u);
    }

    // ---------------------------------------------------------------- ROOMS
    for (const r of rooms) {
      const id = String(r.id || r.roomCode);
      const maxGuests = Number(r.maxGuests) || Number(r.capacity) || 2;
      const res = await client.query(
        `INSERT INTO rooms (id, room_code, name, type, price, max_guests, capacity, status, floor,
                            size, bed, view_type, image, description, amenities)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT DO NOTHING`,
        [
          id,
          r.roomCode || id,
          r.name,
          r.type,
          Number(r.price) || 0,
          maxGuests,
          r.capacity ? Number(r.capacity) : null,
          r.status || "Trống",
          r.floor ? Number(r.floor) : 1,
          r.size || "30m²",
          r.bed || "1 Giường đôi",
          r.view || "Hướng phố",
          r.image || "",
          r.description || "",
          Array.isArray(r.amenities) ? r.amenities : []
        ]
      );
      if (res.rowCount) report.inserted.rooms++;
      else report.skippedExisting.rooms++;
      if (!r.floor) report.warnings.push(`Phòng ${id}: thiếu "floor" -> dùng mặc định 1`);
    }

    // ------------------------------------------------------------- BOOKINGS
    for (const b of bookings) {
      const code = String(b.bookingCode || b.id);

      // Xác định chủ đơn: ưu tiên user có đúng id; nếu id trùng nhiều tài khoản thì khớp theo email đơn.
      let userId = null;
      if (b.userId) {
        const candidates = usersByOldId.get(String(b.userId)) || [];
        if (candidates.length === 1) {
          userId = resolvedIdByUser.get(candidates[0]);
        } else if (candidates.length > 1) {
          const byEmail = candidates.find(
            (c) => String(c.email).toLowerCase() === String(b.email || "").toLowerCase()
          );
          userId = resolvedIdByUser.get(byEmail || candidates[0]);
        } else {
          report.warnings.push(`Đơn ${code}: userId "${b.userId}" không tồn tại -> user_id = NULL`);
        }
      }

      // Xác định phòng
      const roomRow = (
        await client.query("SELECT id, room_code FROM rooms WHERE id = $1 OR room_code = $1 LIMIT 1", [
          String(b.roomId)
        ])
      ).rows[0];
      if (!roomRow) {
        report.warnings.push(
          `Đơn ${code}: phòng "${b.roomId}" không tồn tại -> room_id = NULL (giữ room_code="${b.roomId}")`
        );
      }

      const checkIn = toDate(b.checkIn);
      const checkOut = toDate(b.checkOut);
      const nights =
        Number(b.nights) >= 1 ? Number(b.nights) : Math.max(1, Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000));

      const res = await client.query(
        `INSERT INTO bookings (
           booking_code, user_id, customer_name, phone, email, room_id, room_code, room_name, room_type,
           check_in, check_out, nights, guests, room_price, total_price, payment_method, payment_status,
           status, check_in_status, check_out_status, special_requests, confirmed_at, confirmed_by,
           actual_check_in_time, checked_in_by, actual_check_out_time, checked_out_by, paid_at,
           payment_confirmed_by, cancelled_at, cancelled_by, cancel_reason, checkout_requested_at,
           checkout_requested_date, early_checkout_reason, created_at, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,
           $26,$27,$28,$29,$30,$31,$32,$33,$34,$35,
           COALESCE($36::timestamptz, now()), COALESCE($37::timestamptz, $36::timestamptz, now())
         ) ON CONFLICT DO NOTHING`,
        [
          code,
          userId,
          b.customerName,
          b.phone,
          b.email,
          roomRow ? roomRow.id : null,
          roomRow ? roomRow.room_code : String(b.roomId),
          b.roomName || "Phòng khách sạn",
          b.roomType || "Phòng tiêu chuẩn",
          checkIn,
          checkOut,
          nights,
          Number(b.guests) || 1,
          Number(b.roomPrice) || 0,
          Number(b.totalPrice) || 0,
          b.paymentMethod || "cash",
          b.paymentStatus || "Chưa thanh toán",
          b.status || "Chờ xác nhận",
          b.checkInStatus || "Chưa nhận phòng",
          b.checkOutStatus || "Chưa trả phòng",
          b.specialRequests || "",
          toTs(b.confirmedAt),
          b.confirmedBy || null,
          toTs(b.actualCheckInTime),
          b.checkedInBy || null,
          toTs(b.actualCheckOutTime),
          b.checkedOutBy || null,
          toTs(b.paidAt),
          b.paymentConfirmedBy || null,
          toTs(b.cancelledAt),
          b.cancelledBy || null,
          b.cancelReason || null,
          toTs(b.checkoutRequestedAt),
          toDate(b.checkoutRequestedDate),
          b.earlyCheckoutReason || null,
          toTs(b.createdAt),
          toTs(b.updatedAt)
        ]
      );
      if (res.rowCount) report.inserted.bookings++;
      else report.skippedExisting.bookings++;
    }

    // ------------------------------------------------------------ SEQUENCES
    // Đưa sequence lên sau giá trị lớn nhất đang dùng để mã mới không bao giờ trùng mã cũ.
    const maxOf = async (prefix, table) => {
      const { rows } = await client.query(
        `SELECT COALESCE(MAX((substring(id FROM '^${prefix}-([0-9]+)$'))::bigint), 0) AS m FROM ${table}`
      );
      return Number(rows[0].m);
    };
    await client.query("SELECT setval('user_id_seq', $1, true)", [Math.max(1000, await maxOf("USR", "users"))]);
    await client.query("SELECT setval('staff_id_seq', $1, true)", [Math.max(100, await maxOf("STAFF", "users"))]);
    await client.query("SELECT setval('room_id_seq', $1, true)", [Math.max(100, await maxOf("RM", "rooms"))]);

    // --------------------------------------------------------- VERIFICATION
    const count = async (t) => Number((await client.query(`SELECT COUNT(*) AS c FROM ${t}`)).rows[0].c);
    report.postgres = { users: await count("users"), rooms: await count("rooms"), bookings: await count("bookings") };

    const totals = (
      await client.query(
        `SELECT COALESCE(SUM(total_price),0)::bigint AS revenue FROM bookings
          WHERE payment_status = 'Đã thanh toán' AND status <> 'Đã hủy'`
      )
    ).rows[0];
    report.postgres.revenuePaid = Number(totals.revenue);
    report.exported.revenuePaid = bookings
      .filter((b) => b.paymentStatus === "Đã thanh toán" && b.status !== "Đã hủy")
      .reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);

    if (dryRun) {
      const err = new Error("DRY_RUN");
      err.dryRun = true;
      throw err;
    }
  }).catch((err) => {
    if (!err.dryRun) throw err;
    console.log("🔍 --dry-run: đã ROLLBACK, không có thay đổi nào được ghi.");
  });

  console.log(JSON.stringify(report, null, 2));

  const ok =
    report.postgres.users >= report.exported.users - report.warnings.filter((w) => w.startsWith("Bỏ qua user")).length &&
    report.postgres.rooms >= report.exported.rooms &&
    report.postgres.bookings >= report.exported.bookings &&
    report.postgres.revenuePaid === report.exported.revenuePaid;
  console.log(ok ? "✅ Đối chiếu: số lượng bản ghi và doanh thu KHỚP với dữ liệu nguồn." : "❌ Đối chiếu KHÔNG khớp, hãy kiểm tra báo cáo ở trên.");
  process.exitCode = ok ? 0 : 2;
}

main()
  .catch((err) => {
    console.error("❌ Migration thất bại (đã ROLLBACK):", err.message);
    process.exitCode = 1;
  })
  .finally(() => closeDB());
