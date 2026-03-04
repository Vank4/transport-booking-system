API Documentation Hub
30-api/

1️⃣ Mục tiêu
Thư mục 30-api/ là nơi định nghĩa toàn bộ:
Chuẩn API (API Contract)
Cấu trúc response & error
Danh sách endpoint theo module
Quy tắc versioning
Quy tắc pagination & filtering
Đây là nguồn sự thật duy nhất cho giao tiếp giữa:
Frontend ↔ Backend
⚠ FE không được gọi API chưa được định nghĩa trong thư mục này.
⚠ BE không được thay đổi response structure khi chưa cập nhật docs.

2️⃣ Cấu trúc thư mục
30-api/
README.md
api-conventions.md
endpoints-auth.md
endpoints-search-trips.md
endpoints-seat.md
endpoints-booking.md
endpoints-voucher.md
endpoints-admin.md

3️⃣ Nguyên tắc thiết kế API
3.1 RESTful Convention
Dùng HTTP method đúng mục đích:
GET → lấy dữ liệu
POST → tạo mới
PATCH → cập nhật một phần
PUT → cập nhật toàn bộ
DELETE → xóa

3.2 URL phải rõ ràng
✔ Ví dụ đúng:
GET /api/flights
GET /api/flights/{id}
POST /api/bookings
POST /api/seats/hold
❌ Ví dụ sai:
POST /api/getFlights
POST /api/updateSeatStatus

3.3 Không nhúng logic vào URL
❌ Sai:
/api/payments/success/123
✔ Đúng:
GET /api/bookings/{id}

4️⃣ Chuẩn Response Structure (Bắt buộc)
Tất cả API phải trả về theo format chung:
{
"success": true,
"data": {},
"message": "Optional message",
"errors": null
}
4.1 Success Response
{
"success": true,
"data": {
"id": "booking-id",
"status": "PAID"
},
"message": "Booking confirmed",
"errors": null
}
4.2 Error Response
{
"success": false,
"data": null,
"message": "Seat already booked",
"errors": {
"code": "SEAT_NOT_AVAILABLE"
}
}

5️⃣ HTTP Status Code chuẩn
Status Khi nào dùng
200 Thành công
201 Tạo mới thành công
400 Bad request
401 Chưa đăng nhập
403 Không có quyền
404 Không tìm thấy
409 Conflict (ví dụ seat đã bị giữ)
410 Seat hold expired
500 Lỗi hệ thống

6️⃣ Phân nhóm API theo module
🔐 Authentication
File: endpoints-auth.md
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
PATCH /api/auth/profile
🔍 Search & Trips
File: endpoints-search-trips.md
GET /api/flights
GET /api/train-trips
GET /api/flights/{id}
GET /api/train-trips/{id}
💺 Seat Hold (Realtime)
File: endpoints-seat.md
GET /api/trips/{id}/seats
POST /api/seats/hold
POST /api/seats/release
Phải tuân theo tài liệu:
11-realtime-seat-hold.md
🎟 Booking & Payment
File: endpoints-booking.md
POST /api/bookings
GET /api/bookings/{id}
GET /api/users/me/bookings
POST /api/payments/callback
Phải tuân theo:
12-payment-flow.md
🎁 Voucher
File: endpoints-voucher.md
POST /api/vouchers/apply
CRUD admin voucher
🛠 Admin
File: endpoints-admin.md
CRUD flights
CRUD trainTrips
CRUD infrastructure
Dashboard statistics

7️⃣ Pagination Convention
Các API list phải hỗ trợ:
Query params:
?page=1
&limit=10
&sort=departureTime
&order=asc
Response chuẩn:
{
"success": true,
"data": {
"items": [],
"pagination": {
"page": 1,
"limit": 10,
"totalItems": 100,
"totalPages": 10
}
}
}

8️⃣ Versioning Strategy
Hiện tại:
/api/
Nếu cần nâng cấp:
/api/v2/
Không thay đổi response structure của version cũ nếu đã release.

9️⃣ Quy trình thay đổi API
Khi muốn:
Thêm endpoint
Thay đổi request body
Thay đổi response structure
Bắt buộc:
Cập nhật file endpoint tương ứng
Thảo luận trong team
Update FE nếu cần
Tạo PR

🔟 Checklist review API (Lead)
Lead khi review PR phải kiểm tra:
Có đúng format response không?
Có đúng HTTP status code không?
Có validate input không?
Có phá vỡ contract cũ không?
Có update docs chưa?

1️⃣1️⃣ Definition of Done (API ổn định)
API được coi là ổn định khi:
FE không cần sửa nhiều khi BE thay đổi
Không có endpoint mơ hồ
Response structure thống nhất
Error code rõ ràng
Realtime seat & payment hoạt động đúng
📌 Kết luận
Thư mục 30-api/ là cầu nối chính giữa FE và BE.
Nếu phần này được chuẩn hóa tốt:
Merge nhẹ
Conflict giảm
FE/BE không lệch logic
Hệ thống vận hành ổn định
