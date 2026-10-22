/**
 * Smoke test API (đăng nhập, phòng, đặt phòng, xác nhận, hủy, chống đặt trùng, quản lý lễ tân).
 *
 *   BASE_URL=http://localhost:5001 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/smoke-test.js
 *
 * ⚠️ Script TẠO dữ liệu thử (khách hàng, đơn đặt phòng, phòng, lễ tân) và cố gắng dọn dẹp sau khi chạy.
 *    Chỉ chạy trên database thử nghiệm, KHÔNG chạy trên database sản xuất.
 */
const BASE = process.env.BASE_URL || "http://localhost:5001";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@grandpalace.vn";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

let passed = 0;
let failed = 0;
function check(cond, msg, extra) {
  if (cond) {
    passed++;
    console.log(`✅ ${msg}`);
  } else {
    failed++;
    console.error(`❌ ${msg}`, extra !== undefined ? JSON.stringify(extra) : "");
  }
}

async function api(method, path, body, headers = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {}
  return { status: res.status, body: json };
}

const ADMIN = { "x-user-role": "ADMIN" };
const suffix = Date.now().toString().slice(-8);

async function main() {
  console.log(`Smoke test tại ${BASE}`);

  // ---- Health & DB
  let r = await api("GET", "/api/health");
  check(r.status === 200 && r.body.database === "connected", "Health: backend kết nối PostgreSQL", r.body);

  // ---- Đăng nhập
  r = await api("POST", "/api/auth/login", { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  check(r.status === 200 && r.body.user && r.body.user.role === "ADMIN", "Đăng nhập ADMIN thành công", r.body);
  check(r.body && r.body.user && !("password" in r.body.user), "Phản hồi đăng nhập không lộ mật khẩu");
  r = await api("POST", "/api/auth/login", { identifier: ADMIN_EMAIL, password: "sai-mat-khau" });
  check(r.status === 401, "Đăng nhập sai mật khẩu bị từ chối (401)", r.status);
  r = await api("POST", "/api/auth/login", { identifier: ADMIN_EMAIL, password: "admin123" });
  check(r.status === 401 || ADMIN_PASSWORD === "admin123", "Mật khẩu cứng 'admin123' không còn được chấp nhận", r.status);

  // ---- Đăng ký / đăng nhập khách hàng
  const cust = { name: "Khách Thử Nghiệm", email: `smoke${suffix}@example.com`, phone: `09${suffix}`, password: "Smoke@12345" };
  r = await api("POST", "/api/auth/register", cust);
  check(r.status === 201 && /^USR-\d+$/.test(r.body.user.id), "Đăng ký khách hàng mới", r.body);
  const customerId = r.body.user && r.body.user.id;
  r = await api("POST", "/api/auth/register", cust);
  check(r.status === 400, "Đăng ký trùng email bị từ chối", r.status);
  r = await api("POST", "/api/auth/login", { identifier: cust.phone, password: cust.password });
  check(r.status === 200 && r.body.user.id === customerId, "Khách hàng đăng nhập bằng số điện thoại", r.body);
  const CUST = { "x-user-id": customerId, "x-user-role": "CUSTOMER" };

  // ---- Phòng
  r = await api("GET", "/api/rooms");
  check(r.status === 200 && r.body.data.length > 0, `Xem danh sách phòng (${r.body.data && r.body.data.length} phòng)`);
  const rooms = r.body.data;
  const roomA = rooms.find((x) => x.id === "P202") || rooms[0];
  const roomB = rooms.find((x) => x.id === "P301") || rooms[1];
  r = await api("GET", `/api/rooms/${roomA.id}`);
  check(r.status === 200 && r.body.data.id === roomA.id && Array.isArray(r.body.data.amenities), "Xem chi tiết phòng");
  r = await api("GET", "/api/rooms?type=VIP");
  check(r.status === 200 && r.body.data.every((x) => /vip/i.test(x.type)), "Lọc phòng theo loại");

  const mk = (room, ci, co, extra = {}) => ({
    customerName: cust.name,
    phone: cust.phone,
    email: cust.email,
    roomId: room.id,
    checkIn: ci,
    checkOut: co,
    guests: 1,
    paymentMethod: "cash",
    ...extra
  });
  const toDelete = [];

  // ---- Đặt phòng
  r = await api("POST", "/api/bookings", mk(roomA, "2030-01-10", "2030-01-12"), CUST);
  check(r.status === 201 && /^BK-\d{4}-\d+$/.test(r.body.data.bookingCode), "Đặt phòng thành công", r.body);
  const b1 = r.body.data;
  toDelete.push(b1.id);
  check(b1.nights === 2 && b1.totalPrice === 2 * roomA.price && b1.status === "Chờ xác nhận" && b1.userId === customerId,
    "Đơn: số đêm, tổng tiền, trạng thái, chủ đơn đúng", b1);
  r = await api("POST", "/api/bookings", mk(roomA, "2030-01-12", "2030-01-10"), CUST);
  check(r.status === 400, "Từ chối ngày trả trước ngày nhận", r.status);

  r = await api("GET", "/api/bookings", null, CUST);
  check(r.status === 200 && r.body.data.some((b) => b.id === b1.id) && r.body.data.every((b) => b.userId === customerId),
    "Khách chỉ xem được đơn của mình");

  // ---- Xác nhận + chống trùng
  r = await api("POST", "/api/bookings", mk(roomA, "2030-01-11", "2030-01-13"), CUST);
  check(r.status === 201, "Đơn thứ 2 trùng lịch vẫn được tạo ở trạng thái chờ xác nhận");
  const b2 = r.body.data;
  toDelete.push(b2.id);
  r = await api("PUT", `/api/bookings/${b1.id}/confirm`, {}, ADMIN);
  check(r.status === 200 && r.body.data.status === "Đã xác nhận", "Admin xác nhận đơn 1", r.body);
  r = await api("PUT", `/api/bookings/${b2.id}/confirm`, {}, ADMIN);
  check(r.status === 400 && /trùng lịch/.test(r.body.message), "Không cho xác nhận đơn trùng lịch với đơn đã xác nhận", r.body);
  r = await api("POST", "/api/bookings", mk(roomA, "2030-01-11", "2030-01-12"), CUST);
  check(r.status === 409, "Không cho tạo đơn mới trùng lịch với đơn đã xác nhận (409)", r.body);
  r = await api("POST", "/api/bookings", mk(roomA, "2030-01-12", "2030-01-14"), CUST);
  check(r.status === 201, "Đơn liền kề (nhận phòng đúng ngày trả của đơn trước) hợp lệ");
  toDelete.push(r.body.data.id);

  // ---- Đua xác nhận song song: chỉ 1 đơn được xác nhận
  const p1 = (await api("POST", "/api/bookings", mk(roomB, "2030-02-10", "2030-02-12"), CUST)).body.data;
  const p2 = (await api("POST", "/api/bookings", mk(roomB, "2030-02-11", "2030-02-13"), CUST)).body.data;
  toDelete.push(p1.id, p2.id);
  const [c1, c2] = await Promise.all([
    api("PUT", `/api/bookings/${p1.id}/confirm`, {}, ADMIN),
    api("PUT", `/api/bookings/${p2.id}/confirm`, {}, ADMIN)
  ]);
  check([c1.status, c2.status].sort().join() === "200,400", "Xác nhận đồng thời 2 đơn trùng lịch: đúng 1 đơn thành công", [c1.status, c2.status]);

  // ---- Hủy đơn
  r = await api("PUT", `/api/bookings/${b2.id}/cancel`, { reason: "test" }, CUST);
  check(r.status === 200 && r.body.data.status === "Đã hủy", "Khách hủy đơn đang chờ xác nhận", r.body);
  r = await api("PUT", `/api/bookings/${b1.id}/cancel`, {}, CUST);
  check(r.status === 400, "Khách không được hủy đơn đã xác nhận", r.status);
  r = await api("PUT", `/api/bookings/${b1.id}/cancel`, {}, { "x-user-id": "USR-0", "x-user-role": "CUSTOMER" });
  check(r.status === 403 || r.status === 400, "Người lạ không hủy được đơn của người khác", r.status);

  // ---- Nhận phòng / thanh toán / trả phòng
  r = await api("PUT", `/api/bookings/${b1.id}/checkin`, { forceEarlyCheckIn: true }, ADMIN);
  check(r.status === 200 && r.body.data.status === "Đã nhận phòng", "Nhận phòng", r.body);
  r = await api("PUT", `/api/bookings/${b1.id}/checkout`, {}, ADMIN);
  check(r.status === 400 && r.body.requiresPayment === true, "Chưa thanh toán thì không trả phòng được");
  r = await api("PUT", `/api/bookings/${b1.id}/payment`, {}, ADMIN);
  check(r.status === 200 && r.body.data.paymentStatus === "Đã thanh toán" && r.body.data.paidAt, "Xác nhận thanh toán", r.body);
  r = await api("PUT", `/api/bookings/${b1.id}/checkout`, {}, ADMIN);
  check(r.status === 200 && r.body.data.status === "Đã trả phòng", "Trả phòng", r.body);
  r = await api("GET", `/api/rooms/${roomA.id}`);
  check(r.body.data.status === "Đang dọn dẹp", "Phòng chuyển sang Đang dọn dẹp sau trả phòng", r.body.data.status);
  await api("PUT", `/api/rooms/${roomA.id}`, { status: roomA.status }, ADMIN);
  await api("PUT", `/api/rooms/${roomB.id}`, { status: roomB.status }, ADMIN);

  // ---- Thống kê
  r = await api("GET", "/api/stats");
  check(r.status === 200 && r.body.data.totalBookings >= 3, "API thống kê", r.body);

  // ---- Quản lý phòng
  r = await api("POST", "/api/rooms", { name: "Phòng Test", type: "Phòng đơn", price: 123000, maxGuests: 2, amenities: "Wifi, TV" }, ADMIN);
  check(r.status === 201 && /^RM-\d+$/.test(r.body.data.id), "Tạo phòng mới", r.body);
  const newRoom = r.body.data;
  r = await api("PUT", `/api/rooms/${newRoom.id}`, { price: 150000, status: "Đang bảo trì" }, ADMIN);
  check(r.status === 200 && r.body.data.price === 150000 && r.body.data.status === "Đang bảo trì", "Cập nhật phòng", r.body);
  r = await api("POST", "/api/bookings", mk(newRoom, "2030-03-01", "2030-03-02"), CUST);
  toDelete.push(r.body.data && r.body.data.id);
  r = await api("DELETE", `/api/rooms/${newRoom.id}`, null, ADMIN);
  check(r.status === 200, "Xóa phòng");
  r = await api("GET", `/api/bookings/${toDelete[toDelete.length - 1]}`);
  check(r.status === 200 && r.body.data.roomName === "Phòng Test", "Lịch sử đơn vẫn còn sau khi xóa phòng (room_id -> NULL, giữ tên phòng)", r.body);

  // ---- Lễ tân
  r = await api("POST", "/api/staff", { name: "Lễ Tân Thử", email: `staff${suffix}@example.com`, phone: `08${suffix}`, password: "Staff@12345" });
  check(r.status === 201 && /^STAFF-\d+$/.test(r.body.data.id), "Tạo tài khoản lễ tân", r.body);
  const staffId = r.body.data.id;
  r = await api("PUT", `/api/staff/${staffId}/status`);
  check(r.status === 200 && r.body.data.status === "locked", "Khóa tài khoản lễ tân", r.body);
  r = await api("POST", "/api/auth/login", { identifier: `staff${suffix}@example.com`, password: "Staff@12345" });
  check(r.status === 403, "Tài khoản bị khóa không đăng nhập được", r.status);
  r = await api("DELETE", `/api/staff/${staffId}`);
  check(r.status === 200, "Xóa tài khoản lễ tân");

  // ---- Hồ sơ
  r = await api("PUT", `/api/auth/profile/${customerId}`, { name: "Khách Đã Đổi Tên", phone: cust.phone });
  check(r.status === 200 && r.body.data.name === "Khách Đã Đổi Tên", "Cập nhật hồ sơ", r.body);

  // ---- Dọn dẹp dữ liệu thử
  for (const id of toDelete.filter(Boolean)) await api("DELETE", `/api/bookings/${id}`, null, ADMIN);

  console.log(`\nKết quả: ${passed} đạt, ${failed} lỗi`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
  console.error("Smoke test dừng do lỗi:", e);
  process.exitCode = 1;
});
