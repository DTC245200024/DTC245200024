#!/bin/sh
# =========================================================================
# 01-roles.sh - Tạo các role PostgreSQL theo nguyên tắc đặc quyền tối thiểu.
# Chạy tự động MỘT LẦN khi volume pg_data còn trống (docker-entrypoint-initdb.d).
#
#   POSTGRES_USER (DB_USER)  : chủ sở hữu schema, dùng cho pgAdmin/quản trị.
#   APP_DB_USER              : backend, chỉ có quyền SELECT/INSERT/UPDATE/DELETE.
#   EXPORTER_DB_USER         : postgres-exporter, chỉ có quyền đọc số liệu (pg_monitor).
#
# Mật khẩu được truyền qua biến môi trường (docker-compose / .env), KHÔNG ghi cứng.
# =========================================================================
set -e

: "${APP_DB_USER:?APP_DB_USER chưa được cấu hình}"
: "${APP_DB_PASSWORD:?APP_DB_PASSWORD chưa được cấu hình}"
: "${EXPORTER_DB_USER:?EXPORTER_DB_USER chưa được cấu hình}"
: "${EXPORTER_DB_PASSWORD:?EXPORTER_DB_PASSWORD chưa được cấu hình}"

# Dùng biến psql (-v) để quote định danh/chuỗi an toàn, tránh SQL injection từ giá trị env.
psql -v ON_ERROR_STOP=1 \
     -v app_user="$APP_DB_USER" -v app_pw="$APP_DB_PASSWORD" \
     -v exp_user="$EXPORTER_DB_USER" -v exp_pw="$EXPORTER_DB_PASSWORD" \
     -v dbname="$POSTGRES_DB" \
     --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'EOSQL'
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_pw'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

CREATE ROLE :"exp_user" LOGIN PASSWORD :'exp_pw'
  NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT pg_monitor TO :"exp_user";

-- Chỉ các role được cấp quyền mới kết nối được vào database nghiệp vụ.
REVOKE ALL ON DATABASE :"dbname" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"dbname" TO :"app_user", :"exp_user";
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO :"app_user";
EOSQL
