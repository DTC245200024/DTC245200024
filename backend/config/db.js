const path = require("path");
const dotenv = require("dotenv");
const { Pool, types } = require("pg");

// Nạp các biến môi trường từ root .env hoặc backend .env (khi chạy ngoài Docker)
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

// DATE -> chuỗi "YYYY-MM-DD" (giữ nguyên định dạng mà frontend đang dùng)
types.setTypeParser(1082, (v) => v);
// BIGINT (giá tiền VND) và NUMERIC -> Number
types.setTypeParser(20, (v) => Number(v));
types.setTypeParser(1700, (v) => Number(v));

function buildConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "hotel_booking_db",
    user: process.env.APP_DB_USER || "hotel_app_user",
    // Không có mật khẩu mặc định trong mã nguồn: bắt buộc cấu hình qua biến môi trường.
    password: process.env.APP_DB_PASSWORD
  };
}

const config = buildConfig();
const pool = new Pool({
  ...config,
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000
});

pool.on("error", (err) => {
  console.error("⚠️ [PostgreSQL] Lỗi kết nối không mong đợi trong pool:", err.message);
});

function query(text, params) {
  return pool.query(text, params);
}

// Chạy một khối công việc trong transaction (tự COMMIT / ROLLBACK).
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Lỗi ROLLBACK:", rollbackErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
}

// Kết nối tới PostgreSQL, có thử lại (DB có thể khởi động chậm hơn backend).
async function connectDB({ retries = 10, delayMs = 3000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { rows } = await pool.query("SELECT current_database() AS db, version() AS version");
      console.log(`🐘 [PostgreSQL] Đã kết nối thành công tới database: "${rows[0].db}"`);
      return rows[0];
    } catch (err) {
      lastError = err;
      console.error(`❌ [PostgreSQL] Kết nối thất bại (lần ${attempt}/${retries}): ${err.message}`);
      if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

async function checkConnection() {
  try {
    const { rows } = await pool.query("SELECT current_database() AS db");
    return { connected: true, name: rows[0].db };
  } catch (err) {
    return { connected: false, name: process.env.DB_NAME || "hotel_booking_db" };
  }
}

async function closeDB() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  withTransaction,
  connectDB,
  checkConnection,
  closeDB
};
