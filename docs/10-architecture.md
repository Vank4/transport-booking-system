10 – System Architecture
Transport Booking System (Flight & Train)

1️⃣ Mục tiêu kiến trúc
Tài liệu này mô tả:
Kiến trúc tổng thể hệ thống
Cách các thành phần giao tiếp với nhau
Phân tách trách nhiệm giữa Frontend – Backend – Database
Các thành phần đặc biệt: Realtime Seat Hold & Payment Flow
Mục tiêu:
Chuẩn hóa kiến trúc ngay từ đầu để tránh việc mỗi người xây dựng một kiểu.

2️⃣ Kiến trúc tổng quan
Hệ thống được thiết kế theo mô hình:
Client – Server – Database

Frontend (Web App)
↓
Backend API Server
↓
PostgreSQL Database

Ngoài ra có thêm:
WebSocket Server (Realtime Seat Hold)
Payment Gateway (Momo/VNPAY/Mock)

3️⃣ Thành phần hệ thống
3.1 Frontend (Web Application)
Trách nhiệm:
Hiển thị giao diện người dùng
Gửi request đến Backend API
Quản lý state phía client
Hiển thị sơ đồ ghế realtime
Bảo vệ route theo role
Không được làm:
Không xử lý logic nghiệp vụ phức tạp
Không quyết định trạng thái ghế
Không tự tính giá cuối cùng
Frontend chỉ đóng vai trò trình bày + tương tác.

3.2 Backend API Server
Trách nhiệm:
Xử lý toàn bộ nghiệp vụ
Xác thực và phân quyền
Quản lý giữ ghế
Xử lý booking
Tích hợp thanh toán
Sinh ticket
Cập nhật trạng thái hệ thống
Backend là nơi duy nhất:
Được phép thay đổi trạng thái ghế
Được phép tạo booking
Được phép cập nhật payment status

3.3 Database (PostgreSQL + Prisma)
Vai trò:
Lưu trữ toàn bộ dữ liệu hệ thống
Đảm bảo tính toàn vẹn dữ liệu
Quản lý quan hệ giữa:
Users
Trips
Seats
Bookings
Tickets
Payments
Vouchers
Prisma ORM
Prisma là lớp trung gian giữa Backend và Database.
Mọi truy vấn DB phải thông qua Prisma.
Không được viết raw SQL nếu chưa thống nhất.

4️⃣ Kiến trúc phân lớp Backend
Backend nên được chia thành các layer:

Routes
↓
Controllers
↓
Services
↓
Prisma (Data Access Layer)
↓
Database

4.1 Routes
Định nghĩa endpoint
Gắn middleware (authenticate, authorize)

4.2 Controllers
Nhận request
Validate input
Gọi service
Trả response

4.3 Services
Chứa toàn bộ logic nghiệp vụ
Không phụ thuộc vào HTTP layer
Có thể tái sử dụng

4.4 Data Access Layer (Prisma)
Thực hiện query
Quản lý transaction
Đảm bảo atomic operation

5️⃣ Kiến trúc Realtime Seat Hold
5.1 Thành phần
HTTP API (hold seat)
WebSocket (broadcast trạng thái ghế)
Cron job (release seat)

5.2 Luồng hoạt động
User chọn ghế
FE gọi API /hold-seat
Backend:
Kiểm tra ghế còn Available
Update trạng thái → Holding
Ghi holdUntil
Broadcast qua socket
Sau 15 phút:
Nếu chưa thanh toán → release ghế

5.3 State Machine của Seat
Available
→ Holding
→ Booked
Nếu Holding hết hạn → quay lại Available

6️⃣ Kiến trúc Booking & Payment
6.1 Booking Flow
User chọn ghế
Nhập thông tin hành khách
Tạo booking tạm (Pending)
Chuyển sang thanh toán

6.2 Payment Flow
Redirect sang Payment Gateway
Gateway callback về backend
Backend verify signature
Cập nhật payment status
Nếu Success:
Seat → Booked
Sinh ticket
Gửi xác nhận
Nếu Failed:
Seat → Release

7️⃣ Transaction & Concurrency Control
Để tránh lỗi double booking:
Dùng transaction khi:
Tạo booking
Cập nhật payment
Update seat trạng thái
Seat update phải atomic
Không cho phép 2 user giữ cùng 1 ghế

8️⃣ Bảo mật hệ thống
JWT Authentication
Middleware authorize theo role
Validate input
Không trả về thông tin nhạy cảm
Hash password bằng bcrypt

9️⃣ Khả năng mở rộng
Kiến trúc hiện tại cho phép:
Tách WebSocket thành service riêng
Scale backend theo chiều ngang
Thêm loại hình vận tải mới
Tích hợp thêm payment gateway

🔟 Nguyên tắc bắt buộc
Không viết logic nghiệp vụ trong controller.
Không truy cập DB trực tiếp ngoài Prisma.
Không thay đổi schema nếu chưa cập nhật docs.
Không sửa flow payment nếu chưa cập nhật tài liệu.

📌 Kết luận
Tài liệu này định nghĩa kiến trúc chuẩn cho hệ thống:
Phân tách rõ trách nhiệm
Chuẩn hóa backend layers
Đóng khung realtime seat hold
Định nghĩa transaction booking
Mọi thành viên phải bám theo kiến trúc này khi triển khai.
