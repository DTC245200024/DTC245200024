# 🏨 HỆ THỐNG ĐẶT PHÒNG KHÁCH SẠN (ĐỀ 6) - CẬP NHẬT AUTH & ĐẶT PHÒNG

Hệ thống Website Đặt phòng Khách sạn hoàn chỉnh Full Stack (**Frontend React** + **Backend Node.js Express REST API** + **PostgreSQL**, quản trị bằng **pgAdmin**).

**Kho lưu trữ:** DTC245200024  
**Môn học:** Triển khai và Quản trị Hệ thống Phần mềm  

### 1. Giới thiệu và thông tin sinh viên
- **Sinh viên thực hiện:** Nguyễn Thuỳ Chang  
- **Mã số sinh viên (MSSV):** DTC245200024  
- **Lớp:** CNTT K23G  
- **Email:** dtc245200024@ictu.edu.vn  
- **Mô tả đề tài (Đề 6):** Xây dựng và triển khai hệ thống website đặt phòng khách sạn bằng React và Node.js/Express REST API, hỗ trợ xem phòng, đăng ký, đăng nhập, đặt phòng và quản lý thông tin đặt phòng. Hệ thống sử dụng Docker Compose để đóng gói và triển khai các dịch vụ, tích hợp Nginx Reverse Proxy để định tuyến và tăng cường bảo mật, **PostgreSQL 16 và pgAdmin 4** để lưu trữ và quản trị dữ liệu, Prometheus và Grafana để giám sát hệ thống, Loki và Promtail để quản lý log tập trung, đồng thời áp dụng các biện pháp Hardening nhằm tăng cường bảo mật hệ thống.  
- **Mục tiêu:** Triển khai ứng dụng web, giám sát hệ thống, quản lý log tập trung và tăng cường bảo mật container.

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
  + ## 4. Hướng dẫn chạy đúng thứ tự

Triển khai hệ thống đặt phòng khách sạn trên Ubuntu theo các bước:

```bash
# Bước 1: Sao chép mã nguồn
git clone https://github.com/DTC245200024/DTC245200024.git

# Bước 2: Vào thư mục dự án
cd DTC245200024

# Bước 3: Kiểm tra cấu hình
ls -la

# Bước 4: Kiểm tra Docker Compose
sudo docker compose config

# Bước 5: Khởi chạy hệ thống
sudo docker compose up -d --build

# Bước 6: Kiểm tra container
sudo docker compose ps
```

### 5. 🧭 Header Điều Hướng (Navbar)
- **Phía bên trái**: Logo Grand Palace Hotel 5 sao + Menu (*Trang chủ, Danh sách phòng, Dịch vụ, Giới thiệu, Liên hệ*).
- **Phía bên phải**:
  + **Khi CHƯA đăng nhập**: Hiển thị nút **Đăng nhập** & **Đăng ký**.
  + **Khi ĐÃ đăng nhập**: Hiển thị Avatar + **"Xin chào, [Tên khách hàng]"** kèm Dropdown:
    * *Tài khoản của tôi (`/account`)*
    * *Đơn đặt phòng của tôi (`/my-bookings`)*
    * *Quản trị khách sạn (dành cho Admin)*
    * *Đăng xuất*

### 6. 📋 Đơn Đặt Phòng Của Tôi (`/my-bookings`)
- Chỉ hiển thị các đơn đặt phòng thuộc về tài khoản đang đăng nhập.
- Xem chi tiết từng đơn, mã đặt phòng, phòng đã đặt, ngày check-in, check-out, số khách, tổng tiền, trạng thái (*Chờ xác nhận, Đã xác nhận, Đã nhận phòng, Đã hủy*).
- Xem lại Phiếu Đặt Phòng (Voucher) và tính năng Hủy đơn trực tiếp.

### 7. 👤 Trang Hồ Sơ Tài Khoản (`/account`)
- Xem thông tin cá nhân (*Họ tên, Email, Số điện thoại, Hạng thành viên*).
- Cho phép chỉnh sửa và cập nhật họ tên, số điện thoại.

---
## 8. Cấu trúc thư mục dự án

DTC245200024/
├── backend/
│   ├── Dockerfile
│   ├── data/
│   └── uploads/
├── frontend/
│   └── Dockerfile
├── database/
│   ├── init/
│   └── pgadmin/
│       └── servers.json
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
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
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md

