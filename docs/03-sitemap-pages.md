03 – Sitemap & Pages Specification
Transport Booking System (Flight & Train)

1️⃣ Mục tiêu tài liệu
Tài liệu này mô tả:
Danh sách toàn bộ trang trong hệ thống
Phân loại Client / Admin
Chức năng chính của từng trang
Quan hệ giữa các trang theo flow đặt vé
Mục đích:
Chuẩn hóa số lượng page
Tránh thiếu page khi triển khai
Tránh trùng lặp giao diện giữa các thành viên

2️⃣ Tổng quan Sitemap
Hệ thống gồm 2 phân hệ:
Client (User-facing)
Admin (Management System)

3️⃣ Client Pages (Khách hàng)
3.1 Trang công khai (Public)

1. Home Page
   Chức năng:
   Form tìm kiếm chuyến đi
   Banner
   Thông tin giới thiệu
   Điều hướng:
   Home → Search Results

2. Search Results Page
   Chức năng:
   Hiển thị danh sách chuyến bay / tàu
   Bộ lọc (giá, thời gian, hãng)
   Sắp xếp kết quả
   Điều hướng:
   Search Results → Trip Details

3. Trip Details & Seat Map Page
   Chức năng:
   Hiển thị thông tin chuyến
   Sơ đồ ghế trực quan
   Giá vé theo hạng
   Chọn ghế
   Điều hướng:
   Trip Details → Passenger Info

3.2 Trang yêu cầu đăng nhập (Authenticated User) 4. Passenger Information Page
Chức năng:
Nhập thông tin hành khách
Chọn hành khách đã lưu
Xác nhận thông tin
Điều hướng:
Passenger Info → Checkout

5. Checkout Page
   Chức năng:
   Hiển thị tóm tắt booking
   Áp dụng voucher
   Chọn phương thức thanh toán
   Điều hướng:
   Checkout → Payment Gateway

6. Payment Result Page
   Trường hợp:
   Thanh toán thành công
   Thanh toán thất bại
   Hiển thị:
   Mã booking (PNR)
   Thông tin vé
   QR Code

7. My Bookings Page
   Chức năng:
   Danh sách booking của user
   Bộ lọc theo trạng thái:
   Pending
   Paid
   Cancelled
   Điều hướng:
   My Bookings → Booking Details

8. Booking Details Page
   Chức năng:
   Chi tiết chuyến đi
   Thông tin hành khách
   Trạng thái thanh toán
   Nút yêu cầu hủy / đổi (nếu có)

9. User Profile Page
   Chức năng:
   Cập nhật thông tin cá nhân
   Đổi mật khẩu

10. Frequent Passengers Page
    Chức năng:
    Thêm hành khách thường xuyên
    Sửa / xóa hành khách

4️⃣ Authentication Pages 11. Login Page
Chức năng:
Đăng nhập
Redirect sau login

12. Register Page
    Chức năng:
    Tạo tài khoản mới

5️⃣ Admin Pages
Admin system có thể tách riêng route: /admin

5.1 Dashboard 13. Admin Dashboard
Hiển thị:
Tổng booking
Doanh thu
Tỷ lệ lấp đầy ghế
Biểu đồ theo thời gian

5.2 Infrastructure Management 14. Airlines Management Page 15. Airports Management Page 16. Trains Management Page 17. Train Stations Management Page 18. Train Carriages Management Page
Chức năng:
CRUD dữ liệu
Tìm kiếm
Phân trang

5.3 Trip Management 19. Flights Management Page 20. Train Trips Management Page
Chức năng:
Tạo / sửa / xóa chuyến
Cập nhật trạng thái
Thiết lập giá

5.4 Seat & Pricing Configuration 21. Seat Configuration Page
Chức năng:
Cấu hình sơ đồ ghế
Thiết lập hạng ghế
Cập nhật giá theo hạng

5.5 Voucher Management 22. Voucher Management Page
Chức năng:
Tạo voucher
Giới hạn số lượng
Thiết lập ngày hết hạn

5.6 Booking Management 23. Booking Management Page
Chức năng:
Xem toàn bộ booking
Hủy booking
Hoàn tiền thủ công

5.7 Reporting & Analytics 24. Revenue Report Page 25. Occupancy Report Page
Hiển thị:
Doanh thu theo ngày/tháng
Tỷ lệ lấp đầy ghế
Thống kê theo tuyến

6️⃣ Tổng số trang
Client:
12 trang
Admin:
13 trang
Tổng cộng:
25 trang
Phù hợp yêu cầu tối thiểu ≥ 20 trang.

7️⃣ Flow tổng thể đặt vé
Home
→ Search Results
→ Trip Details
→ Passenger Info
→ Checkout
→ Payment
→ Success Page
→ My Bookings

8️⃣ Nguyên tắc triển khai
Không được tự ý thêm page mới nếu chưa cập nhật tài liệu.
Mọi page phải có API tương ứng trong 30-api/.
Mọi page phải có route rõ ràng trong frontend.
Admin page phải được bảo vệ bằng role ADMIN.

📌 Kết luận
Tài liệu này chuẩn hóa:
Toàn bộ danh sách trang hệ thống
Phân chia Client / Admin rõ ràng
Đảm bảo không thiếu giao diện khi triển khai
Là cơ sở để phân công công việc cho 4 thành viên
