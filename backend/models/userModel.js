const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

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

async function readUsers() {
  try {
    if (!fsSync.existsSync(DATA_DIR)) {
      fsSync.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fsSync.existsSync(DATA_FILE)) {
      const defaults = getDefaultUsers();
      await fs.writeFile(DATA_FILE, JSON.stringify(defaults, null, 2), "utf-8");
      return defaults;
    }
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaults = getDefaultUsers();
      await fs.writeFile(DATA_FILE, JSON.stringify(defaults, null, 2), "utf-8");
      return defaults;
    }
    return parsed;
  } catch (error) {
    console.error("Error reading users data, using default accounts:", error);
    return getDefaultUsers();
  }
}

async function writeUsers(users) {
  if (!fsSync.existsSync(DATA_DIR)) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");
}

module.exports = {
  async getAll() {
    return await readUsers();
  },

  async findByEmail(email) {
    const users = await readUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  async findByPhone(phone) {
    const users = await readUsers();
    return users.find(u => u.phone === phone.trim()) || null;
  },

  async findById(id) {
    const users = await readUsers();
    return users.find(u => u.id === id) || null;
  },

  // Customer registration strictly creates CUSTOMER role
  async create(userData) {
    const users = await readUsers();
    const newId = "USR-" + (1000 + users.length + 1);
    
    const newUser = {
      id: newId,
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone.trim(),
      password: userData.password,
      role: "CUSTOMER",
      status: "active",
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsers(users);
    return newUser;
  },

  // Admin-only: Create new Staff account
  async createStaff(staffData) {
    const users = await readUsers();
    const newId = "STAFF-" + (100 + users.filter(u => u.role === "STAFF").length + 1);

    const newStaff = {
      id: newId,
      name: staffData.name.trim(),
      email: staffData.email.toLowerCase().trim(),
      phone: staffData.phone.trim(),
      password: staffData.password || "Staff@123",
      role: "STAFF",
      status: "active",
      department: staffData.department || "Lễ tân & Dịch vụ",
      createdAt: new Date().toISOString()
    };

    users.push(newStaff);
    await writeUsers(users);
    return newStaff;
  },

  // Admin-only: Toggle Staff active/locked
  async toggleStaffStatus(id) {
    const users = await readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    if (users[index].role !== "STAFF") return null; // Cannot lock admin

    const currentStatus = users[index].status || "active";
    users[index].status = currentStatus === "active" ? "locked" : "active";

    await writeUsers(users);
    return users[index];
  },

  // Admin-only: Delete staff account
  async deleteStaff(id) {
    const users = await readUsers();
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete || userToDelete.role !== "STAFF") return false; // Strictly protect admin

    const filtered = users.filter(u => u.id !== id);
    await writeUsers(filtered);
    return true;
  },

  async update(id, updateData) {
    const users = await readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    const updated = {
      ...users[index],
      ...updateData,
      id: users[index].id,
      // Protect role integrity
      role: users[index].role
    };

    users[index] = updated;
    await writeUsers(users);
    return updated;
  }
};
