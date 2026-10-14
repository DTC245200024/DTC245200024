# 🏨 HỆ THỐNG ĐẶT PHÒNG KHÁCH SẠN (ĐỀ 6) - CẬP NHẬT AUTH & ĐẶT PHÒNG

Hệ thống Website Đặt phòng Khách sạn hoàn chỉnh Full Stack (**Frontend React** + **Backend Node.js Express REST API**).

---

## 🌟 TÍNH NĂNG MỚI ĐÃ BỔ SUNG THEO YÊU CẦU

### 1. 🏠 Trang Chủ & Trải Nghiệm Khách Hàng (Public)
- **Truy cập trực tiếp không cần đăng nhập**: Người dùng mới vào website được vào thẳng Trang chủ.
- Xem danh sách tất cả các phòng nghỉ, xem chi tiết phòng, giá niêm yết, tiện nghi, dịch vụ 5 sao, giới thiệu khách sạn và thông tin liên hệ.

### 2. 🔐 Hệ Thống Đăng Nhập & Đăng Ký (Authentication)
- **Trang Đăng Nhập (`/login`)**:
  + Đăng nhập bằng Email hoặc Số điện thoại + Mật khẩu.
  + Hỗ trợ nút đăng nhập nhanh với tài khoản mẫu (*Khách hàng mẫu / Quản trị viên*).
  + Tự động hiển thị cảnh báo giải thích nếu người dùng bị chuyển hướng từ hành động đặt phòng.
- **Trang Đăng Ký (`/register`)**:
  + Điền đầy đủ: *Họ tên, Email, Số điện thoại, Mật khẩu, Xác nhận mật khẩu*.
  + Kiểm tra trùng lặp email và số điện thoại.
  + Đăng ký xong tự động đăng nhập và tiếp tục công việc đang thực hiện.
- **Đăng Xuất**: Xóa phiên làm việc an toàn và thông báo tới người dùng.

### 3. 🛡️ Quy Tắc Đặt Phòng & Protected Route Guard
- **Khi CHƯA đăng nhập mà bấm "Đặt phòng", "Đặt phòng ngay" hoặc "Tiến hành đặt phòng"**:
  + Hệ thống tự động ghi nhớ phòng khách đang muốn đặt (kèm ngày nhận/trả/số khách nếu đã chọn).
  + Chuyển hướng sang trang `/login`.
  + Hiển thị thông báo: *"Vui lòng đăng nhập để đặt phòng."*
  + Sau khi đăng nhập thành công: **Tự động đưa người dùng quay lại phòng đang muốn đặt** để tiếp tục hoàn tất đơn đặt phòng mà không cần chọn lại từ đầu.
- **Khi ĐÃ đăng nhập**:
  + Vào thẳng form đặt phòng.
  + Tự động điền thông tin khách hàng (*Họ tên, Số điện thoại, Email*) từ tài khoản.
  + Tính tổng tiền theo thời gian thực (Đơn giá x Số đêm).
  + Sau khi xác nhận -> Trả về mã đơn `BK-YYYY-XXXX` và lưu vào tài khoản khách hàng.

### 4. 🧭 Header Điều Hướng (Navbar)
- **Phía bên trái**: Logo Grand Palace Hotel 5 sao + Menu (*Trang chủ, Danh sách phòng, Dịch vụ, Giới thiệu, Liên hệ*).
- **Phía bên phải**:
  + **Khi CHƯA đăng nhập**: Hiển thị nút **Đăng nhập** & **Đăng ký**.
  + **Khi ĐÃ đăng nhập**: Hiển thị Avatar + **"Xin chào, [Tên khách hàng]"** kèm Dropdown:
    * *Tài khoản của tôi (`/account`)*
    * *Đơn đặt phòng của tôi (`/my-bookings`)*
    * *Quản trị khách sạn (dành cho Admin)*
    * *Đăng xuất*

### 5. 📋 Đơn Đặt Phòng Của Tôi (`/my-bookings`)
- Chỉ hiển thị các đơn đặt phòng thuộc về tài khoản đang đăng nhập.
- Xem chi tiết từng đơn, mã đặt phòng, phòng đã đặt, ngày check-in, check-out, số khách, tổng tiền, trạng thái (*Chờ xác nhận, Đã xác nhận, Đã nhận phòng, Đã hủy*).
- Xem lại Phiếu Đặt Phòng (Voucher) và tính năng Hủy đơn trực tiếp.

### 6. 👤 Trang Hồ Sơ Tài Khoản (`/account`)
- Xem thông tin cá nhân (*Họ tên, Email, Số điện thoại, Hạng thành viên*).
- Cho phép chỉnh sửa và cập nhật họ tên, số điện thoại.

---

## 👥 TÀI KHOẢN MẪU DÙNG THỬ

| Vai Trò | Email / Tài Khoản | Mật Khẩu |
|---|---|---|
| **Khách Hàng Mẫu** | `khachhang@gmail.com` | `password123` |
| **Quản Trị Viên (Admin)** | `admin@grandpalace.vn` | `admin123` |

*(Bạn cũng có thể tự đăng ký bất kỳ tài khoản mới nào tại trang Đăng ký)*

---

## 🚀 HƯỚNG DẪN CHẠY DỰ ÁN

### Bước 1: Mở Terminal tại thư mục dự án
```bash
cd "/Users/nguyenthuychang/Documents/đặt phong khách sạn"
```

### Bước 2: Khởi động Backend (Port 5001)
```bash
cd backend
npm start
```
*(Backend chạy tại http://localhost:5001)*

### Bước 3: Khởi động Frontend (Port 5173)
```bash
cd frontend
npm run dev
```
*(Truy cập website trên trình duyệt tại http://localhost:5173)*

---

## 📡 DANH SÁCH REST API

| Method | Endpoint | Mô Tả |
|---|---|---|
| **POST** | `/api/auth/register` | Đăng ký tài khoản khách hàng mới |
| **POST** | `/api/auth/login` | Đăng nhập tài khoản bằng Email/SĐT |
| **GET** | `/api/auth/me/:id` | Lấy thông tin cá nhân người dùng |
| **PUT** | `/api/auth/profile/:id` | Cập nhật hồ sơ người dùng |
| **GET** | `/api/rooms` | Lấy danh sách phòng (lọc, tìm kiếm, sắp xếp) |
| **GET** | `/api/rooms/:id` | Xem chi tiết phòng theo ID |
| **POST** | `/api/rooms` | Thêm phòng mới (Admin) |
| **PUT** | `/api/rooms/:id` | Chỉnh sửa thông tin phòng (Admin) |
| **DELETE**| `/api/rooms/:id` | Xóa phòng (Admin) |
| **GET** | `/api/bookings` | Lấy danh sách đặt phòng |
| **POST** | `/api/bookings` | Đặt phòng mới |
| **PUT** | `/api/bookings/:id`| Cập nhật trạng thái đơn |
| **GET** | `/api/stats` | Thống kê doanh thu & phòng (Admin) |
