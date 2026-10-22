/**
 * Tạo tài khoản ADMIN THỦ CÔNG (không tự chạy khi khởi động hệ thống).
 *
 *   docker compose exec -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... backend node scripts/create-admin.js
 *
 * Hoặc dùng ADMIN_EMAIL / ADMIN_PASSWORD đã có trong môi trường container.
 * Nếu email đã tồn tại thì không làm gì (không ghi đè mật khẩu).
 */
const { query, closeDB } = require("../config/db");
const User = require("../models/userModel");

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !password) {
    throw new Error("Cần cấu hình ADMIN_EMAIL và ADMIN_PASSWORD (biến môi trường).");
  }

  const existing = await User.findByEmail(email);
  if (existing) {
    console.log(`ℹ️ Tài khoản ${email} đã tồn tại (vai trò ${existing.role}). Không có thay đổi.`);
    return;
  }

  const { rows } = await query("SELECT nextval('user_id_seq') AS n");
  const id = `USR-${rows[0].n}`;
  await query(
    `INSERT INTO users (id, name, email, phone, password_hash, role, status)
     VALUES ($1, 'Quản Trị Viên (System Admin)', lower(btrim($2)), $3, $4, 'ADMIN', 'active')`,
    [id, email, process.env.ADMIN_PHONE || "19006868", User.hashPassword(password)]
  );
  console.log(`✅ Đã tạo tài khoản ADMIN ${email} (id ${id}).`);
}

main()
  .catch((err) => {
    console.error("❌", err.message);
    process.exitCode = 1;
  })
  .finally(() => closeDB());
