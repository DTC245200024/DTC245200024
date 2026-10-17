# Nginx Alpine nhẹ và tối ưu
FROM nginx:alpine

# Cài đặt openssl và tự động sinh chứng chỉ SSL tự ký an toàn trong container
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/selfsigned.key \
      -out /etc/nginx/ssl/selfsigned.crt \
      -subj "/C=VN/ST=TuyenQuang/L=LamBinh/O=GrandPalaceHotel/OU=IT/CN=localhost"

# Copy cấu hình reverse proxy vào thư mục cấu hình Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cổng lắng nghe
EXPOSE 80 443

# Khởi chạy Nginx
CMD ["nginx", "-g", "daemon off;"]
