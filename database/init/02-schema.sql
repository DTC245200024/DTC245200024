-- =========================================================================
-- 02-schema.sql - Schema PostgreSQL cho Hệ thống Đặt phòng Khách sạn
-- Chạy tự động một lần bởi docker-entrypoint-initdb.d (sau 01-roles.sh).
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;  -- dùng cho ràng buộc chống đặt trùng phòng

-- -------------------------------------------------------------------------
-- Sequence sinh mã định danh dạng chuỗi (USR-1001, STAFF-101, RM-101)
-- (Dùng sequence thay vì COUNT(*)+1 để không bị trùng mã khi có xóa bản ghi.)
-- -------------------------------------------------------------------------
CREATE SEQUENCE user_id_seq  START WITH 1001;
CREATE SEQUENCE staff_id_seq START WITH 101;
CREATE SEQUENCE room_id_seq  START WITH 101;

-- -------------------------------------------------------------------------
-- 1. USERS: tài khoản Quản trị viên / Lễ tân / Khách hàng
-- -------------------------------------------------------------------------
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  name          TEXT        NOT NULL CHECK (btrim(name) <> ''),
  email         TEXT        NOT NULL CHECK (email = lower(btrim(email)) AND email <> ''),
  phone         TEXT        NOT NULL CHECK (btrim(phone) <> ''),
  password_hash TEXT        NOT NULL CHECK (password_hash <> ''),
  role          TEXT        NOT NULL DEFAULT 'CUSTOMER'
                CHECK (role IN ('ADMIN', 'STAFF', 'CUSTOMER')),
  status        TEXT        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'locked')),
  department    TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_phone_key UNIQUE (phone)
);
CREATE INDEX users_role_idx ON users (role);

-- -------------------------------------------------------------------------
-- 2. ROOMS: danh mục phòng khách sạn
-- -------------------------------------------------------------------------
CREATE TABLE rooms (
  seq         BIGINT GENERATED ALWAYS AS IDENTITY,  -- giữ thứ tự hiển thị theo thời điểm thêm
  id          TEXT PRIMARY KEY,
  room_code   TEXT        NOT NULL CHECK (btrim(room_code) <> ''),
  name        TEXT        NOT NULL CHECK (btrim(name) <> ''),
  type        TEXT        NOT NULL CHECK (btrim(type) <> ''),
  price       BIGINT      NOT NULL CHECK (price >= 0),        -- VND / đêm
  max_guests  INTEGER     NOT NULL DEFAULT 2 CHECK (max_guests > 0),
  capacity    INTEGER     CHECK (capacity IS NULL OR capacity > 0),
  status      TEXT        NOT NULL DEFAULT 'Trống'
              CHECK (status IN ('Trống', 'Đã đặt', 'Đang giữ chỗ', 'Đang sử dụng',
                                'Đang dọn dẹp', 'Đang bảo trì', 'Bảo trì')),
  floor       INTEGER     NOT NULL DEFAULT 1,
  size        TEXT        NOT NULL DEFAULT '30m²',
  bed         TEXT        NOT NULL DEFAULT '1 Giường đôi',
  view_type   TEXT        NOT NULL DEFAULT 'Hướng phố',
  image       TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  amenities   TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rooms_room_code_key UNIQUE (room_code)
);
CREATE INDEX rooms_seq_idx ON rooms (seq);
CREATE INDEX rooms_type_idx ON rooms (type);

