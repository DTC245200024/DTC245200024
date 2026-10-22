# 🏨 HỆ THỐNG ĐẶT PHÒNG KHÁCH SẠN (ĐỀ 6) - CẬP NHẬT AUTH & ĐẶT PHÒNG


Kho lưu trữ: DTC245200024
Môn học: Triển khai và Quản trị Hệ thống Phần mềm

1. Giới thiệu và thông tin sinh viên

Sinh viên thực hiện: Nguyễn Thuỳ Chang

Mã số sinh viên (MSSV): DTC245200024

Lớp: CNTT K23G

Email: dtc245200024@ictu.edu.vn

Mô tả đề tài: Xây dựng và triển khai hệ thống website đặt phòng khách sạn bằng React và Node.js/Express REST API, hỗ trợ xem phòng, đăng ký, đăng nhập, đặt phòng và quản lý thông tin đặt phòng. Hệ thống sử dụng Docker Compose để đóng gói và triển khai các dịch vụ, tích hợp Nginx Reverse Proxy để định tuyến và tăng cường bảo mật, MongoDB để lưu trữ dữ liệu, Prometheus và Grafana để giám sát hệ thống, Loki và Promtail để quản lý log tập trung, đồng thời áp dụng các biện pháp Hardening nhằm tăng cường bảo mật hệ thống.


Mục tiêu: Triển khai ứng dụng web, giám sát hệ thống, quản lý log tập trung và tăng cường bảo mật container.
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

## 🐳 HƯỚNG DẪN TRIỂN KHAI BẰNG DOCKER DESKTOP TRÊN MACBOOK (MỤC 1, 2, 3, 4 & 5)

Hệ thống được đóng gói hoàn chỉnh bằng **Docker Compose** gồm 12 dịch vụ độc lập kết nối qua mạng nội bộ `hotel-network`:
- **`hotel_nginx`**: Nginx Reverse Proxy đóng vai trò cổng vào duy nhất (Port `80` HTTP & Port `443` HTTPS SSL tự ký), trang bị Security Headers và endpoint `/stub_status`.
- **`hotel_frontend`**: Giao diện người dùng React 19 + Vite SPA (Port nội bộ `5173`).
- **`hotel_backend`**: Máy chủ REST API Node.js Express (Port nội bộ `5001`).
- **`hotel_database`**: Cơ sở dữ liệu NoSQL MongoDB 6.0 (Port `27017`), dữ liệu lưu trong volume `mongo_data`.
- **`hotel_db_admin`**: Giao diện Web trực quan quản lý Database Mongo-Express (Port `8081`).
- **`hotel_cadvisor`**: Thu thập metrics phần cứng Docker Containers (CPU, RAM, Network, trạng thái) (Port nội bộ `8080`).
- **`hotel_nginx_exporter`**: Thu thập metrics Nginx Web Server từ `/stub_status` (Port nội bộ `9113`).
- **`hotel_mongodb_exporter`**: Thu thập metrics MongoDB Database (Operations, Connections, Memory) (Port nội bộ `9216`).
- **`hotel_prometheus`**: Máy chủ giám sát & lưu trữ Time-Series Database (Port `9090`), scrape tự động 4 targets qua `hotel-network`.
- **`hotel_grafana`**: Hệ thống trực quan hóa Dashboard & Explore Log (Port `3000`), tự động kết nối Prometheus và Loki.
- **`hotel_loki`**: Máy chủ tập trung lưu trữ và truy vấn log (Port `3100`), lưu trữ phân đoạn log qua volume `loki_data`.
- **`hotel_promtail`**: Trình thu thập log thời gian thực từ Docker socket và đẩy về Loki kèm các nhãn metadata chuẩn.

### 1. Yêu cầu cài đặt
- Đã cài đặt và mở **Docker Desktop** trên MacBook.
- Đảm bảo các cổng `80`, `443`, `3000`, `3100`, `8081`, `9090`, `27017` không bị chiếm dụng.

### 2. Cấu hình biến môi trường & Bảo mật
Sao chép file cấu hình mẫu `.env.example` thành `.env` và tự thiết lập các mật khẩu an toàn theo ý muốn:
```bash
cp .env.example .env
```

