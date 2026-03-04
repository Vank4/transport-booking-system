Database Documentation Hub
20-database/

1️⃣ Mục đích của thư mục này
Thư mục 20-database/ là nguồn sự thật duy nhất (Single Source of Truth) liên quan đến:
Mô hình dữ liệu hệ thống
Quan hệ giữa các bảng
Quy ước viết schema.prisma
Quy trình migration
Quy tắc thay đổi database
Đây là khu vực quan trọng nhất của dự án vì:
90% conflict khi merge đến từ schema và migration.
Mọi thay đổi database phải được kiểm soát thông qua tài liệu trong thư mục này.

2️⃣ Công nghệ sử dụng
Database: PostgreSQL
ORM: Prisma
Migration tool: Prisma Migrate
Toàn bộ truy vấn database phải đi qua Prisma.
Không được:
Tạo bảng trực tiếp trên DB production
Sửa migration đã commit
Viết raw SQL tùy tiện (trừ khi có quyết định rõ ràng)

3️⃣ Cấu trúc thư mục
20-database/
README.md
erd.md
data-dictionary.md
prisma-schema-guidelines.md
migrations.md

4️⃣ Vai trò của từng file
📌 erd.md
Chứa:
Sơ đồ ERD tổng thể
Quan hệ giữa các entity chính:
Users
Roles
Flights
TrainTrips
Seats
Bookings
Tickets
Payments
Vouchers
ERD phải khớp hoàn toàn với schema.prisma.
📌 data-dictionary.md
Giải thích chi tiết:
Mỗi bảng
Mỗi field
Kiểu dữ liệu
Ý nghĩa nghiệp vụ
Ràng buộc quan trọng
Ví dụ:
Seat.status
Enum: AVAILABLE | HOLDING | BOOKED
Ý nghĩa: Trạng thái ghế trong hệ thống realtime
📌 prisma-schema-guidelines.md
Định nghĩa chuẩn:
Quy tắc đặt tên Model
Quy tắc đặt tên field
Quan hệ 1-1, 1-n, n-n
Enum definition
Index & unique constraint
Soft delete (nếu có)
Transaction pattern
Mọi thành viên phải tuân theo tài liệu này khi sửa schema.prisma.
📌 migrations.md
Định nghĩa:
Cách tạo migration
Cách đặt tên migration
Quy tắc seed dữ liệu
Cách xử lý migration conflict
Quy trình deploy DB

5️⃣ Nguyên tắc thay đổi Database
🔒 Rule 1: Không sửa schema khi chưa cập nhật docs
Trình tự bắt buộc:
Cập nhật data-dictionary.md
Cập nhật erd.md (nếu thay đổi quan hệ)
Sửa schema.prisma
Tạo migration
Test local
Commit tất cả (docs + migration)
🔒 Rule 2: Không sửa migration cũ đã commit
Nếu migration sai:
Tạo migration mới để sửa
Không chỉnh sửa file migration cũ
Không force push sửa migration
🔒 Rule 3: Chỉ một người chỉnh sửa schema tại một thời điểm
Vì schema.prisma rất dễ conflict.
Nếu nhiều người cần sửa:
Tạo branch riêng
Merge tuần tự
Lead review kỹ trước khi merge
🔒 Rule 4: Pull trước khi migrate
Trước khi chạy:
npx prisma migrate dev
Bắt buộc:
git pull
npx prisma generate

6️⃣ Các nhóm bảng chính của hệ thống
Authentication
Users
Roles
Infrastructure
Airlines
Airports
Trains
TrainStations
TrainCarriages
Trips
Flights
TrainTrips
Seat & Booking
Seats
Bookings
Tickets
Payments
Vouchers

7️⃣ Liên hệ với các module khác
Database phải hỗ trợ đầy đủ:

11-realtime-seat-hold.md
→ Seat cần có: status, holdUntil, holdByUserId

12-payment-flow.md
→ Transaction: booking → PAID, payment → SUCCESS, seat → BOOKED
02-functional-modules.md
→ Entity phải phản ánh đúng nghiệp vụ
Nếu có thay đổi nghiệp vụ → phải cập nhật lại DB docs.

8️⃣ Quy trình chuẩn khi thay đổi DB
Cập nhật docs
↓
Sửa schema.prisma
↓
Tạo migration
↓
Test local
↓
Commit docs + migration
↓
Tạo PR
↓
Lead review
Không được bỏ qua bước nào.

9️⃣ Definition of Done (Database ổn định)
Database được coi là ổn định khi:
ERD khớp 100% với schema
Không còn migration conflict
Realtime seat hold hoạt động đúng
Payment transaction không gây double booking
Quan hệ giữa Booking – Ticket – Seat nhất quán

🔟 Kết luận
Thư mục 20-database/ là nền móng kỹ thuật của toàn bộ hệ thống.
Nếu phần này được chuẩn hóa tốt:
Merge sẽ nhẹ
Conflict giảm mạnh
Booking & Payment sẽ không lỗi logic
Lead không phải resolve migration cả buổi