## 👥 TÀI KHOẢN TRẢI NGHIỆM & HƯỚNG DẪN ĐĂNG NHẬP

Hệ thống hỗ trợ 2 nhóm vai trò người dùng chính:

1. **Quản Trị Viên (Admin / Staff)**:
   - Tài khoản quản trị nằm trong bảng `users` (mật khẩu băm bcrypt); xem mục "Tài khoản quản trị" bên dưới để tạo mới bằng `npm run create-admin`.
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
*(Backend chạy tại http://localhost:5001. Khi chạy ngoài Docker cần một PostgreSQL đã khởi tạo bằng `database/init/*` và cấu hình `DB_HOST`, `DB_PORT`, `DB_NAME`, `APP_DB_USER`, `APP_DB_PASSWORD` trong `backend/.env`; cách đơn giản nhất là dùng Docker Compose ở phần dưới.)*

### Bước 3: Khởi động Frontend (Port 5173)
```bash
cd frontend
npm run dev
```
*(Truy cập website trên trình duyệt tại http://localhost:5173)*

---

## 🐳 HƯỚNG DẪN TRIỂN KHAI BẰNG DOCKER (POSTGRESQL + PGADMIN)

Hệ thống được đóng gói bằng **Docker Compose** gồm các dịch vụ chạy trên 3 mạng riêng (`frontend_net`, `backend_net`, `monitoring_net`):

| Container | Vai trò | Cổng |
|---|---|---|
| `hotel_nginx` | Reverse proxy, HTTPS (chứng chỉ tự ký), Security Headers, `/stub_status` | `NGINX_PORT` (80) / `NGINX_SSL_PORT` (443) |
| `hotel_frontend` | React 19 + Vite SPA | nội bộ `5173` |
| `hotel_backend` | Node.js Express REST API (thư viện `pg`) | nội bộ `5001` |
| `hotel_postgres` | **PostgreSQL 16**, dữ liệu trong volume `pg_data` | nội bộ `5432` (**không publish ra host**) |
| `hotel_pgadmin` | **pgAdmin 4** quản lý CSDL | `127.0.0.1:5050` (chỉ localhost) |
| `hotel_postgres_exporter` | Metrics PostgreSQL cho Prometheus | nội bộ `9187` |
| `hotel_cadvisor`, `hotel_nginx_exporter` | Metrics container / Nginx | nội bộ |
| `hotel_prometheus` | Giám sát (scrape 5s) | `127.0.0.1:9090` |
| `hotel_grafana` | Dashboard + Explore log | `127.0.0.1:3000` |
| `hotel_loki`, `hotel_promtail` | Log tập trung | `127.0.0.1:3100` / nội bộ |

**Thứ tự khởi động (healthcheck):** `postgres` (healthy) → `backend` (healthy, kiểm tra `/api/health`) → `nginx`. `pgadmin` và `postgres-exporter` cũng chờ `postgres` healthy.

### 1. Yêu cầu
- Docker Desktop đang chạy. Các cổng `NGINX_PORT`, `NGINX_SSL_PORT`, `5050`, `3000`, `3100`, `9090` không bị chiếm (ví dụ XAMPP/Apache thường chiếm cổng 80/443 → đổi `NGINX_PORT=8080`, `NGINX_SSL_PORT=8443` trong `.env`).

### 2. Cấu hình biến môi trường
```bash
cp .env.example .env
# Sinh mật khẩu ngẫu nhiên cho từng biến *_PASSWORD:
openssl rand -base64 24 | tr -d '/+=' | cut -c1-24
```
Các biến CSDL quan trọng (không có mật khẩu mặc định trong mã nguồn; `docker compose` sẽ báo lỗi nếu thiếu):

| Biến | Ý nghĩa |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Database và tài khoản chủ sở hữu (dùng cho pgAdmin) |
| `APP_DB_USER`, `APP_DB_PASSWORD` | Tài khoản backend, **chỉ có quyền SELECT/INSERT/UPDATE/DELETE** |
| `EXPORTER_DB_USER`, `EXPORTER_DB_PASSWORD` | Tài khoản chỉ đọc (`pg_monitor`) cho postgres-exporter |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`, `PGADMIN_PORT` | Đăng nhập & cổng pgAdmin |

> ⚠️ Các role/schema chỉ được tạo **một lần** khi volume `pg_data` còn trống (script trong `database/init/`). Nếu đổi mật khẩu trong `.env` sau đó, hãy đổi bằng `ALTER ROLE ... PASSWORD ...` trong pgAdmin/psql.
> File `.env` đã nằm trong `.gitignore`, không commit.

### 3. Khởi chạy
```bash
docker compose config -q          # kiểm tra cú pháp
docker compose up -d --build      # build + chạy toàn bộ
docker compose ps                 # backend/postgres phải ở trạng thái (healthy)
```

### 4. Đăng nhập pgAdmin
1. Mở http://localhost:5050 (cổng = `PGADMIN_PORT`).
2. Đăng nhập bằng `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` trong `.env`.
3. Server **"Hotel PostgreSQL"** đã được cấu hình sẵn (`database/pgadmin/servers.json`: host `postgres`, port `5432`, user `hotel_admin`). Khi kết nối, nhập mật khẩu `DB_PASSWORD`.
4. Xem bảng tại *Databases → hotel_booking_db → Schemas → public → Tables* (`users`, `rooms`, `bookings`).

<<<<<<< HEAD
### 4. Kiểm tra trạng thái và log các container
=======
> Nếu bạn đổi `DB_USER`/`DB_NAME` khác mặc định, hãy sửa `Username`/`MaintenanceDB` trong `database/pgadmin/servers.json` (chỉ áp dụng khi volume `pgadmin_data` còn trống) hoặc thêm server thủ công trong giao diện.

### 5. Lược đồ cơ sở dữ liệu (`database/init/02-schema.sql`)
- **`users`**: PK `id`; `email` & `phone` UNIQUE; `role` ∈ {ADMIN, STAFF, CUSTOMER}; `status` ∈ {active, locked}; mật khẩu lưu băm bcrypt (`password_hash`).
- **`rooms`**: PK `id`; `room_code` UNIQUE; `price >= 0`; `max_guests > 0`; `status` thuộc danh sách trạng thái phòng; `amenities TEXT[]`.
- **`bookings`**: PK `booking_code` (`BK-YYYY-XXXX`); FK `user_id → users(id)` và `room_id → rooms(id)` (`ON DELETE SET NULL` để **giữ lịch sử đơn** khi xóa tài khoản/phòng; `room_code/room_name/room_type` là bản chụp lúc đặt); `check_out > check_in`; `nights, guests >= 1`; các CHECK cho trạng thái đơn/thanh toán/nhận–trả phòng.
- **Chống đặt trùng phòng (2 lớp):**
  1. Backend dùng **transaction + khóa dòng phòng** (`SELECT ... FOR UPDATE`) khi tạo đơn và khi xác nhận đơn; từ chối (HTTP 409/400) nếu trùng khoảng ngày với đơn đang chiếm phòng (*Đã xác nhận / Đã nhận phòng / Khách yêu cầu trả phòng*).
  2. CSDL có ràng buộc `EXCLUDE USING gist (room_id WITH =, daterange(check_in, check_out, '[)') WITH &&)` nên không thể ghi 2 đơn đang chiếm phòng trùng ngày, kể cả khi truy cập trực tiếp CSDL.
- Đơn **Chờ xác nhận** được phép chồng lịch (giống nghiệp vụ cũ); khi lễ tân xác nhận một đơn thì các đơn trùng lịch còn lại không thể xác nhận.

### 6. Migration dữ liệu MongoDB → PostgreSQL (đã thực hiện một lần)
Dữ liệu cũ (6 users, 10 rooms, 21 bookings) đã được **export + sao lưu** trước khi chuyển đổi, volume `mongo_data` **không bị xóa**.
```bash
# (a) Export từ MongoDB cũ (nếu còn container Mongo) ra migration/export/*.json
for c in users rooms bookings settings; do
  docker exec <mongo_container> mongoexport -u <user> -p <pass> --authenticationDatabase admin \
    --db hotel_booking_db --collection $c --jsonArray --quiet > migration/export/$c.json
done

# (b) Chạy thử (không ghi gì) rồi chạy thật. Có thể chạy lại nhiều lần (idempotent), trong 1 transaction.
docker compose run --rm --no-deps -v "$PWD/migration/export:/migration/export:ro" \
  backend node scripts/migrate-from-json.js /migration/export --dry-run
docker compose run --rm --no-deps -v "$PWD/migration/export:/migration/export:ro" \
  backend node scripts/migrate-from-json.js /migration/export
```
Script in báo cáo đối chiếu số bản ghi và tổng doanh thu đã thanh toán giữa nguồn và PostgreSQL, đồng thời liệt kê dữ liệu bất thường của hệ thống cũ đã được xử lý:
- Hai tài khoản trùng id `USR-1005` → tài khoản `chutit123@gmail.com` được cấp id mới `USR-1008`; đơn của họ được gán theo email.
- Đơn `BK-2026-1008` tham chiếu phòng `RM-402` không tồn tại → `room_id = NULL`, vẫn giữ `room_code = RM-402`.
- Đơn `BK-2026-1019` tham chiếu `userId = USR-1007` không tồn tại → `user_id = NULL`.
- Phòng `RM-109` thiếu `floor` → mặc định `1`.

`migration/` (export, backup) nằm trong `.gitignore` vì chứa dữ liệu khách hàng. Sau khi đã kiểm tra kỹ, bạn có thể tự xóa volume cũ: `docker volume rm tphongkhchsn_mongo_data` (**không thể hoàn tác**). Thư mục `mongo-init/` và toàn bộ các tệp cấu hình MongoDB cũ đã được loại bỏ hoàn toàn khỏi dự án.

### 7. Kiểm tra hệ thống
```bash
curl http://localhost:${NGINX_PORT}/api/health        # database: "connected", databaseEngine: "PostgreSQL"
docker exec hotel_nginx nginx -t                      # cú pháp Nginx
curl -k https://localhost:${NGINX_SSL_PORT}/          # HTTPS + HSTS
# Prometheus targets (cadvisor, nginx, postgres, prometheus phải UP): http://localhost:9090/targets
# Loki sẵn sàng: http://localhost:3100/ready
```
**Smoke test API** (đăng nhập, xem phòng, đặt phòng, xác nhận, hủy, chống đặt trùng, nhận/trả phòng, lễ tân) – 39/39 kịch bản tự động kiểm thử toàn bộ luồng nghiệp vụ:
```bash
BASE_URL=http://localhost:8080 node backend/scripts/smoke-test.js
```

> **Ghi chú về kiểm thử:**
> - Toàn bộ các luồng API, xác thực, phân quyền, giao dịch cơ sở dữ liệu PostgreSQL, Nginx reverse proxy, Prometheus metrics và Loki log đã được kiểm thử tự động 100% đạt kết quả (39/39 assertions).
> - Thử nghiệm tự động hóa giao diện trực quan bằng Playwright/trình duyệt ảo (Headless Browser) trong môi trường sandbox bị hạn chế tải driver ngoài từ Internet; người dùng có thể mở trực tiếp trình duyệt tại `http://localhost:8080` để trải nghiệm trực quan.

### 8. Tài khoản quản trị
Hệ thống **không tự tạo** tài khoản mẫu/quản trị khi khởi động. Tài khoản hiện có được chuyển nguyên vẹn từ dữ liệu cũ (mật khẩu đã băm bcrypt). Nếu cần tạo admin mới trên CSDL trống:
```bash
docker compose exec backend npm run create-admin   # dùng ADMIN_EMAIL / ADMIN_PASSWORD trong .env
```

### 9. Giám sát & log
- **Prometheus** scrape: `cadvisor:8080`, `nginx-exporter:9113`, `postgres-exporter:9187`, `localhost:9090`.
- **Grafana** (http://localhost:3000, tài khoản `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`): dashboard *"Hệ Thống Giám Sát Khách Sạn (Docker - Nginx - PostgreSQL)"* gồm trạng thái `pg_up`, số kết nối, rows/giây INSERT/UPDATE/DELETE/SELECT, dung lượng database.
- **Loki + Promtail**: ví dụ LogQL `{container="hotel_postgres"}`, `{container=~"hotel_backend|hotel_nginx"} |~ "(?i)error"`. Xem thêm [docs/logql-queries.md](docs/logql-queries.md).

### 10. Dừng hệ thống
```bash
docker compose down        # giữ nguyên dữ liệu trong volume (pg_data, pgadmin_data, ...)
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

