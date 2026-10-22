const { query } = require("../config/db");

const COLUMNS =
  "id, room_code, name, type, price, max_guests, capacity, status, floor, size, bed, view_type, image, description, amenities";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80";

// Chuyển hàng PostgreSQL sang đối tượng có cùng cấu trúc với API cũ
function mapRoom(row) {
  if (!row) return null;
  return {
    id: row.id,
    roomCode: row.room_code,
    name: row.name,
    type: row.type,
    price: row.price,
    maxGuests: row.max_guests,
    capacity: row.capacity === null ? row.max_guests : row.capacity,
    status: row.status,
    floor: row.floor,
    size: row.size,
    bed: row.bed,
    view: row.view_type,
    image: row.image,
    description: row.description,
    amenities: row.amenities || []
  };
}

function getCanonicalRoomType(rawType) {
  if (!rawType) return "";
  const s = String(rawType)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (s === "all" || s === "tat ca" || s === "tat ca loai phong") return "ALL";
  if (s.includes("deluxe") || s === "dlx") return "DELUXE";
  if (s.includes("vip") || s.includes("suite")) return "VIP";
  if (s.includes("doi") || s.includes("double") || s.includes("twin")) return "DOUBLE";
  if (s.includes("don") || s.includes("single")) return "SINGLE";

  return s.toUpperCase();
}

function parseAmenities(value, fallback) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) return value.split(",").map((s) => s.trim()).filter(Boolean);
  return fallback;
}

module.exports = {
  // Lấy danh sách phòng có hỗ trợ bộ lọc
  async getAll(filters = {}) {
    const { rows } = await query(`SELECT ${COLUMNS} FROM rooms ORDER BY seq`);
    let rooms = rows.map(mapRoom);

    if (filters.type && filters.type !== "Tất cả" && filters.type !== "ALL") {
      const canonicalFilter = getCanonicalRoomType(filters.type);
      rooms = rooms.filter((r) => getCanonicalRoomType(r.type) === canonicalFilter);
    }

    if (filters.status && filters.status !== "Tất cả" && filters.status !== "ALL") {
      rooms = rooms.filter((r) => (r.status || "").toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.minPrice) {
      rooms = rooms.filter((r) => r.price >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      rooms = rooms.filter((r) => r.price <= Number(filters.maxPrice));
    }

    if (filters.guests) {
      rooms = rooms.filter((r) => (r.maxGuests || r.capacity || 2) >= Number(filters.guests));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      rooms = rooms.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.roomCode && r.roomCode.toLowerCase().includes(q)) ||
          (r.type && r.type.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    return rooms;
  },

  async count() {
    const { rows } = await query("SELECT COUNT(*)::int AS count FROM rooms");
    return rows[0].count;
  },

  async getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM rooms 
        WHERE id = $1 
           OR room_code = $1 
           OR lower(id) = lower($1) 
           OR lower(room_code) = lower($1) 
        ORDER BY (id = $1) DESC LIMIT 1`,
      [cleanId]
    );
    if (rows[0]) return mapRoom(rows[0]);

    // Fallback: Tìm theo tên nếu id truyền vào là tên phòng
    const { rows: nameRows } = await query(
      `SELECT ${COLUMNS} FROM rooms WHERE lower(name) = lower($1) OR name ILIKE $1 LIMIT 1`,
      [cleanId]
    );
    return mapRoom(nameRows[0]);
  },

  async getByName(name) {
    if (!name) return null;
    const cleanName = String(name).trim();
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM rooms WHERE lower(name) = lower($1) OR name ILIKE $1 LIMIT 1`,
      [cleanName]
    );
    return mapRoom(rows[0]);
  },

  async create(roomData) {
    let newId = roomData.id || roomData.roomCode;
    if (!newId) {
      const { rows } = await query("SELECT nextval('room_id_seq') AS n");
      newId = `RM-${rows[0].n}`;
    }

    const maxGuests = Number(roomData.maxGuests) || 2;
    const { rows } = await query(
      `INSERT INTO rooms (id, room_code, name, type, price, max_guests, capacity, status, floor,
                          size, bed, view_type, image, description, amenities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING ${COLUMNS}`,
      [
        newId,
        roomData.roomCode || newId,
        roomData.name || "Phòng nghỉ mới",
        roomData.type || "Phòng đơn",
        Number(roomData.price) || 500000,
        maxGuests,
        maxGuests,
        roomData.status || "Trống",
        Number(roomData.floor) || 1,
        roomData.size || "30m²",
        roomData.bed || "1 Giường đôi",
        roomData.view || "Hướng thành phố",
        roomData.image || DEFAULT_IMAGE,
        roomData.description || "",
        parseAmenities(roomData.amenities, ["Wifi miễn phí", "Điều hòa"])
      ]
    );
    return mapRoom(rows[0]);
  },

  async update(id, updateData) {
    if (!id) return null;

    const fieldMap = {
      roomCode: ["room_code", (v) => String(v)],
      name: ["name", (v) => String(v)],
      type: ["type", (v) => String(v)],
      price: ["price", (v) => Number(v)],
      maxGuests: ["max_guests", (v) => Number(v)],
      capacity: ["capacity", (v) => Number(v)],
      status: ["status", (v) => String(v)],
      floor: ["floor", (v) => Number(v)],
      size: ["size", (v) => String(v)],
      bed: ["bed", (v) => String(v)],
      view: ["view_type", (v) => String(v)],
      image: ["image", (v) => String(v)],
      description: ["description", (v) => String(v)],
      amenities: ["amenities", (v) => parseAmenities(v, [])]
    };

    const sets = [];
    const values = [];
    for (const [key, [column, convert]] of Object.entries(fieldMap)) {
      if (updateData[key] === undefined || updateData[key] === null) continue;
      values.push(convert(updateData[key]));
      sets.push(`${column} = $${values.length}`);
    }

    if (sets.length === 0) {
      return this.getById(id);
    }

    values.push(String(id).trim());
    const { rows } = await query(
      `UPDATE rooms SET ${sets.join(", ")}
        WHERE id = $${values.length} OR room_code = $${values.length}
        RETURNING ${COLUMNS}`,
      values
    );
    return mapRoom(rows[0]);
  },

  async delete(id) {
    if (!id) return false;
    // Các đơn đặt phòng cũ vẫn được giữ lại (bookings.room_id -> NULL, giữ nguyên room_code/room_name)
    const { rowCount } = await query("DELETE FROM rooms WHERE id = $1 OR room_code = $1", [String(id).trim()]);
    return rowCount > 0;
  }
};
