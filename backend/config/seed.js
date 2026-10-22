const fs = require("fs");
const path = require("path");
const { query } = require("./db");
const bcrypt = require("bcryptjs");

function hashPassword(plainText) {
  if (!plainText) return plainText;
  if (typeof plainText === "string" && (plainText.startsWith("$2a$") || plainText.startsWith("$2b$") || plainText.startsWith("$2y$"))) {
    return plainText;
  }
  return bcrypt.hashSync(plainText, 10);
}

const DEFAULT_ROOMS = [
  {
    id: "P101",
    roomCode: "P101",
    name: "P101 - Phòng Đơn Cao Cấp (Superior)",
    type: "Phòng đơn",
    price: 600000,
    maxGuests: 1,
    capacity: 1,
    status: "Trống",
    floor: 1,
    size: "26m²",
    bed: "1 Giường đơn lớn (1.4m)",
    view: "Hướng vườn hoa",
    image: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1000&q=80",
    description: "Không gian yên tĩnh với cửa sổ lớn hướng vườn hoa xanh mát, trang bị bàn làm việc rộng rãi và góc đọc sách thư giãn.",
    amenities: ["Wifi tốc độ cao", "Điều hòa 2 chiều", "Smart TV 50 inch", "Minibar", "Bàn làm việc", "Két an toàn", "Áo choàng tắm", "Máy sấy tóc"]
  },
  {
    id: "P102",
    roomCode: "P102",
    name: "P102 - Phòng Đơn Tiêu Chuẩn",
    type: "Phòng đơn",
    price: 500000,
    maxGuests: 1,
    capacity: 1,
    status: "Trống",
    floor: 1,
    size: "22m²",
    bed: "1 Giường đơn (1.2m)",
    view: "Hướng phố",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80",
    description: "Phòng đơn tiêu chuẩn được thiết kế nhỏ gọn, ấm cúng và đầy đủ tiện nghi hiện đại, lý tưởng cho những chuyến công tác ngắn ngày hoặc du khách độc hành.",
    amenities: ["Wifi tốc độ cao", "Điều hòa 2 chiều", "Smart TV 43 inch", "Bàn làm việc", "Bình nóng lạnh", "Máy sấy tóc", "Nước suối miễn phí"]
  },
  {
    id: "P201",
    roomCode: "P201",
    name: "P201 - Phòng Đôi Deluxe",
    type: "Phòng đôi",
    price: 900000,
    maxGuests: 2,
    capacity: 2,
    status: "Trống",
    floor: 2,
    size: "32m²",
    bed: "1 Giường đôi Queen size",
    view: "Hướng thành phố",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80",
    description: "Phòng đôi hiện đại, gam màu trang nhã với giường Queen êm ái, mang lại sự thư thái tuyệt đối cho các cặp đôi hoặc bạn bè.",
    amenities: ["Wifi tốc độ cao", "Điều hòa 2 chiều", "Smart TV 50 inch", "Minibar", "Két an toàn", "Bồn tắm đứng", "Trà & Cà phê miễn phí", "Bàn trang điểm"]
  },
  {
    id: "P202",
    roomCode: "P202",
    name: "P202 - Phòng Đôi Cao Cấp",
    type: "Phòng đôi",
    price: 1100000,
    maxGuests: 2,
    capacity: 2,
    status: "Trống",
    floor: 2,
    size: "38m²",
    bed: "1 Giường King size",
    view: "Hướng biển Panorama",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
    description: "Thưởng thức bình minh và hoàng hôn rực rỡ từ ban công riêng hướng biển. Phòng tắm sang trọng với bồn tắm kính nhìn ra biển.",
    amenities: ["Ban công view biển", "Wifi tốc độ cao", "Điều hòa", "Smart TV 55 inch", "Bồn tắm nằm", "Minibar cao cấp", "Máy pha cà phê", "Bữa sáng miễn phí"]
  },
  {
    id: "P301",
    roomCode: "P301",
    name: "P301 - Phòng Deluxe Gia Đình",
    type: "Deluxe",
    price: 1500000,
    maxGuests: 4,
    capacity: 4,
    status: "Trống",
    floor: 3,
    size: "55m²",
    bed: "2 Giường Queen size",
    view: "Hướng biển & hồ bơi",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
    description: "Thiết kế rộng rãi đặc biệt dành cho gia đình 4 thành viên. Trang bị khu vực sinh hoạt chung ấm cúng và 2 phòng tắm riêng biệt.",
    amenities: ["Ban công toàn cảnh", "Wifi 6", "Smart TV 65 inch", "Bồn tắm sục Jacuzzi", "Khu vực tiếp khách riêng", "Minibar miễn phí", "Bữa sáng Buffet"]
  },
  {
    id: "P302",
    roomCode: "P302",
    name: "P302 - Phòng Deluxe View Thành Phố",
    type: "Deluxe",
    price: 1700000,
    maxGuests: 4,
    capacity: 4,
    status: "Trống",
    floor: 3,
    size: "60m²",
    bed: "2 Giường Queen size lớn",
    view: "Hướng trung tâm thành phố",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80",
    description: "Cửa kính chạm sàn ngắm trọn vẹn cảnh đêm lung linh của thành phố. Phòng khách tách biệt, sofa cao cấp.",
    amenities: ["View toàn cảnh thành phố", "Smart TV 65 inch", "Bếp nhỏ & Bàn ăn", "Tủ lạnh gia đình", "2 Phòng tắm riêng", "Bữa sáng Buffet 4 người"]
  },
  {
    id: "P401",
    roomCode: "P401",
    name: "P401 - Phòng VIP",
    type: "VIP",
    price: 2500000,
    maxGuests: 4,
    capacity: 4,
    status: "Trống",
    floor: 4,
    size: "80m²",
    bed: "2 Giường Super King",
    view: "Hướng biển & Skyview",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80",
    description: "Không gian xa hoa chuẩn 5 sao quốc tế, nội thất dát vàng tinh xảo, bồn sục Jacuzzi đôi ngắm hoàng hôn.",
    amenities: ["Phòng khách sang trọng", "Rượu vang & Hoa tươi chào mừng", "Bồn Jacuzzi view panorama", "Dịch vụ quản gia riêng", "Phòng xông hơi Sauna", "Bữa sáng tại phòng"]
  },
  {
    id: "P501",
    roomCode: "P501",
    name: "P501 - Suite Tổng Thống",
    type: "VIP",
    price: 5000000,
    maxGuests: 6,
    capacity: 6,
    status: "Trống",
    floor: 5,
    size: "150m²",
    bed: "3 Giường Super King",
    view: "Penthouse Tầng thượng - Toàn cảnh 360 độ",
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80",
    description: "Căn Suite Tổng thống độc bản trên tầng cao nhất với hồ bơi vô cực mini riêng, phòng họp sang trọng, xe Limousine đưa đón và quản gia 24/7.",
    amenities: ["Hồ bơi vô cực mini riêng", "Sân thượng ngắm sao 360 độ", "Dàn âm thanh vòm cao cấp", "Rượu vang thượng hạng", "Xe Limousine đưa đón", "Đầu bếp & Quản gia phục vụ riêng 24/7"]
  }
];