-- -------------------------------------------------------------------------
-- 3. BOOKINGS: đơn đặt phòng
--   * user_id -> users(id): xóa tài khoản thì đơn vẫn giữ lại (SET NULL).
--   * room_id -> rooms(id): xóa phòng thì lịch sử đơn vẫn giữ lại (SET NULL),
--     room_code/room_name/room_type là bản chụp thông tin phòng lúc đặt.
--   * Ràng buộc EXCLUDE bên dưới bảo đảm DB không bao giờ có 2 đơn "đang
--     chiếm phòng" trùng khoảng ngày trên cùng một phòng.
-- -------------------------------------------------------------------------
CREATE TABLE bookings (
  booking_code            TEXT PRIMARY KEY CHECK (booking_code ~ '^BK-[0-9]{4}-[0-9]+$'),
  user_id                 TEXT REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
  customer_name           TEXT        NOT NULL CHECK (btrim(customer_name) <> ''),
  phone                   TEXT        NOT NULL CHECK (btrim(phone) <> ''),
  email                   TEXT        NOT NULL CHECK (btrim(email) <> ''),
  room_id                 TEXT REFERENCES rooms (id) ON UPDATE CASCADE ON DELETE SET NULL,
  room_code               TEXT,
  room_name               TEXT        NOT NULL DEFAULT 'Phòng khách sạn',
  room_type               TEXT        NOT NULL DEFAULT 'Phòng tiêu chuẩn',
  check_in                DATE        NOT NULL,
  check_out               DATE        NOT NULL,
  nights                  INTEGER     NOT NULL CHECK (nights >= 1),
  guests                  INTEGER     NOT NULL DEFAULT 1 CHECK (guests >= 1),
  room_price              BIGINT      NOT NULL CHECK (room_price >= 0),
  total_price             BIGINT      NOT NULL CHECK (total_price >= 0),
  payment_method          TEXT        NOT NULL DEFAULT 'cash'
                          CHECK (payment_method IN ('cash', 'bank_transfer')),
  payment_status          TEXT        NOT NULL DEFAULT 'Chưa thanh toán'
                          CHECK (payment_status IN ('Chưa thanh toán', 'Chờ xác nhận chuyển khoản', 'Đã thanh toán')),
  status                  TEXT        NOT NULL DEFAULT 'Chờ xác nhận'
                          CHECK (status IN ('Chờ xác nhận', 'Đã xác nhận', 'Đã nhận phòng',
                                            'Khách yêu cầu trả phòng', 'Đã trả phòng', 'Đã hủy')),
  check_in_status         TEXT        NOT NULL DEFAULT 'Chưa nhận phòng'
                          CHECK (check_in_status IN ('Chưa nhận phòng', 'Đã nhận phòng')),
  check_out_status        TEXT        NOT NULL DEFAULT 'Chưa trả phòng'
                          CHECK (check_out_status IN ('Chưa trả phòng', 'Chờ lễ tân xác nhận', 'Đã trả phòng')),
  special_requests        TEXT        NOT NULL DEFAULT '',
  confirmed_at            TIMESTAMPTZ,
  confirmed_by            TEXT,
  actual_check_in_time    TIMESTAMPTZ,
  checked_in_by           TEXT,
  actual_check_out_time   TIMESTAMPTZ,
  checked_out_by          TEXT,
  paid_at                 TIMESTAMPTZ,
  payment_confirmed_by    TEXT,
  cancelled_at            TIMESTAMPTZ,
  cancelled_by            TEXT,
  cancel_reason           TEXT,
  checkout_requested_at   TIMESTAMPTZ,
  checkout_requested_date DATE,
  early_checkout_reason   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookings_dates_check CHECK (check_out > check_in),
  CONSTRAINT bookings_no_room_overlap
    EXCLUDE USING gist (
      room_id WITH =,
      daterange(check_in, check_out, '[)') WITH &&
    )
    WHERE (room_id IS NOT NULL
           AND status IN ('Đã xác nhận', 'Đã nhận phòng', 'Khách yêu cầu trả phòng'))
);
CREATE INDEX bookings_user_idx    ON bookings (user_id);
CREATE INDEX bookings_room_idx    ON bookings (room_id, check_in, check_out);
CREATE INDEX bookings_status_idx  ON bookings (status);
CREATE INDEX bookings_email_idx   ON bookings (lower(email));
CREATE INDEX bookings_phone_idx   ON bookings (phone);
CREATE INDEX bookings_created_idx ON bookings (created_at DESC);
