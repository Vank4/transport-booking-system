Prisma Schema Guidelines
Transport Booking System (PostgreSQL + Prisma)

1️⃣ Mục tiêu
Tài liệu này định nghĩa:
Quy tắc đặt tên model & field
Quy tắc định nghĩa relation
Quy tắc enum
Quy tắc index & unique
Quy tắc transaction
Những điều không được làm
Mọi chỉnh sửa schema.prisma phải tuân thủ tài liệu này.

2️⃣ Quy tắc đặt tên Model
2.1 Model dùng PascalCase
model User {}
model Booking {}
model Flight {}
model TrainTrip {}
model Seat {}
❌ Không dùng:
model users {}
model flight_trip {}

2.2 Tên model là số ít (singular)
✔ User
✔ Booking
✔ Ticket
❌ Users
❌ Bookings

3️⃣ Quy tắc đặt tên Field
3.1 Field dùng camelCase
fullName
departureTime
arrivalAirportId
holdUntil

3.2 Foreign key luôn kết thúc bằng Id
userId
bookingId
flightId
trainTripId

3.3 Timestamp chuẩn
Tất cả bảng phải có:
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

4️⃣ Quy tắc định nghĩa Relation
4.1 Quan hệ 1-N chuẩn
Ví dụ: User → Booking
model User {
id String @id @default(uuid())
bookings Booking[]
}
model Booking {
id String @id @default(uuid())
userId String
user User @relation(fields: [userId], references: [id])
}
Bắt buộc:
Field FK phải tồn tại
Quan hệ phải khai báo ở cả 2 phía

4.2 Quan hệ 1-1 (Booking ↔ Payment)
model Booking {
id String @id @default(uuid())
payment Payment?
}
model Payment {
id String @id @default(uuid())
bookingId String @unique
booking Booking @relation(fields: [bookingId], references: [id])
}
Bắt buộc:
@unique ở FK phía 1-1

4.3 Quan hệ Seat ↔ Ticket (chống double booking)
model Ticket {
id String @id @default(uuid())
seatId String @unique
seat Seat @relation(fields: [seatId], references: [id])
}
⚠ seatId phải @unique để đảm bảo không bán trùng ghế.

5️⃣ Quy tắc Enum
5.1 Enum đặt tên PascalCase
enum SeatStatus {
AVAILABLE
HOLDING
BOOKED
}
5.2 Enum phải đồng bộ với docs
SeatStatus phải khớp với:
11-realtime-seat-hold.md
BookingStatus phải khớp với:
12-payment-flow.md
Không được tự ý thêm enum value khi chưa cập nhật docs.

6️⃣ Quy tắc Seat Model (Quan trọng nhất)
Seat phải có đầy đủ field để hỗ trợ hold:
model Seat {
id String @id @default(uuid())
flightId String?
trainTripId String?
status SeatStatus
holdByUserId String?
holdBySessionId String?
holdUntil DateTime?
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}
Bắt buộc:
status
holdUntil
holdByUserId hoặc holdBySessionId

7️⃣ Quy tắc Index & Unique
7.1 Unique bắt buộc
User.email
Voucher.code
Ticket.seatId
Payment.bookingId

7.2 Composite index cho tìm kiếm chuyến
@@index([departureAirportId, arrivalAirportId, departureTime])

7.3 Index cho Seat query
@@index([flightId, status])
Hoặc:
@@index([trainTripId, status])

8️⃣ Quy tắc Transaction (Phải dùng trong Service Layer)
Khi xử lý:
Confirm payment
Update seat → BOOKED
Create tickets
Phải dùng:
await prisma.$transaction([...])
Không được:
Update booking rồi update seat ở 2 query riêng lẻ

9️⃣ Soft Delete (Hiện tại chưa áp dụng)
Nếu sau này áp dụng:
deletedAt DateTime?
Không được hard delete booking/ticket nếu hệ thống đã bán vé.

🔟 Những điều KHÔNG được làm
❌ Không đổi tên model khi đã có migration
❌ Không đổi enum value khi chưa cập nhật toàn hệ thống
❌ Không xóa field đã dùng trong code
❌ Không chỉnh sửa migration cũ
❌ Không để relation thiếu 1 phía

1️⃣1️⃣ Checklist trước khi commit schema.prisma
Docs đã cập nhật chưa?
Có cần unique constraint không?
Có cần index không?
Có phá vỡ flow seat hold không?
Có phá vỡ payment flow không?
Đã chạy:
npx prisma generate
npx prisma migrate dev

1️⃣2️⃣ Definition of Done (Schema Done)
Schema được coi là ổn định khi:
Không có migration conflict
ERD khớp 100%
Data Dictionary khớp 100%
Seat hold hoạt động đúng
Payment confirm không gây double booking
