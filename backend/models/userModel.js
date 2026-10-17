const mongoose = require("mongoose");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/db");

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

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

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "STAFF", "CUSTOMER"], default: "CUSTOMER" },
    status: { type: String, default: "active" },
    department: { type: String, default: "" },
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    collection: "users",
    timestamps: false,
    versionKey: false
  }
);

const UserDoc = mongoose.models.User || mongoose.model("User", userSchema);

function getDefaultUsers() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@grandpalace.vn";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  return [
    {
      id: "USR-1000",
      name: "Quản Trị Viên (System Admin)",
      email: adminEmail.toLowerCase().trim(),
      phone: "19006868",
      password: adminPassword,
      role: "ADMIN",
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: "STAFF-104",
      name: "nguyen thi ngan",
      email: "ngan@gmail.com",
      phone: "123456789",
      password: "123456",
      role: "STAFF",
      status: "active",
      department: "Lễ tân",
      createdAt: new Date().toISOString()
    },
    {
      id: "USR-1005",
      name: "Nguyễn Thị Vịt",
      email: "vit@gmail.com",
      phone: "123456097",
      password: "123456",
      role: "CUSTOMER",
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: "USR-1004",
      name: "nguyen van a",
      email: "khachhang@gmail.com",
      phone: "0124567678",
      password: "password123",
      role: "CUSTOMER",
      status: "active",
      createdAt: new Date().toISOString()
    }
  ];
}

