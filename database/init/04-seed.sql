-- =========================================================================
-- 04-seed.sql - Nạp dữ liệu mẫu ban đầu cho PostgreSQL
-- Tự động chạy khi khởi tạo database mới nếu thư mục dữ liệu chưa có
-- =========================================================================

-- 1. Tài khoản Quản trị viên mặc định
INSERT INTO users (id, name, email, phone, password_hash, role, status)
VALUES (
  'USR-1000',
  'Quản Trị Viên (System Admin)',
  'admin@grandpalace.vn',
  '19006868',
  '$2b$10$6JVXejE83N9dw1wA.rXydOhhYJhEGwahCGEaRqCJWnyIZd4NNbpvS', -- Admin@123
  'ADMIN',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- 2. Tài khoản Lễ tân mẫu
INSERT INTO users (id, name, email, phone, password_hash, role, status, department)
VALUES (
  'STAFF-104',
  'nguyen thi ngan',
  'ngan@gmail.com',
  '123456789',
  '$2b$10$2oKSk13Wu5RWtm.ZWsgL/uKiAZQWr95/QAzW8e/cuNDgLbJ5SIWmy', -- 123456
  'STAFF',
  'active',
  'Lễ tân'
) ON CONFLICT (email) DO NOTHING;

-- 3. Tài khoản Khách hàng mẫu
INSERT INTO users (id, name, email, phone, password_hash, role, status)
VALUES (
  'USR-1004',
  'nguyen van a',
  'khachhang@gmail.com',
  '0124567678',
  '$2b$10$IBHVEhYjhzwVRqkuFTKHQuwPRdXc3icqrwy7AUJTryld9k455N7L.', -- 123456
  'CUSTOMER',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- 4. Danh mục 8 phòng khách sạn tiêu chuẩn
INSERT INTO rooms (id, room_code, name, type, price, max_guests, capacity, status, floor, size, bed, view_type, image, description, amenities)
VALUES
(
  'P101', 'P101', 'P101 - Phòng Đơn Cao Cấp (Superior)', 'Phòng đơn', 600000, 1, 1, 'Trống', 1, '26m²', '1 Giường đơn lớn (1.4m)', 'Hướng vườn hoa',
  'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1000&q=80',
  'Không gian yên tĩnh với cửa sổ lớn hướng vườn hoa xanh mát, trang bị bàn làm việc rộng rãi và góc đọc sách thư giãn.',
  ARRAY['Wifi tốc độ cao', 'Điều hòa 2 chiều', 'Smart TV 50 inch', 'Minibar', 'Bàn làm việc', 'Két an toàn', 'Áo choàng tắm', 'Máy sấy tóc']
),
(
  'P102', 'P102', 'P102 - Phòng Đơn Tiêu Chuẩn', 'Phòng đơn', 500000, 1, 1, 'Trống', 1, '22m²', '1 Giường đơn (1.2m)', 'Hướng phố',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80',
  'Phòng đơn tiêu chuẩn được thiết kế nhỏ gọn, ấm cúng và đầy đủ tiện nghi hiện đại, lý tưởng cho những chuyến công tác ngắn ngày hoặc du khách độc hành.',
  ARRAY['Wifi tốc độ cao', 'Điều hòa 2 chiều', 'Smart TV 43 inch', 'Bàn làm việc', 'Bình nóng lạnh', 'Máy sấy tóc', 'Nước suối miễn phí']
),
(
  'P201', 'P201', 'P201 - Phòng Đôi Deluxe', 'Phòng đôi', 900000, 2, 2, 'Trống', 2, '32m²', '1 Giường đôi Queen size', 'Hướng thành phố',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80',
  'Phòng đôi hiện đại, gam màu trang nhã với giường Queen êm ái, mang lại sự thư thái tuyệt đối cho các cặp đôi hoặc bạn bè.',
  ARRAY['Wifi tốc độ cao', 'Điều hòa 2 chiều', 'Smart TV 50 inch', 'Minibar', 'Két an toàn', 'Bồn tắm đứng', 'Trà & Cà phê miễn phí', 'Bàn trang điểm']
),
(
  'P202', 'P202', 'P202 - Phòng Đôi Cao Cấp', 'Phòng đôi', 1100000, 2, 2, 'Trống', 2, '38m²', '1 Giường King size', 'Hướng biển Panorama',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
  'Thưởng thức bình minh và hoàng hôn rực rỡ từ ban công riêng hướng biển. Phòng tắm sang trọng với bồn tắm kính nhìn ra biển.',
  ARRAY['Ban công view biển', 'Wifi tốc độ cao', 'Điều hòa', 'Smart TV 55 inch', 'Bồn tắm nằm', 'Minibar cao cấp', 'Máy pha cà phê', 'Bữa sáng miễn phí']
),
(
  'P301', 'P301', 'P301 - Phòng Deluxe Gia Đình', 'Deluxe', 1500000, 4, 4, 'Trống', 3, '55m²', '2 Giường Queen size', 'Hướng biển & hồ bơi',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
  'Thiết kế rộng rãi đặc biệt dành cho gia đình 4 thành viên. Trang bị khu vực sinh hoạt chung ấm cúng và 2 phòng tắm riêng biệt.',
  ARRAY['Ban công toàn cảnh', 'Wifi 6', 'Smart TV 65 inch', 'Bồn tắm sục Jacuzzi', 'Khu vực tiếp khách riêng', 'Minibar miễn phí', 'Bữa sáng Buffet']
),
(
  'P302', 'P302', 'P302 - Phòng Deluxe View Thành Phố', 'Deluxe', 1700000, 4, 4, 'Trống', 3, '60m²', '2 Giường Queen size lớn', 'Hướng trung tâm thành phố',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80',
  'Cửa kính chạm sàn ngắm trọn vẹn cảnh đêm lung linh của thành phố. Phòng khách tách biệt, sofa cao cấp.',
  ARRAY['View toàn cảnh thành phố', 'Smart TV 65 inch', 'Bếp nhỏ & Bàn ăn', 'Tủ lạnh gia đình', '2 Phòng tắm riêng', 'Bữa sáng Buffet 4 người']
),
(
  'P401', 'P401', 'P401 - Phòng VIP', 'VIP', 2500000, 4, 4, 'Trống', 4, '80m²', '2 Giường Super King', 'Hướng biển & Skyview',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80',
  'Không gian xa hoa chuẩn 5 sao quốc tế, nội thất dát vàng tinh xảo, bồn sục Jacuzzi đôi ngắm hoàng hôn.',
  ARRAY['Phòng khách sang trọng', 'Rượu vang & Hoa tươi chào mừng', 'Bồn Jacuzzi view panorama', 'Dịch vụ quản gia riêng', 'Phòng xông hơi Sauna', 'Bữa sáng tại phòng']
),
(
  'P501', 'P501', 'P501 - Suite Tổng Thống', 'VIP', 5000000, 6, 6, 'Trống', 5, '150m²', '3 Giường Super King', 'Penthouse Tầng thượng - Toàn cảnh 360 độ',
  'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80',
  'Căn Suite Tổng thống độc bản trên tầng cao nhất với hồ bơi vô cực mini riêng, phòng họp sang trọng, xe Limousine đưa đón và quản gia 24/7.',
  ARRAY['Hồ bơi vô cực mini riêng', 'Sân thượng ngắm sao 360 độ', 'Dàn âm thanh vòm cao cấp', 'Rượu vang thượng hạng', 'Xe Limousine đưa đón', 'Đầu bếp & Quản gia phục vụ riêng 24/7']
)
ON CONFLICT (room_code) DO NOTHING;
