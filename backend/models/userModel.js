const bcrypt = require("bcryptjs");
const { query } = require("../config/db");

function isBcryptHash(str) {
  return typeof str === "string" && (str.startsWith("$2a$") || str.startsWith("$2b$") || str.startsWith("$2y$"));
}

function hashPassword(plainText) {
  if (!plainText) return plainText;
  if (isBcryptHash(plainText)) return plainText;
  return bcrypt.hashSync(plainText, 10);
}

function comparePassword(plainText, hashed) {
  if (!plainText || !hashed) return false;
  if (isBcryptHash(hashed)) {
    return bcrypt.compareSync(plainText, hashed);
  }
  return plainText === hashed;
}

const COLUMNS = "id, name, email, phone, password_hash, role, status, department, created_at";

// Chuyển hàng PostgreSQL sang đối tượng có cùng cấu trúc với API cũ
function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    password: row.password_hash,
    role: row.role,
    status: row.status,
    department: row.department,
    createdAt: row.created_at ? row.created_at.toISOString() : null
  };
}

async function nextId(sequence, prefix) {
  const { rows } = await query(`SELECT nextval('${sequence}') AS n`);
  return `${prefix}-${rows[0].n}`;
}

module.exports = {
  async getAll() {
    const { rows } = await query(`SELECT ${COLUMNS} FROM users ORDER BY created_at, id`);
    return rows.map(mapUser);
  },

  async findByEmail(email) {
    if (!email) return null;
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM users WHERE email = lower(btrim($1))`,
      [String(email)]
    );
    return mapUser(rows[0]);
  },

  async findByPhone(phone) {
    if (!phone) return null;
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM users WHERE phone = btrim($1)`,
      [String(phone)]
    );
    return mapUser(rows[0]);
  },

  async findById(id) {
    if (!id) return null;
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM users WHERE id = btrim($1)`,
      [String(id)]
    );
    return mapUser(rows[0]);
  },

  async create(userData) {
    const id = await nextId("user_id_seq", "USR");
    const { rows } = await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, status)
       VALUES ($1, $2, lower(btrim($3)), btrim($4), $5, 'CUSTOMER', 'active')
       RETURNING ${COLUMNS}`,
      [id, String(userData.name).trim(), userData.email, userData.phone, hashPassword(userData.password)]
    );
    return mapUser(rows[0]);
  },

  async createStaff(staffData) {
    const id = await nextId("staff_id_seq", "STAFF");
    const { rows } = await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, status, department)
       VALUES ($1, $2, lower(btrim($3)), btrim($4), $5, 'STAFF', 'active', $6)
       RETURNING ${COLUMNS}`,
      [
        id,
        String(staffData.name).trim(),
        staffData.email,
        staffData.phone,
        hashPassword(staffData.password || "Staff@123"),
        staffData.department || "Lễ tân & Dịch vụ"
      ]
    );
    return mapUser(rows[0]);
  },

  async toggleStaffStatus(id) {
    const { rows } = await query(
      `UPDATE users
          SET status = CASE WHEN status = 'active' THEN 'locked' ELSE 'active' END
        WHERE id = btrim($1) AND role = 'STAFF'
        RETURNING ${COLUMNS}`,
      [String(id)]
    );
    return mapUser(rows[0]);
  },

  async deleteStaff(id) {
    const { rowCount } = await query(
      `DELETE FROM users WHERE id = btrim($1) AND role = 'STAFF'`,
      [String(id)]
    );
    return rowCount > 0;
  },

  // Cập nhật các trường được phép; không bao giờ cho đổi id / role.
  async update(id, updateData) {
    const fieldMap = {
      name: (v) => String(v).trim(),
      email: (v) => String(v).toLowerCase().trim(),
      phone: (v) => String(v).trim(),
      password: (v) => ["password_hash", hashPassword(v)],
      status: (v) => v,
      department: (v) => v
    };

    const sets = [];
    const values = [];
    for (const [key, convert] of Object.entries(fieldMap)) {
      if (updateData[key] === undefined || updateData[key] === null || updateData[key] === "") continue;
      let column = key;
      let value = convert(updateData[key]);
      if (Array.isArray(value)) [column, value] = value;
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    values.push(String(id));
    const { rows } = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = btrim($${values.length}) RETURNING ${COLUMNS}`,
      values
    );
    return mapUser(rows[0]);
  },

  // Export các hàm tiện ích bảo mật mật khẩu
  hashPassword,
  comparePassword,
  isBcryptHash
};
