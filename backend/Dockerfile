# Base image Node.js 20 Alpine nhẹ và tối ưu
FROM node:20-alpine

# Thư mục làm việc
WORKDIR /app

# Cài đặt dependencies trước để tối ưu Docker layer cache
COPY package*.json ./
RUN npm install --omit=dev

# Copy toàn bộ mã nguồn backend
COPY . .

# Đảm bảo thư mục lưu trữ dữ liệu và ảnh QR tồn tại
RUN mkdir -p data uploads/qr

# Cổng backend lắng nghe
EXPOSE 5001

# Lệnh khởi chạy
CMD ["node", "server.js"]
