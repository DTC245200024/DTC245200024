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

## 👥 TÀI KHOẢN TRẢI NGHIỆM & HƯỚNG DẪN ĐĂNG NHẬP

Hệ thống hỗ trợ 2 nhóm vai trò người dùng chính:

1. **Quản Trị Viên (Admin / Staff)**:
   - Thông tin đăng nhập quản trị viên mặc định được cấu hình thông qua các biến môi trường `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong file `.env`.
   - Quản trị viên có quyền truy cập toàn bộ chức năng: quản lý danh sách phòng, duyệt đặt phòng, làm thủ tục nhận phòng/trả phòng, xem thống kê doanh thu và cấu hình thiết lập hệ thống.
   - Để tùy chỉnh email hoặc mật khẩu quản trị viên, hãy cập nhật giá trị trong file `.env` trước khi khởi chạy hệ thống.

2. **Khách Hàng (Customer)**:
   - Người dùng có thể tự đăng ký tài khoản mới trực tiếp tại trang **Đăng ký** (`/register`) trên giao diện web với email và số điện thoại cá nhân.
   - Hệ thống cũng hỗ trợ các tài khoản mẫu để trải nghiệm (ví dụ tài khoản khách hàng với email `khachhang@gmail.com`). Thông tin xác thực được quản lý an toàn nội bộ qua cơ sở dữ liệu và biến môi trường.

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

## 🐳 HƯỚNG DẪN TRIỂN KHAI BẰNG DOCKER DESKTOP TRÊN MACBOOK (MỤC 1 & 2)

Hệ thống được đóng gói hoàn chỉnh bằng **Docker Compose** gồm 4 dịch vụ độc lập kết nối qua mạng nội bộ `hotel-network`:
- **`hotel_frontend`**: Giao diện người dùng React 19 + Vite SPA (Port `5173`).
- **`hotel_backend`**: Máy chủ REST API Node.js Express (Port `5001`).
- **`hotel_database`**: Cơ sở dữ liệu NoSQL MongoDB 6.0 (Port `27017`), tự động nạp dữ liệu ban đầu từ thư mục `mongo-init/`.
- **`hotel_db_admin`**: Giao diện Web trực quan quản lý Database Mongo-Express (Port `8081`).

### 1. Yêu cầu cài đặt
- Đã cài đặt và mở **Docker Desktop** trên MacBook.
- Đảm bảo các cổng `5001`, `5173`, `8081`, `27017` không bị chiếm dụng.

### 2. Cấu hình biến môi trường & Bảo mật
Sao chép file cấu hình mẫu `.env.example` thành `.env` và tự thiết lập các mật khẩu an toàn theo ý muốn:
```bash
cp .env.example .env
```

> ⚠️ **LƯU Ý BẢO MẬT:**
> - File `.env` chứa thông tin nhạy cảm (mật khẩu cơ sở dữ liệu, tài khoản quản trị) và đã được cấu hình trong `.gitignore` để **không bao giờ commit lên GitHub**.
> - Tuyệt đối không ghi mật khẩu thật vào `.env.example` hoặc các tài liệu chia sẻ công khai.

### 3. Lệnh khởi chạy toàn bộ hệ thống bằng Docker Compose
Mở Terminal tại thư mục gốc của dự án:
```bash
# Build các image và chạy ngầm tất cả container
docker compose up -d --build
```

### 4. Kiểm tra trạng thái và log các container
```bash
# Xem danh sách các container đang chạy
docker compose ps

# Xem log thời gian thực của backend
docker logs -f hotel_backend

# Xem log của database
docker logs -f hotel_database
```

### 5. Địa chỉ truy cập các dịch vụ trên trình duyệt
| Dịch Vụ | Địa Chỉ Truy Cập | Cổng (Port) | Hướng Dẫn Thông Tin Đăng Nhập |
|---|---|---|---|
| **Frontend Web** | [http://localhost:5173](http://localhost:5173) | `5173` | • **Admin**: Sử dụng email và mật khẩu được cấu hình trong biến môi trường `ADMIN_EMAIL` và `ADMIN_PASSWORD` tại file `.env`.<br>• **Khách hàng**: Đăng ký tài khoản mới trực tiếp tại `/register` hoặc sử dụng tài khoản mẫu của hệ thống. |
| **Backend API** | [http://localhost:5001/api/health](http://localhost:5001/api/health) | `5001` | REST API (Kiểm tra trạng thái hệ thống: `/api/health`). Cổng cấu hình qua biến `BACKEND_PORT` (mặc định `5001`). |
| **Quản lý DB (Mongo-Express)** | [http://localhost:8081](http://localhost:8081) | `8081` | Sử dụng thông tin đăng nhập Web GUI được cấu hình trong biến môi trường `DB_ADMIN_USER` và `DB_ADMIN_PASSWORD` tại file `.env`. Cổng cấu hình qua `DB_ADMIN_PORT`. |
| **Cơ sở dữ liệu MongoDB** | `localhost:27017` | `27017` | Kết nối qua `DB_USER` và `DB_PASSWORD` từ file `.env` (Database: `hotel_booking_db`). Cổng cấu hình qua biến `DB_PORT`. |

### 6. Lệnh dừng hệ thống khi không sử dụng
```bash
# Dừng các container (giữ nguyên dữ liệu trong volume)
docker compose down
```

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