> ⚠️ **LƯU Ý BẢO MẬT:**
> - File `.env` chứa thông tin nhạy cảm (mật khẩu cơ sở dữ liệu, tài khoản quản trị, mật khẩu Grafana) và đã được cấu hình trong `.gitignore` để **không bao giờ commit lên GitHub**.
> - Tuyệt đối không ghi mật khẩu thật vào `.env.example` hoặc các tài liệu chia sẻ công khai.
* Hướng dẫn chạy đúng thứ tự 
# Bước 1: Tải mã nguồn từ GitHub
git clone https://github.com/DTC245200024/DTC245200024.git

# Bước 2: Di chuyển vào thư mục dự án
cd DTC245200024

# Bước 3: Kiểm tra file cấu hình môi trường
ls -la
nano .env

# Bước 4: Kiểm tra cấu hình Docker Compose
docker compose config

# Bước 5: Khởi chạy toàn bộ hệ thống
sudo docker compose up -d --build

# Bước 6: Kiểm tra trạng thái container
sudo docker compose ps

# Bước 7: Xem log nếu có lỗi
sudo docker compose logs --tail=100
### 3. Lệnh khởi chạy toàn bộ hệ thống bằng Docker Compose
Mở Terminal tại thư mục gốc của dự án:
```bash
# Khởi chạy toàn bộ hệ thống gồm Website, Reverse Proxy, Monitoring và Logging Stack
docker compose up -d --build
```

### 4. Kiểm tra trạng thái và log các container
```bash
# Xem danh sách tất cả container đang chạy
docker compose ps

# Kiểm tra cú pháp cấu hình Nginx
docker exec hotel_nginx nginx -t

# Xem log thời gian thực của Loki
docker logs -f hotel_loki

# Xem log thời gian thực của Promtail
docker logs -f hotel_promtail
```

