const mongoose = require("mongoose");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { connectDB } = require("../config/db");

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "rooms.json");

const roomSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    roomCode: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    maxGuests: { type: Number, default: 2 },
    capacity: { type: Number, default: 2 },
    status: { type: String, default: "Trống" },
    floor: { type: Number, default: 1 },
    size: { type: String, default: "30m²" },
    bed: { type: String, default: "1 Giường đôi" },
    view: { type: String, default: "Hướng phố" },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    amenities: { type: [String], default: [] }
  },
  {
    collection: "rooms",
    timestamps: false,
    versionKey: false
  }
);

const RoomDoc = mongoose.models.Room || mongoose.model("Room", roomSchema);

async function readRoomsFromFile() {
  try {
    if (fsSync.existsSync(DATA_FILE)) {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Lỗi đọc backup rooms.json:", error.message);
  }
  return [];
}

async function writeRoomsToFile(rooms) {
  try {
    if (!fsSync.existsSync(DATA_DIR)) {
      fsSync.mkdirSync(DATA_DIR, { recursive: true });
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(rooms, null, 2), "utf-8");
  } catch (error) {
    console.error("Lỗi ghi backup rooms.json:", error.message);
  }
}

// Đồng bộ ban đầu nếu MongoDB chưa có rooms
async function syncInitialRooms() {
  try {
    await connectDB();
    const count = await RoomDoc.countDocuments();
    if (count === 0) {
      const fileRooms = await readRoomsFromFile();
      if (fileRooms.length > 0) {
        await RoomDoc.insertMany(fileRooms);
        console.log(`🍃 [MongoDB] Đã nạp ${fileRooms.length} phòng ban đầu vào MongoDB.`);
      }
    }
  } catch (e) {
    console.error("Lỗi đồng bộ rooms vào MongoDB:", e.message);
  }
}
syncInitialRooms().catch(e => console.error(e));

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
  RoomDoc,

  // Lấy danh sách phòng có hỗ trợ bộ lọc
  async getAll(filters = {}) {
    let rooms = [];
    try {
      await connectDB();
      rooms = await RoomDoc.find().lean();
      if (!rooms || rooms.length === 0) {
        rooms = await readRoomsFromFile();
      }
    } catch (e) {
      console.warn("MongoDB không khả dụng khi lấy rooms, dùng file:", e.message);
      rooms = await readRoomsFromFile();
    }

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
      rooms = rooms.filter(r => (r.maxGuests || r.capacity || 2) >= Number(filters.guests));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      rooms = rooms.filter(r => 
        (r.name && r.name.toLowerCase().includes(q)) || 
        (r.roomCode && r.roomCode.toLowerCase().includes(q)) || 
        (r.type && r.type.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    return rooms.map(r => ({ ...r, id: r.id || r.roomCode }));
  },

  async getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    try {
      await connectDB();
      const doc = await RoomDoc.findOne({
        $or: [{ id: cleanId }, { roomCode: cleanId }]
      }).lean();
      if (doc) return { ...doc, id: doc.id || doc.roomCode };
    } catch (e) {
      console.warn("Lỗi MongoDB khi getById room, dùng file:", e.message);
    }

    const rooms = await readRoomsFromFile();
    return rooms.find(r => r.id === cleanId || r.roomCode === cleanId) || null;
  },

  async create(roomData) {
    await connectDB();
    let existingRooms = [];
    try {
      existingRooms = await RoomDoc.find().lean();
    } catch (e) {
      existingRooms = await readRoomsFromFile();
    }

    const newId = roomData.id || roomData.roomCode || "RM-" + (100 + existingRooms.length + 1);

    const newRoom = {
      id: newId,
      roomCode: roomData.roomCode || newId,
      name: roomData.name || "Phòng nghỉ mới",
      type: roomData.type || "Phòng đơn",
      price: Number(roomData.price) || 500000,
      maxGuests: Number(roomData.maxGuests) || 2,
      capacity: Number(roomData.maxGuests) || 2,
      status: roomData.status || "Trống",
      floor: Number(roomData.floor) || 1,
      size: roomData.size || "30m²",
      bed: roomData.bed || "1 Giường đôi",
      view: roomData.view || "Hướng thành phố",
      image: roomData.image || "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80",
      description: roomData.description || "",
      amenities: Array.isArray(roomData.amenities) 
        ? roomData.amenities 
        : (roomData.amenities ? roomData.amenities.split(",").map(s => s.trim()) : ["Wifi miễn phí", "Điều hòa"])
    };

    try {
      const created = await RoomDoc.create(newRoom);
      const resObj = created.toObject ? created.toObject() : created;
      readRoomsFromFile().then(async list => {
        list.push(resObj);
        await writeRoomsToFile(list);
      });
      return resObj;
    } catch (e) {
      console.error("Lỗi MongoDB khi tạo room:", e.message);
      throw e;
    }
  },

  async update(id, updateData) {
    if (!id) return null;
    const cleanId = String(id).trim();
    await connectDB();

    const safeUpdate = { ...updateData };
    delete safeUpdate._id;
    delete safeUpdate.id;
    if (safeUpdate.price !== undefined) safeUpdate.price = Number(safeUpdate.price);
    if (safeUpdate.maxGuests !== undefined) safeUpdate.maxGuests = Number(safeUpdate.maxGuests);

    try {
      const updated = await RoomDoc.findOneAndUpdate(
        { $or: [{ id: cleanId }, { roomCode: cleanId }] },
        { $set: safeUpdate },
        { new: true }
      ).lean();

      if (updated) {
        readRoomsFromFile().then(async list => {
          const idx = list.findIndex(r => r.id === cleanId || r.roomCode === cleanId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updated };
            await writeRoomsToFile(list);
          }
        });
        return { ...updated, id: updated.id || updated.roomCode };
      }
    } catch (e) {
      console.error("Lỗi MongoDB khi update room:", e.message);
    }

    return null;
  },

  async delete(id) {
    if (!id) return false;
    const cleanId = String(id).trim();
    await connectDB();

    try {
      const res = await RoomDoc.findOneAndDelete({
        $or: [{ id: cleanId }, { roomCode: cleanId }]
      });
      if (res) {
        readRoomsFromFile().then(async list => {
          const filtered = list.filter(r => r.id !== cleanId && r.roomCode !== cleanId);
          await writeRoomsToFile(filtered);
        });
        return true;
      }
    } catch (e) {
      console.error("Lỗi MongoDB khi delete room:", e.message);
    }

    return false;
  }
};
