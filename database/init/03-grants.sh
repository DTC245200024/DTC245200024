#!/bin/sh
# =========================================================================
# 03-grants.sh - Cấp quyền trên các bảng/sequence vừa tạo bởi 02-schema.sql.
# Backend chỉ có quyền DML (không DDL, không DROP/TRUNCATE).
# =========================================================================
set -e

psql -v ON_ERROR_STOP=1 \
     -v app_user="$APP_DB_USER" \
     --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'EOSQL'
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"app_user";
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO :"app_user";
EOSQL
