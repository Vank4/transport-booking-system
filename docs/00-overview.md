00 – System Overview
Transport Booking System (Flight & Train)

1️⃣ Giới thiệu hệ thống
Transport Booking System là hệ thống đặt vé trực tuyến cho máy bay và tàu hỏa trên cùng một nền tảng.
Hệ thống cho phép:
Tìm kiếm chuyến bay / chuyến tàu theo tuyến và thời gian
Xem chi tiết chuyến đi và giá vé
Lựa chọn ghế trực quan theo sơ đồ
Thanh toán trực tuyến
Xuất vé điện tử (PNR / QR Code)
Quản lý và thống kê dữ liệu qua hệ thống Admin
Hệ thống được xây dựng nhằm mô phỏng mô hình thực tế của các nền tảng đặt vé thương mại.

2️⃣ Mục tiêu xây dựng hệ thống
Hệ thống được thiết kế để đáp ứng các mục tiêu sau:

🎯 2.1. Đối với người dùng (User)
Đặt vé nhanh chóng và thuận tiện
Xem tình trạng ghế theo thời gian thực
Thanh toán online an toàn
Lưu trữ và quản lý lịch sử booking
Áp dụng voucher khuyến mãi
Lưu thông tin hành khách thường xuyên

🎯 2.2. Đối với quản trị viên (Admin)
Quản lý hạ tầng vận chuyển (sân bay, ga tàu)
Quản lý hãng hàng không / công ty tàu
Tạo và quản lý lịch trình
Cấu hình ghế và giá vé
Quản lý booking
Theo dõi báo cáo doanh thu
Theo dõi tỷ lệ lấp đầy ghế

3️⃣ Phạm vi hệ thống (System Scope)
Hệ thống gồm 2 phân hệ chính:

🔹 3.1 Client System (Khách hàng)
Bao gồm các chức năng:
Đăng ký / Đăng nhập
Tìm kiếm chuyến đi
Xem kết quả tìm kiếm
Xem chi tiết chuyến đi
Chọn ghế theo sơ đồ
Nhập thông tin hành khách
Áp dụng voucher
Thanh toán
Xem danh sách booking
Xem chi tiết booking
Hủy / yêu cầu đổi vé (nếu được hỗ trợ)
Quản lý hồ sơ cá nhân

🔹 3.2 Admin System
Bao gồm các chức năng:
Dashboard thống kê
Quản lý người dùng
Quản lý sân bay / ga tàu
Quản lý hãng hàng không / tàu
Quản lý chuyến đi
Quản lý cấu hình ghế
Quản lý voucher
Quản lý booking
Báo cáo & phân tích

4️⃣ Các Module nghiệp vụ chính
Hệ thống được chia thành các module sau:
Authentication & Authorization
Infrastructure Management
Trip Management (Flights / Train Trips)
Seat & Pricing Management
Search & Booking
Payment Processing
Reporting & Analytics
Mỗi module sẽ được mô tả chi tiết trong tài liệu tiếp theo.

5️⃣ Đặc điểm nổi bật của hệ thống
🔥 5.1 Realtime Seat Hold
Khi người dùng chọn ghế, hệ thống sẽ giữ ghế trong một khoảng thời gian (ví dụ: 15 phút).
Trạng thái ghế được đồng bộ realtime cho các người dùng khác.
Nếu quá thời gian giữ mà chưa thanh toán, ghế sẽ tự động được giải phóng.
Đây là phần logic quan trọng nhất của hệ thống.

💳 5.2 Thanh toán trực tuyến
Hệ thống hỗ trợ tích hợp cổng thanh toán (ví dụ: Momo / VNPAY / Card).
Sau khi thanh toán thành công:
Tạo booking
Sinh vé (Ticket)
Cập nhật trạng thái ghế thành Booked

🚆✈ 5.3 Hỗ trợ nhiều loại hình vận tải
Hệ thống hỗ trợ:
Máy bay
Tàu hỏa
Thiết kế dữ liệu cho phép mở rộng thêm các loại hình vận tải khác trong tương lai.

6️⃣ Kiến trúc tổng quan (High-Level Architecture)
Hệ thống được thiết kế theo mô hình Client – Server.
Frontend (Web App)
⬇
Backend API Server
⬇
Database (PostgreSQL + Prisma ORM)

Frontend:
Giao diện người dùng
Gọi API
Hiển thị sơ đồ ghế realtime

Backend:
Xử lý logic nghiệp vụ
Quản lý giữ ghế
Xử lý thanh toán
Phân quyền người dùng

Database:
Lưu trữ dữ liệu hệ thống
Quan hệ giữa booking – ticket – seat – trip

7️⃣ Phạm vi không bao gồm (Out of Scope)
Để giới hạn phạm vi đồ án, hệ thống hiện không bao gồm:
Thanh toán quốc tế nâng cao
Dynamic pricing theo AI
Mobile app
Hệ thống loyalty nâng cao
Multi-language

8️⃣ Tài liệu liên quan
Các tài liệu chi tiết tiếp theo:
01-roles-permissions.md
02-functional-modules.md
03-sitemap-pages.md
20-database/erd.md
30-api/api-conventions.md
40-dev-guide/git-workflow.md

📌 Kết luận
Tài liệu này cung cấp cái nhìn tổng quan về hệ thống đặt vé máy bay và tàu hỏa.
Đây là nền tảng để toàn bộ team thống nhất:
Phạm vi chức năng
Kiến trúc tổng thể
Phân hệ Client & Admin
Trọng tâm hệ thống (Seat Hold + Booking + Payment)
Mọi triển khai kỹ thuật phải bám sát nội dung trong tài liệu này.
