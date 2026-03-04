Setup Local Development
Transport Booking System

1️⃣ Mục tiêu
Tài liệu này hướng dẫn:
Clone project
Cài đặt backend
Cài đặt frontend
Setup database
Chạy Prisma migration
Test API bằng Postman
Kiểm tra seat realtime hoạt động
Một thành viên mới phải setup được trong < 30 phút.

2️⃣ Bước 1 – Clone repository
git clone <repo-url>
cd transport-booking
Sau đó kiểm tra cấu trúc:
backend/
frontend/
docs/
docker-compose.yml

3️⃣ Bước 2 – Setup Database
Có 2 cách.
Cách A (Khuyến nghị) – Dùng Docker
Chạy:
docker compose up -d
Kiểm tra container:
docker ps
Database sẽ chạy ở:
host: localhost
port: 5432
user: postgres
password: postgres
db: transport_booking
Cách B – Cài Postgres local
Tạo database:
transport_booking
Cập nhật DATABASE_URL trong backend/.env.

4️⃣ Bước 3 – Setup Backend
4.1 Tạo file env
cd backend
cp .env.example .env
Kiểm tra biến:
DATABASE_URL
JWT_SECRET
SEAT_HOLD_TTL_MINUTES

4.2 Cài dependency
npm install

4.3 Prisma generate
npx prisma generate

4.4 Chạy migration
npx prisma migrate dev
Nếu thành công sẽ thấy:
Database tables được tạo
Thư mục prisma/migrations có file mới

4.5 Seed dữ liệu (nếu có)
npx prisma db seed
Seed nên tạo:
Airports
Airlines
Train stations
1-2 flights
1-2 train trips
Seat map cho mỗi trip

4.6 Chạy backend
npm run dev
Backend chạy tại:
http://localhost:3000

5️⃣ Bước 4 – Setup Frontend
5.1 Tạo env
cd ../frontend
cp .env.example .env
Kiểm tra:
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000

5.2 Cài dependency
npm install

5.3 Chạy frontend
npm run dev
Frontend chạy tại:
http://localhost:5173

6️⃣ Bước 5 – Kiểm tra hệ thống hoạt động
6.1 Test API
Mở Postman:
Import file postman-collection.json
Login
Test:
Search flights
Get seat map
Hold seat
Create booking
Mock confirm payment
6.2 Test Realtime Seat
Mở 2 trình duyệt:
Cùng mở 1 trip
Chọn cùng 1 ghế
Chỉ 1 người hold được
Người còn lại nhận 409 hoặc thấy ghế chuyển HOLDING
Nếu hoạt động đúng → realtime OK.

7️⃣ Common Errors & Fix
Lỗi Prisma không connect DB
Kiểm tra Docker chạy chưa
Kiểm tra DATABASE_URL
Kiểm tra port 5432
Lỗi CORS
Kiểm tra CORS_ORIGIN trong backend .env
Restart backend sau khi sửa
Lỗi JWT invalid
Kiểm tra JWT_SECRET
Restart backend
Lỗi migration conflict
Chạy:
git pull origin develop
npx prisma migrate dev
Không tự sửa file migration cũ.

8️⃣ Reset Local Database (Khi cần)
Nếu DB lỗi nặng:
npx prisma migrate reset
Lệnh này:
Xóa toàn bộ dữ liệu
Chạy lại migration
Chạy lại seed
Chỉ dùng trong môi trường local.

9️⃣ Checklist hoàn tất setup
Một dev được coi là setup thành công khi:
Backend chạy không lỗi
Frontend gọi được API
Search trả dữ liệu
Seat hold hoạt động
Tạo booking được
Payment mock confirm thành công

🔟 Quy tắc khi làm việc local
Luôn pull develop trước khi bắt đầu
Không tự sửa migration của người khác
Không commit .env
Nếu thay đổi schema → phải tạo migration