async function autoSeedDatabase() {
  try {
    // 1. Kiểm tra bảng rooms
    const { rows: roomCountRows } = await query("SELECT COUNT(*)::int AS count FROM rooms");
    const currentRoomCount = roomCountRows[0].count;

    if (currentRoomCount === 0) {
      console.log("🌱 [Seed] Bảng rooms đang trống. Bắt đầu nạp danh mục phòng mặc định...");

      let roomsToInsert = DEFAULT_ROOMS;
      const roomsJsonPath = path.join(__dirname, "../data/rooms.json");
      if (fs.existsSync(roomsJsonPath)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(roomsJsonPath, "utf-8"));
          if (Array.isArray(fileData) && fileData.length > 0) {
            roomsToInsert = fileData;
          }
        } catch (e) {
          console.warn("⚠️ Không thể đọc rooms.json, sử dụng danh sách mặc định:", e.message);
        }
      }

      for (const r of roomsToInsert) {
        const id = String(r.id || r.roomCode).trim();
        const maxGuests = Number(r.maxGuests) || Number(r.capacity) || 2;
        await query(
          `INSERT INTO rooms (id, room_code, name, type, price, max_guests, capacity, status, floor,
                              size, bed, view_type, image, description, amenities)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (room_code) DO NOTHING`,
          [
            id,
            r.roomCode || id,
            r.name,
            r.type,
            Number(r.price) || 500000,
            maxGuests,
            r.capacity ? Number(r.capacity) : maxGuests,
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
      }
      console.log(`✅ [Seed] Đã nạp thành công ${roomsToInsert.length} phòng vào database!`);
    }

    // 2. Kiểm tra tài khoản Quản trị viên (ADMIN)
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@grandpalace.vn").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
    const { rows: adminRows } = await query("SELECT id FROM users WHERE email = $1", [adminEmail]);

    if (adminRows.length === 0) {
      console.log(`🌱 [Seed] Khởi tạo tài khoản Quản trị viên (${adminEmail})...`);
      await query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5, 'ADMIN', 'active')
         ON CONFLICT (email) DO NOTHING`,
        [
          "USR-1000",
          "Quản Trị Viên (System Admin)",
          adminEmail,
          "19006868",
          hashPassword(adminPassword)
        ]
      );
      console.log(`✅ [Seed] Đã tạo tài khoản Quản trị viên thành công!`);
    }

    // 3. Khởi tạo các tài khoản mẫu từ users.json nếu có
    const usersJsonPath = path.join(__dirname, "../data/users.json");
    if (fs.existsSync(usersJsonPath)) {
      try {
        const fileUsers = JSON.parse(fs.readFileSync(usersJsonPath, "utf-8"));
        if (Array.isArray(fileUsers)) {
          for (const u of fileUsers) {
            const email = String(u.email || "").toLowerCase().trim();
            const phone = String(u.phone || "").trim();
            if (!email || !phone) continue;

            await query(
              `INSERT INTO users (id, name, email, phone, password_hash, role, status, department)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (email) DO NOTHING`,
              [
                u.id || `USR-${Date.now().toString().slice(-4)}`,
                u.name || "Người dùng",
                email,
                phone,
                hashPassword(u.password || "123456"),
                u.role || "CUSTOMER",
                u.status || "active",
                u.department || ""
              ]
            );
          }
        }
      } catch (e) {
        console.warn("⚠️ Bỏ qua nạp users.json:", e.message);
      }
    }
  } catch (error) {
    console.error("❌ [Seed] Lỗi khi nạp dữ liệu mẫu:", error.message);
  }
}

module.exports = {
  autoSeedDatabase,
  DEFAULT_ROOMS
};