async function readUsersFromFile() {
  try {
    if (fsSync.existsSync(DATA_FILE)) {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (error) {
    console.error("Lỗi đọc backup users.json:", error.message);
  }
  return getDefaultUsers();
}

async function writeUsersToFile(users) {
  try {
    if (!fsSync.existsSync(DATA_DIR)) {
      fsSync.mkdirSync(DATA_DIR, { recursive: true });
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Lỗi ghi backup users.json:", error.message);
  }
}

// Đồng bộ ban đầu nếu MongoDB chưa có users
async function syncInitialUsers() {
  try {
    await connectDB();
    const count = await UserDoc.countDocuments();
    if (count === 0) {
      const fileUsers = await readUsersFromFile();
      if (fileUsers.length > 0) {
        await UserDoc.insertMany(fileUsers);
        console.log(`🍃 [MongoDB] Đã nạp ${fileUsers.length} tài khoản người dùng ban đầu vào MongoDB.`);
      }
    }
  } catch (e) {
    console.error("Lỗi đồng bộ users vào MongoDB:", e.message);
  }
}
syncInitialUsers().catch(e => console.error(e));

module.exports = {
  UserDoc,

  async getAll() {
    try {
      await connectDB();
      const users = await UserDoc.find().lean();
      if (users && users.length > 0) return users.map(u => ({ ...u, id: u.id || String(u._id) }));
    } catch (e) {
      console.warn("MongoDB không khả dụng khi getAll users, dùng file:", e.message);
    }
    return await readUsersFromFile();
  },

  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    try {
      await connectDB();
      const doc = await UserDoc.findOne({ email: new RegExp(`^${cleanEmail}$`, "i") }).lean();
      if (doc) return { ...doc, id: doc.id || String(doc._id) };
    } catch (e) {
      console.warn("MongoDB không khả dụng khi findByEmail, dùng file:", e.message);
    }
    const users = await readUsersFromFile();
    return users.find(u => u.email && u.email.toLowerCase() === cleanEmail) || null;
  },

  async findByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = phone.trim();
    try {
      await connectDB();
      const doc = await UserDoc.findOne({ phone: cleanPhone }).lean();
      if (doc) return { ...doc, id: doc.id || String(doc._id) };
    } catch (e) {
      console.warn("MongoDB không khả dụng khi findByPhone, dùng file:", e.message);
    }
    const users = await readUsersFromFile();
    return users.find(u => u.phone === cleanPhone) || null;
  },

  async findById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    try {
      await connectDB();
      const doc = await UserDoc.findOne({ id: cleanId }).lean();
      if (doc) return { ...doc, id: doc.id || String(doc._id) };
    } catch (e) {
      console.warn("MongoDB không khả dụng khi findById, dùng file:", e.message);
    }
    const users = await readUsersFromFile();
    return users.find(u => u.id === cleanId) || null;
  },

  async create(userData) {
    await connectDB();
    let existingUsers = [];
    try {
      existingUsers = await UserDoc.find().lean();
    } catch (e) {
      existingUsers = await readUsersFromFile();
    }

    const newId = "USR-" + (1000 + existingUsers.length + 1);
    const newUser = {
      id: newId,
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone.trim(),
      password: hashPassword(userData.password),
      role: "CUSTOMER",
      status: "active",
      createdAt: new Date().toISOString()
    };

    try {
      const created = await UserDoc.create(newUser);
      const resObj = created.toObject ? created.toObject() : created;
      readUsersFromFile().then(async list => {
        list.push(resObj);
        await writeUsersToFile(list);
      });
      return resObj;
    } catch (e) {
      console.error("Lỗi MongoDB khi tạo user:", e.message);
      throw e;
    }
  },

  async createStaff(staffData) {
    await connectDB();
    let staffCount = 0;
    try {
      staffCount = await UserDoc.countDocuments({ role: "STAFF" });
    } catch (e) {
      const users = await readUsersFromFile();
      staffCount = users.filter(u => u.role === "STAFF").length;
    }

    const newId = "STAFF-" + (100 + staffCount + 1);
    const newStaff = {
      id: newId,
      name: staffData.name.trim(),
      email: staffData.email.toLowerCase().trim(),
      phone: staffData.phone.trim(),
      password: hashPassword(staffData.password || "Staff@123"),
      role: "STAFF",
      status: "active",
      department: staffData.department || "Lễ tân & Dịch vụ",
      createdAt: new Date().toISOString()
    };

    try {
      const created = await UserDoc.create(newStaff);
      const resObj = created.toObject ? created.toObject() : created;
      readUsersFromFile().then(async list => {
        list.push(resObj);
        await writeUsersToFile(list);
      });
      return resObj;
    } catch (e) {
      console.error("Lỗi MongoDB khi tạo staff:", e.message);
      throw e;
    }
  },

  async toggleStaffStatus(id) {
    const cleanId = String(id).trim();
    await connectDB();
    try {
      const user = await UserDoc.findOne({ id: cleanId });
      if (!user || user.role !== "STAFF") return null;

      user.status = user.status === "active" ? "locked" : "active";
      await user.save();
      const resObj = user.toObject();

      readUsersFromFile().then(async list => {
        const idx = list.findIndex(u => u.id === cleanId);
        if (idx !== -1) {
          list[idx].status = user.status;
          await writeUsersToFile(list);
        }
      });
      return resObj;
    } catch (e) {
      console.error("Lỗi MongoDB khi toggleStaffStatus:", e.message);
      return null;
    }
  },

  async deleteStaff(id) {
    const cleanId = String(id).trim();
    await connectDB();
    try {
      const user = await UserDoc.findOne({ id: cleanId });
      if (!user || user.role !== "STAFF") return false;

      await UserDoc.deleteOne({ id: cleanId });
      readUsersFromFile().then(async list => {
        const filtered = list.filter(u => u.id !== cleanId);
        await writeUsersToFile(filtered);
      });
      return true;
    } catch (e) {
      console.error("Lỗi MongoDB khi deleteStaff:", e.message);
      return false;
    }
  },

  async update(id, updateData) {
    const cleanId = String(id).trim();
    await connectDB();

    const safeUpdate = { ...updateData };
    delete safeUpdate._id;
    delete safeUpdate.id;
    delete safeUpdate.role; // Protect role integrity

    if (safeUpdate.password) {
      safeUpdate.password = hashPassword(safeUpdate.password);
    }

    try {
      const updated = await UserDoc.findOneAndUpdate(
        { id: cleanId },
        { $set: safeUpdate },
        { new: true }
      ).lean();

      if (updated) {
        readUsersFromFile().then(async list => {
          const idx = list.findIndex(u => u.id === cleanId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updated };
            await writeUsersToFile(list);
          }
        });
        return updated;
      }
    } catch (e) {
      console.error("Lỗi MongoDB khi update user:", e.message);
    }
    return null;
  },

  // Export các hàm tiện ích bảo mật mật khẩu
  hashPassword,
  comparePassword,
  isBcryptHash
};
