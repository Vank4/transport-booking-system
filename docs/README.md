📘 Transport Booking System – Documentation Hub

1️⃣ Mục đích của thư mục docs/
Thư mục docs/ là nguồn sự thật (Single Source of Truth) cho toàn bộ hệ thống đặt vé máy bay & tàu hỏa.
Tất cả thành viên bắt buộc phải bám theo tài liệu trong thư mục này khi:
Thiết kế Database
Viết Prisma schema
Xây dựng API
Thiết kế frontend
Thực hiện merge code
Mục tiêu chính:
Ngăn chặn việc mỗi người code theo một cách khác nhau
Giảm conflict khi merge
Đảm bảo hệ thống đúng theo file đặc tả

🧭 2️⃣ Cấu trúc tài liệu
🔹 A. Nghiệp vụ hệ thống (Business Specification)
File Mô tả
00-overview.md Tổng quan hệ thống, mục tiêu, phạm vi
01-roles-permissions.md Phân quyền User/Admin
02-functional-modules.md Module chức năng theo đặc tả
03-sitemap-pages.md Danh sách trang Client & Admin

🔹 B. Thiết kế kỹ thuật (System Design)
File Mô tả
10-architecture.md Kiến trúc FE – BE – DB
11-realtime-seat-hold.md Thiết kế giữ ghế realtime
12-payment-flow.md Flow thanh toán & trạng thái booking

🔹 C. Database (Prisma + Postgres)
📁 20-database/
File Mô tả
erd.md ERD + quan hệ giữa các bảng
data-dictionary.md Giải thích chi tiết từng bảng & field
prisma-schema-guidelines.md Quy ước viết schema.prisma
migrations.md Quy trình migrate & seed dữ liệu
⚠️ Mọi thay đổi DB bắt buộc phải:
Cập nhật docs
Tạo migration
Không được chỉnh sửa trực tiếp production schema

🔹 D. API Contract (FE ↔ BE)
📁 30-api/
File Mô tả
api-conventions.md Chuẩn response, error, pagination
endpoints-auth.md API Auth
endpoints-search-trips.md API tìm kiếm chuyến
endpoints-seat.md API giữ ghế
endpoints-booking.md API booking
endpoints-voucher.md API voucher
endpoints-admin.md API admin
⚠️ FE không được gọi API chưa có trong docs.
⚠️ BE không được thay đổi response structure khi chưa cập nhật docs.

🔹 E. Hướng dẫn phát triển
📁 40-dev-guide/
File Mô tả
setup-local.md Cách chạy local
env.md Cấu hình biến môi trường
folder-structure.md Giải thích cấu trúc repo
coding-conventions.md Quy chuẩn code
git-workflow.md Quy trình branch/merge

🔹 F. Quyết định kỹ thuật (Architecture Decision Records)
📁 90-decisions/
Các file trong thư mục này ghi lại:
Quyết định chọn Prisma + Postgres
Quy tắc modeling Booking – Ticket – Seat
Quy tắc giữ ghế (hold time, release rule)
Mục đích:
Tránh tranh luận lặp lại
Ghi nhận lý do thay đổi kiến trúc

👥 3️⃣ Phân quyền tài liệu trong team 5 người
👑 Nhóm trưởng (Lead)
Chịu trách nhiệm:
Chuẩn hóa Prisma schema
Kiểm soát API contract
Kiểm soát git workflow
Merge & review code
Cập nhật decision logs
Lead không cần code nhiều feature, nhưng phải giữ hệ thống ổn định và thống nhất.
👨‍💻 4 Thành viên còn lại
Mỗi người:
Chịu trách nhiệm module của mình
Viết docs API tương ứng
Không thay đổi DB hoặc API structure khi chưa cập nhật docs

🚨 4️⃣ Quy tắc bắt buộc để tránh conflict

1. Không ai tự tạo bảng DB theo ý mình
   Chỉ được chỉnh sửa trong schema.prisma đã được thống nhất.

2. Không thay đổi API response structure khi chưa cập nhật docs
3. Không push trực tiếp vào main
   Workflow chuẩn:
   feature/<module-name>
   → pull request vào dev
   → review
   → merge 4. Mọi thay đổi quan trọng phải cập nhật docs trước khi merge

🔄 5️⃣ Quy trình làm việc chuẩn
Xem docs trước khi code
Nếu thiếu → cập nhật docs → thảo luận
Code theo đúng schema & API contract
Tạo PR
Lead review & merge

🎯 6️⃣ Mục tiêu cuối cùng
Thư mục docs/ không phải để “cho có”.
Nó là:
Bộ khung chuẩn hóa toàn hệ thống
Công cụ giảm conflict
Cách để team làm việc chuyên nghiệp
Tài liệu bảo vệ đồ án nếu có chấm điểm