### 5. Địa chỉ truy cập các dịch vụ trên trình duyệt
| Dịch Vụ | Địa Chỉ Truy Cập | Cổng (Port) | Ghi Chú & Hướng Dẫn Đăng Nhập |
|---|---|---|---|
| **Cổng vào Website (Nginx HTTP)** | [http://localhost](http://localhost) | `80` | Giao diện Web chính thức qua Nginx Reverse Proxy (`/` -> Frontend, `/api` -> Backend). |
| **Cổng vào Website (Nginx HTTPS)** | [https://localhost](https://localhost) | `443` | HTTPS bảo mật chứng chỉ SSL tự ký (Self-signed Certificate). |
| **Backend API Health Check** | [http://localhost/api/health](http://localhost/api/health) | `80 / 443` | REST API qua Nginx (Security Headers: nosniff, SAMEORIGIN, strict-origin). |
| **Bảng Điều Khiển Grafana (Mục 4 & 5)** | [http://localhost:3000](http://localhost:3000) | `3000` | Dashboard giám sát Metrics & Explore LogQL (Tài khoản: `admin` / `admin`). |
| **Máy Chủ Thu Thập Log Loki (Mục 5)** | [http://localhost:3100](http://localhost:3100) | `3100` | Kiểm tra trạng thái sẵn sàng tại [http://localhost:3100/ready](http://localhost:3100/ready). |
| **Máy Chủ Prometheus (Mục 4)** | [http://localhost:9090](http://localhost:9090) | `9090` | Xem trạng thái scrape targets tại [http://localhost:9090/targets](http://localhost:9090/targets). |
| **Quản lý DB (Mongo-Express)** | [http://localhost:8081](http://localhost:8081) | `8081` | Quản lý MongoDB Web GUI (`admin` / cấu hình qua `DB_ADMIN_PASSWORD`). |
| **Cơ sở dữ liệu MongoDB** | `localhost:27017` | `27017` | Kết nối trực tiếp qua `DB_USER` và `DB_PASSWORD` (Database: `hotel_booking_db`). |

### 6. Giám Sát Toàn Diện Với Prometheus & Grafana (Mục 4)
Hệ thống giám sát được tự động hóa hoàn toàn thông qua Docker Compose và cơ chế Provisioning:
1. **Phạm vi giám sát:**
   - **Docker Containers**: Trạng thái container hoạt động, tỷ lệ % CPU sử dụng, RAM tiêu thụ theo từng container (qua **cAdvisor**).
   - **Web Server Nginx**: Trạng thái uptime (`nginx_up`), số lượng kết nối đang hoạt động (`active connections`), tốc độ xử lý request (`requests/sec`) (qua **Nginx Prometheus Exporter**).
   - **Database MongoDB**: Trạng thái uptime (`mongodb_up`), số lượng kết nối hiện tại (`connections`), tần suất thao tác CRUD (`CRUD ops/sec`), dung lượng RAM Resident & Virtual (qua **Percona MongoDB Exporter**).
2. **Cơ chế Scraping & Mạng nội bộ:**
   - Prometheus scrape định kỳ 5 giây/lần tới các endpoint nội bộ trong mạng `hotel-network`: `cadvisor:8080`, `nginx-exporter:9113`, `mongodb-exporter:9216`, và chính `localhost:9090`.
   - Tất cả 4 targets đều ở trạng thái `UP`.
3. **Grafana Provisioning & Dashboard:**
   - Data Source `Prometheus` được cấu hình tự động trỏ đến `http://prometheus:9090`.
   - Dashboard **"Hệ Thống Giám Sát Khách Sạn (Docker - Nginx - MongoDB)"** được tự động import từ thư mục provisioning, hiển thị biểu đồ và đồng hồ đo thời gian thực cho cả 3 phạm vi.
4. **Bảo toàn dữ liệu:**
   - Dữ liệu Prometheus và Grafana được lưu trữ độc lập qua 2 named volume `prometheus_data` và `grafana_data`.
   - Volume `mongo_data` được giữ nguyên vẹn 100%, bảo đảm toàn bộ dữ liệu phòng và đơn đặt phòng không bị ảnh hưởng.

### 7. Hệ Thống Log Tập Trung Với Loki + Promtail & LogQL (Mục 5)
Hệ thống quản lý log tập trung được triển khai hoàn chỉnh để thu thập, phân tích và truy vấn log của toàn bộ hệ thống:
1. **Kiến trúc Logging Stack:**
   - **Promtail**: Đóng vai trò log agent, kết nối trực tiếp đến `/var/run/docker.sock` và `/var/lib/docker/containers` để tự động phát hiện mọi container đang chạy (qua cơ chế `docker_sd_configs`). Gán các nhãn có nghĩa như `container`, `service`, `compose_service`, `stream` và loại bỏ định dạng JSON envelope của Docker.
   - **Loki**: Đóng vai trò time-series log database hiệu năng cao, lưu trữ các chuỗi log dạng index-less kết hợp TSDB schema và lưu trữ bền vững qua volume `loki_data`.
   - **Grafana Data Source**: Tự động liên kết Loki làm Data Source nội bộ (`http://loki:3100`) qua cơ chế provisioning, cho phép truy vấn trực quan tại mục **Explore**.
2. **Các truy vấn LogQL tiêu biểu:**
   - Xem toàn bộ log container: `{container=~".+"}`
   - Lọc log lỗi Backend hoặc Nginx: `{container=~"hotel_backend|hotel_nginx"} |~ "(?i)error|exception|fatal|fail"`
   - Đếm số dòng log lỗi toàn hệ thống trong 5 phút: `sum(count_over_time({container=~".+"} |~ "(?i)error|exception|fatal" [5m]))`
   - *Chi tiết tài liệu và các câu lệnh truy vấn bổ sung xem tại file [docs/logql-queries.md](docs/logql-queries.md).*

### 8. Lệnh dừng hệ thống khi không sử dụng
```bash
# Dừng các container (giữ nguyên toàn bộ dữ liệu trong volume)
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

### 9. cấu trúc dụ án
DTC245200024/
├── backend/
│   ├── Dockerfile
│   ├── data/
│   ├── uploads/
│   └── ...                 # Mã nguồn Node.js + Express REST API
│
├── frontend/
│   ├── Dockerfile
│   └── ...                 # Mã nguồn React 19 + Vite
│
├── mongo-init/
│   └── ...                 # Khởi tạo cơ sở dữ liệu MongoDB
│
├── nginx/
│   ├── Dockerfile
│   ├── nginx.conf          # Reverse proxy và security headers
│   └── ...                 # Cấu hình SSL nếu có
│
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   ├── provisioning/
│   │   └── dashboards/
│   ├── loki/
│   │   └── loki.yml
│   └── promtail/
│       └── promtail.yml
│
├── docker-compose.yml      # Khai báo và kết nối các container
├── .env                    # Biến môi trường và thông tin cấu hình
├── .env.example            # Mẫu cấu hình, nếu có
├── .gitignore
└── README.md               # Hướng dẫn cài đặt và sử dụng
