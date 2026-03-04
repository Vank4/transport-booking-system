02 – Functional Modules Specification
Transport Booking System (Flight & Train)

1️⃣ Module 1: Authentication & Authorization
1.1 Mục tiêu
Quản lý tài khoản người dùng và phân quyền hệ thống.

1.2 Chức năng chính
Đối với User
Đăng ký tài khoản
Đăng nhập
Đăng xuất
Xem / cập nhật hồ sơ cá nhân
Lưu hành khách thường xuyên
Đối với Admin
Đăng nhập hệ thống quản trị
Quản lý role người dùng
Khóa / mở khóa tài khoản

1.3 Luồng xử lý
Đăng ký
User nhập email + password
Validate dữ liệu
Hash password
Lưu vào bảng Users
Trả về token (nếu auto login)
Đăng nhập
Kiểm tra email tồn tại
So sánh mật khẩu
Sinh JWT
Trả access token

1.4 Dữ liệu liên quan
Users
Roles

2️⃣ Module 2: Infrastructure Management
2.1 Mục tiêu
Quản lý hạ tầng vận chuyển cho cả máy bay và tàu hỏa.

2.2 Thành phần
Máy bay
Airlines
Airports
Tàu hỏa
Trains
Train Stations
Train Carriages

2.3 Chức năng Admin
Tạo / sửa / xóa hãng
Tạo / sửa / xóa sân bay / ga tàu
Cấu hình toa tàu

2.4 Dữ liệu liên quan
airlines
airports
trains
train_stations
train_carriages

3️⃣ Module 3: Trip Management (Flights & Train Trips)
3.1 Mục tiêu
Quản lý lịch trình chuyến bay và chuyến tàu.

3.2 Chức năng Admin
Tạo chuyến bay
Tạo chuyến tàu
Thiết lập:
Điểm đi
Điểm đến
Thời gian khởi hành
Thời gian đến
Giá cơ bản
Cập nhật trạng thái:
Scheduled
Delayed
Cancelled

3.3 Chức năng User
Xem danh sách chuyến
Xem chi tiết chuyến

3.4 Dữ liệu liên quan
flights
train_trips

4️⃣ Module 4: Seat & Pricing Management
4.1 Mục tiêu
Quản lý sơ đồ ghế và trạng thái ghế theo thời gian thực.

4.2 Thành phần
Seat Map
Seat Class (Economy, Business...)
Giá vé theo hạng

4.3 Trạng thái ghế
Available
Holding
Booked

4.4 Quy tắc giữ ghế
Khi user chọn ghế → hệ thống chuyển trạng thái sang Holding
Ghi nhận:
holdBy (userId)
holdUntil (timestamp)
Broadcast qua socket
Nếu quá thời gian mà chưa thanh toán → tự động release

4.5 Dữ liệu liên quan
seats
bookings
tickets

5️⃣ Module 5: Search & Booking
5.1 Mục tiêu
Cho phép người dùng tìm kiếm và đặt vé.

5.2 Luồng đặt vé chuẩn
User tìm chuyến
Chọn chuyến
Chọn ghế
Nhập thông tin hành khách
Áp dụng voucher (nếu có)
Xác nhận thông tin
Thanh toán

5.3 Quy tắc booking
Booking chỉ được tạo khi thanh toán thành công
Mỗi booking có thể có nhiều ticket
Mỗi ticket gắn với một seat

5.4 Dữ liệu liên quan
bookings
tickets
vouchers

6️⃣ Module 6: Payment Processing
6.1 Mục tiêu
Xử lý thanh toán và cập nhật trạng thái booking.

6.2 Trạng thái Payment
Pending
Success
Failed
Refunded

6.3 Luồng thanh toán
Tạo booking tạm (Pending)
Redirect sang cổng thanh toán
Nhận callback
Xác minh chữ ký
Cập nhật payment status
Nếu thành công:
Cập nhật seat → Booked
Sinh ticket
Gửi email xác nhận

6.4 Dữ liệu liên quan
payments
bookings
tickets

7️⃣ Module 7: Reporting & Analytics
7.1 Mục tiêu
Cung cấp báo cáo cho Admin.

7.2 Chức năng
Tổng doanh thu theo:
Ngày
Tháng
Tuyến đường
Tỷ lệ lấp đầy ghế
Thống kê số lượng booking

7.3 Dữ liệu sử dụng
bookings
payments
flights
train_trips

8️⃣ Quan hệ giữa các Module
Authentication
⬇
Search
⬇
Trip
⬇
Seat Hold
⬇
Booking
⬇
Payment
⬇
Reporting

9️⃣ Nguyên tắc triển khai
Không thay đổi logic module nếu chưa cập nhật docs.
Không thay đổi quan hệ DB nếu chưa thống nhất.
Không thay đổi API contract khi chưa cập nhật tài liệu.
Module phải độc lập, tránh phụ thuộc chéo không cần thiết.

🔟 Kết luận
Tài liệu này mô tả toàn bộ module nghiệp vụ chính của hệ thống:
Xác thực
Hạ tầng
Chuyến đi
Ghế & giá
Tìm kiếm & đặt vé
Thanh toán
Báo cáo

Tất cả các thành viên phải bám sát nội dung này khi triển khai chức năng.
