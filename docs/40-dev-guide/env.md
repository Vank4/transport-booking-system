Environment Setup (env.md)
Transport Booking System (Flight & Train)

1️⃣ Mục tiêu
Tài liệu này hướng dẫn:
Cài đặt môi trường chạy dự án (BE + FE + DB)
Thiết lập biến môi trường .env
Quy tắc bảo mật env trong team
Checklist để chạy dự án lần đầu
Không dùng bảng, trình bày dạng bullet để copy không lỗi format.

2️⃣ Yêu cầu cài đặt (Prerequisites)
Cần có:
Node.js: khuyến nghị 18+ hoặc 20+
npm hoặc pnpm (team thống nhất 1 cái)
PostgreSQL (local) hoặc Docker Desktop (khuyến nghị dùng Docker)
Git
VSCode (khuyến nghị)
Khuyến nghị cài thêm:
Postman
Prisma VSCode extension
ESLint extension
Prettier extension

3️⃣ Quy ước quản lý env trong repo
Bắt buộc:
Không commit file .env
Repo phải có file mẫu:
.env.example cho Backend
.env.example cho Frontend
Gitignore phải có:
.env
.env.\*
\*.local

4️⃣ Environment Variables (Backend)
Vị trí khuyến nghị:
backend/.env
backend/.env.example

4.1 Backend .env.example (mẫu)

# App

NODE_ENV=development
PORT=3000

# Database (Postgres)

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/transport_booking?schema=public"

# JWT

JWT_SECRET="change_me"
JWT_EXPIRES_IN="1h"

# CORS

CORS_ORIGIN="http://localhost:5173"

# Seat Hold

SEAT_HOLD_TTL_MINUTES=15

# Payment (Gateway)

PAYMENT_PROVIDER="MOCK" # MOCK | VNPAY | MOMO
PAYMENT_RETURN_URL="http://localhost:5173/payment/return"
PAYMENT_WEBHOOK_SECRET="change_me"

# Logging

LOG_LEVEL="info"

4.2 Ý nghĩa các biến quan trọng
NODE_ENV
→ development / test / production
PORT
→ cổng backend
DATABASE_URL
→ Prisma dùng biến này để connect DB
JWT_SECRET
→ secret ký token, tuyệt đối không commit
CORS_ORIGIN
→ FE domain được phép gọi API
SEAT_HOLD_TTL_MINUTES
→ TTL giữ ghế đồng bộ với 11-realtime-seat-hold.md
PAYMENT_PROVIDER
→ chọn cổng thanh toán (MOCK để dev)
PAYMENT_WEBHOOK_SECRET
→ verify webhook callback (gateway → backend)

5️⃣ Environment Variables (Frontend)
Vị trí khuyến nghị:
frontend/.env
frontend/.env.example

5.1 Frontend .env.example
VITE_API_BASE_URL="http://localhost:3000"
VITE_SOCKET_URL="http://localhost:3000"
VITE_APP_NAME="Transport Booking"

5.2 Quy tắc Frontend env
FE chỉ dùng env bắt đầu bằng:
VITE\_ (nếu dùng Vite)
Không hardcode baseUrl trong code

6️⃣ Setup DB nhanh (2 cách)
Cách A (Khuyến nghị) – Docker Postgres
Ví dụ docker-compose.yml tối giản (đặt ở root hoặc backend):
version: "3.8"
services:
postgres:
image: postgres:15
container_name: transport_booking_postgres
environment:
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres
POSTGRES_DB: transport_booking
ports: - "5432:5432"
volumes: - pgdata:/var/lib/postgresql/data
volumes:
pgdata:
Run:
docker compose up -
Cách B – Cài Postgres local
Tạo database: transport_booking
Username/password theo DATABASE_URL

7️⃣ Chạy dự án lần đầu (First Run Checklist)
7.1 Backend
Tạo file env:
copy backend/.env.example → backend/.env
Cài dependencies:
cd backend
npm i
Prisma generate:
npx prisma generate
Migrate database:
npx prisma migrate dev
Chạy backend:
npm run dev
Backend chạy tại:
http://localhost:3000

7.2 Frontend
Tạo env:
copy frontend/.env.example → frontend/.env
Cài dependencies:
cd frontend
npm i
Chạy FE:
npm run dev
Frontend chạy tại:
http://localhost:5173

8️⃣ Quy tắc bảo mật env (Team Rules)
Không gửi .env lên GitHub
Không paste JWT_SECRET hoặc DATABASE_URL thật vào Jira/Docs public
Nếu lỡ commit secret:
rotate secret ngay
xóa khỏi history (lead xử lý)

9️⃣ Troubleshooting nhanh
Prisma không connect DB
Kiểm tra Postgres đã chạy chưa
Kiểm tra DATABASE_URL đúng chưa
Kiểm tra port 5432 có bị app khác chiếm không
CORS blocked
Kiểm tra CORS_ORIGIN trùng domain FE chưa
Nếu FE chạy port khác (5174) phải update CORS_ORIGIN
Token invalid
Kiểm tra JWT_SECRET giữa các máy dev (nên giống nhau nếu muốn share token)
Restart server sau khi đổi env
Seat hold countdown lệch
FE phải dùng serverTime trong API seat map
Không dùng đồng hồ máy client làm chuẩn

🔟 Kết luận
Nếu team setup đúng theo tài liệu này:
DB sync ổn định
Prisma migration ít lỗi
FE/BE chạy đồng nhất
Lead merge nhẹ hơn
