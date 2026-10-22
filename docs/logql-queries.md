# 📑 TÀI LIỆU HƯỚNG DẪN TRUY VẤN LOGQL (LOKI + PROMTAIL)
## Hệ Thống Đặt Phòng Khách Sạn (Hotel Booking System) - Mục 5

Hệ thống quản lý và thu thập log tập trung sử dụng **Grafana Loki** kết hợp cùng **Promtail** để thu thập tự động toàn bộ log từ các Docker container của dự án (`hotel_nginx`, `hotel_backend`, `hotel_postgres`, `hotel_pgadmin`, `hotel_frontend`, `hotel_prometheus`, `hotel_grafana`, `hotel_cadvisor`,...).

Các nhãn (labels) thực tế được cấu hình tự động bởi Promtail:
- `container`: Tên đầy đủ của container Docker (ví dụ: `hotel_backend`, `hotel_nginx`, `hotel_postgres`, `hotel_prometheus`,...).
- `service`: Tên dịch vụ chuẩn hóa (ví dụ: `backend`, `nginx`, `postgres`, `frontend`, `loki`,...).
- `compose_service`: Tên service khai báo trong Docker Compose (`backend`, `nginx`, `postgres`,...).
- `stream`: Luồng đầu ra của tiến trình (`stdout` hoặc `stderr`).

---

## 🔍 DANH SÁCH 3 TRUY VẤN LOGQL CHÍNH (THEO YÊU CẦU ĐỀ BÀI)

### 1. Xem log của toàn bộ container được thu thập
- **Mục đích**: Theo dõi dòng sự kiện thời gian thực (live tail) của tất cả các dịch vụ đang hoạt động trong hệ sinh thái khách sạn, giúp có cái nhìn tổng quan về trạng thái vận hành của toàn bộ hệ thống.
- **Cú pháp LogQL**:
  ```logql
  {container=~".+"}
  ```
  *Hoặc thu hẹp trong phạm vi các container của dự án khách sạn:*
  ```logql
  {container=~"hotel_.*"}
  ```
- **Cách sử dụng trên Grafana**:
  1. Mở Grafana tại [http://localhost:3000](http://localhost:3000).
  2. Chọn menu **Explore** (biểu tượng la bàn) ở thanh điều hướng bên trái.
  3. Chọn Data Source là **Loki**.
  4. Nhập `{container=~".+"}` vào ô truy vấn và bấm **Run query**.
  5. Có thể bật chế độ **Live** ở góc trên bên phải để xem log đổ về liên tục theo thời gian thực.

---

### 2. Lọc log lỗi của Backend hoặc Nginx
- **Mục đích**: Lọc và cách ly các thông điệp cảnh báo, ngoại lệ (exception), lỗi runtime hoặc lỗi kết nối chỉ riêng trong 2 thành phần tiếp nhận và xử lý luồng yêu cầu chính của người dùng là Nginx Reverse Proxy và Node.js Backend API.
- **Cú pháp LogQL**:
  ```logql
  {container=~"hotel_backend|hotel_nginx"} |~ "(?i)error|exception|fatal|fail"
  ```
  *Hoặc sử dụng nhãn `service`:*
  ```logql
  {service=~"backend|nginx"} |~ "(?i)error|exception|fatal|fail"
  ```
- **Giải thích cú pháp**:
  - `{container=~"hotel_backend|hotel_nginx"}`: Stream selector chọn các luồng log từ 2 container `hotel_backend` và `hotel_nginx`.
  - `|~ "(?i)error|exception|fatal|fail"`: Line filter dạng regex với cờ `(?i)` (không phân biệt chữ hoa, chữ thường), lọc các dòng có chứa các từ khóa báo hiệu sự cố.
- **Cách sử dụng**:
  - Dán truy vấn vào ô tìm kiếm của Grafana Explore để kiểm tra khi website gặp sự cố hoặc trả về mã lỗi 502/500.
  - Nếu hệ thống đang vận hành hoàn toàn ổn định và không có lỗi, kết quả trả về sẽ là danh sách rỗng (đây là trạng thái chuẩn bình thường).

---

### 3. Đếm số dòng log lỗi trong khoảng thời gian (Log Metric Query)
- **Mục đích**: Chuyển đổi dữ liệu log văn bản thành chuỗi dữ liệu định lượng (Time-Series Metric) để vẽ biểu đồ tần suất lỗi, đo lường tỷ lệ lỗi theo thời gian và thiết lập ngưỡng cảnh báo (Alert Rule).
- **Cú pháp LogQL**:
  ```logql
  sum(count_over_time({container=~".+"} |~ "(?i)error|exception|fatal" [5m]))
  ```
  *Hoặc phân rã số lượng lỗi theo từng container cụ thể:*
  ```logql
  sum by (container) (count_over_time({container=~"hotel_.*"} |~ "(?i)error|exception|fatal" [5m]))
  ```
- **Giải thích cú pháp**:
  - `count_over_time(... [5m])`: Hàm tập hợp đếm số lượng dòng log thỏa mãn bộ lọc regex trong khoảng trượt thời gian 5 phút (`5m`).
  - `sum(...)`: Tính tổng số dòng lỗi trên toàn bộ hệ thống.
  - `sum by (container) (...)`: Nhóm và tính tổng riêng biệt cho từng container để biết chính xác container nào đang sinh ra nhiều lỗi nhất.
- **Cách sử dụng**:
  - Thích hợp cấu hình trên các Panel kiểu **Time Series**, **Stat**, hoặc **Gauge** của Grafana Dashboard.
  - Khi xem trong Grafana Explore, Grafana sẽ tự động chuyển sang chế độ hiển thị đồ thị Graph.

---

## 💡 CÁC TRUY VẤN BỔ TRỢ HỮU ÍCH KHÁC

### 4. Xem log truy cập HTTP Access Log qua Nginx
```logql
{container="hotel_nginx"} |= "HTTP/1.1"
```
*Lọc riêng các request gọi vào Backend API:*
```logql
{container="hotel_nginx"} |= "/api/"
```

### 5. Xem log hoạt động của Cơ sở dữ liệu PostgreSQL
```logql
{container="hotel_postgres"}
```
*Lọc các thao tác liên quan đến tạo kết nối hoặc xác thực:*
```logql
{container="hotel_postgres"} |~ "(?i)connection|auth|error|fatal"
```

### 6. Xem log lỗi từ luồng standard error (`stderr`) của Backend
```logql
{container="hotel_backend", stream="stderr"}
```

---

## 🚀 HƯỚNG DẪN TRUY VẤN QUA CURL / HTTP API LOKI

Bạn cũng có thể truy vấn trực tiếp Loki từ terminal mà không cần mở trình duyệt:

```bash
# 1. Kiểm tra trạng thái sẵn sàng của Loki
curl -s http://localhost:3100/ready

# 2. Liệt kê danh sách các nhãn (labels)
curl -s http://localhost:3100/loki/api/v1/labels | jq

# 3. Liệt kê danh sách các container đang được thu thập log
curl -s http://localhost:3100/loki/api/v1/label/container/values | jq

# 4. Thực hiện truy vấn LogQL lấy 5 dòng log gần nhất
curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={container=~"hotel_.*"}' \
  --data-urlencode 'limit=5' | jq
```
