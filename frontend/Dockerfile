# ==========================================
# STAGE 1: Build mã nguồn React Vite
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy source code và build
COPY . .

ARG VITE_API_URL=http://localhost:5001/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ==========================================
# STAGE 2: Phục vụ Web tĩnh (Production)
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Cài đặt công cụ phục vụ web tĩnh serve
RUN npm install -g serve

# Lấy sản phẩm build từ stage 1 và phân quyền cho user node
COPY --from=builder /app/dist ./dist
RUN chown -R node:node /app

# Chuyển sang user non-root
USER node

EXPOSE 5173

# Chạy web server phục vụ Single Page Application trên cổng 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
