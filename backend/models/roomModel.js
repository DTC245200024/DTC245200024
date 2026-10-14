const fs = require("fs").promises;
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/rooms.json");

async function readRooms() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading rooms data:", error);
    return [];
  }
}

async function writeRooms(rooms) {
  await fs.writeFile(DATA_FILE, JSON.stringify(rooms, null, 2), "utf-8");
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

module.exports = {
  // Lấy danh sách phòng có hỗ trợ bộ lọc
  async getAll(filters = {}) {
    let rooms = await readRooms();

    if (filters.type && filters.type !== "Tất cả" && filters.type !== "ALL") {
      const canonicalFilter = getCanonicalRoomType(filters.type);
      rooms = rooms.filter(r => {
        const raw = r.type || r.roomType || r.category || "";
        return getCanonicalRoomType(raw) === canonicalFilter;
      });
    }

    if (filters.status && filters.status !== "Tất cả" && filters.status !== "ALL") {
      rooms = rooms.filter(r => (r.status || "").toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.minPrice) {
      rooms = rooms.filter(r => r.price >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      rooms = rooms.filter(r => r.price <= Number(filters.maxPrice));
    }

    if (filters.guests) {
      rooms = rooms.filter(r => r.maxGuests >= Number(filters.guests));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      rooms = rooms.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.roomCode.toLowerCase().includes(q) || 
        r.type.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    return rooms;
  },

  async getById(id) {
    const rooms = await readRooms();
    return rooms.find(r => r.id === id || r.roomCode === id) || null;
  },

  async create(roomData) {
    const rooms = await readRooms();
    
    // Tự sinh mã phòng nếu chưa có
    const newId = roomData.id || roomData.roomCode || "RM-" + (100 + rooms.length + 1);
    
    const newRoom = {
      id: newId,
      roomCode: roomData.roomCode || newId,
      name: roomData.name || "Phòng nghỉ mới",
      type: roomData.type || "Phòng đơn",
      price: Number(roomData.price) || 500000,
      maxGuests: Number(roomData.maxGuests) || 2,
      status: roomData.status || "Trống",
      size: roomData.size || "30m²",
      bed: roomData.bed || "1 Giường đôi",
      view: roomData.view || "Hướng thành phố",
      image: roomData.image || "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80",
      description: roomData.description || "",
      amenities: Array.isArray(roomData.amenities) ? roomData.amenities : (roomData.amenities ? roomData.amenities.split(",").map(s => s.trim()) : ["Wifi miễn phí", "Điều hòa"])
    };

    rooms.push(newRoom);
    await writeRooms(rooms);
    return newRoom;
  },

  async update(id, updateData) {
    const rooms = await readRooms();
    const index = rooms.findIndex(r => r.id === id || r.roomCode === id);
    if (index === -1) return null;

    const updated = {
      ...rooms[index],
      ...updateData,
      id: rooms[index].id, // giữ nguyên ID
      price: updateData.price !== undefined ? Number(updateData.price) : rooms[index].price,
      maxGuests: updateData.maxGuests !== undefined ? Number(updateData.maxGuests) : rooms[index].maxGuests,
      amenities: Array.isArray(updateData.amenities) ? updateData.amenities : (typeof updateData.amenities === "string" ? updateData.amenities.split(",").map(s => s.trim()) : rooms[index].amenities)
    };

    rooms[index] = updated;
    await writeRooms(rooms);
    return updated;
  },

  async delete(id) {
    const rooms = await readRooms();
    const index = rooms.findIndex(r => r.id === id || r.roomCode === id);
    if (index === -1) return false;

    rooms.splice(index, 1);
    await writeRooms(rooms);
    return true;
  }
};
