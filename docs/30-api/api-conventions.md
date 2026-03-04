API Conventions
Transport Booking System

1️⃣ Mục tiêu
Tài liệu này định nghĩa:
Chuẩn cấu trúc Response
Chuẩn Error format
Quy ước HTTP Status Code
Quy ước Pagination
Quy ước Filtering & Sorting
Quy ước Naming endpoint
Quy ước Authentication & Authorization
Quy ước Idempotency (đặc biệt cho Payment)
Tất cả endpoint trong hệ thống phải tuân thủ tài liệu này.

2️⃣ Base URL
Mọi API bắt đầu bằng:
/api/
Ví dụ:
/api/auth/login
/api/flights
/api/bookings
Nếu sau này nâng version:
/api/v2/
Không được thay đổi format response của version cũ khi đã release.

3️⃣ Chuẩn Response Format (Bắt buộc)
Tất cả API phải trả về format thống nhất như sau:
{
"success": true,
"data": {},
"message": "Optional message",
"errors": null
}
Giải thích:
success: boolean, bắt buộc
data: object hoặc null
message: string mô tả ngắn gọn
errors: object chi tiết lỗi hoặc null

4️⃣ Success Response Convention
4.1 Khi lấy dữ liệu thành công
{
"success": true,
"data": {
"id": "booking-id",
"status": "PAID"
},
"message": "Success",
"errors": null
}
4.2 Khi tạo mới thành công (HTTP 201)
{
"success": true,
"data": {
"id": "new-id"
},
"message": "Created successfully",
"errors": null
}

5️⃣ Error Response Convention
Tất cả lỗi phải trả về format thống nhất:
{
"success": false,
"data": null,
"message": "Seat already booked",
"errors": {
"code": "SEAT_NOT_AVAILABLE"
}
}

5.1 Validation Error
{
"success": false,
"data": null,
"message": "Validation failed",
"errors": {
"fields": {
"email": "Invalid email format",
"password": "Password too short"
}
}
}

5.2 Business Logic Error (Seat Hold)
Ví dụ ghế hết hạn:
{
"success": false,
"data": null,
"message": "Seat hold expired",
"errors": {
"code": "HOLD_EXPIRED"
}
}

6️⃣ HTTP Status Code Convention
Dùng đúng status code, không tùy tiện.
200 → Thành công
201 → Tạo mới thành công
400 → Request không hợp lệ
401 → Chưa xác thực
403 → Không có quyền
404 → Không tìm thấy tài nguyên
409 → Conflict (ví dụ: seat đã bị giữ)
410 → Tài nguyên đã hết hạn (ví dụ hold expired)
500 → Lỗi hệ thống
Không được trả 200 cho mọi lỗi.

7️⃣ Pagination Convention
Mọi API trả về danh sách phải hỗ trợ:
Query params:
?page=1
&limit=10
&sort=createdAt
&order=desc
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
},
"message": "Success",
"errors": null
}

8️⃣ Filtering Convention
Query param filter phải rõ ràng:
Ví dụ tìm flight:
/api/flights?departureAirportId=SGN&arrivalAirportId=HAN&date=2026-05-01
Không được gửi filter qua body cho GET request.

9️⃣ Naming Convention
9.1 URL phải là danh từ (noun), không dùng động từ
✔ Đúng:
GET /api/bookings
POST /api/bookings
PATCH /api/bookings/{id}
❌ Sai:
POST /api/createBooking
POST /api/updateSeatStatus

9.2 Không viết camelCase trong URL
✔ Đúng:
/api/train-trips
❌ Sai:
/api/trainTrips

🔟 Authentication Convention
10.1 Dùng Bearer Token
Header:
Authorization: Bearer <access_token>

10.2 API cần auth
Nếu endpoint yêu cầu đăng nhập:
Trả 401 nếu thiếu token
Trả 403 nếu sai role

1️⃣1️⃣ Role-based Access
Admin-only API phải:
Kiểm tra JWT
Kiểm tra role ADMIN
Trả 403 nếu không đủ quyền

1️⃣2️⃣ Idempotency Convention (Quan trọng cho Payment)
Payment callback có thể bị gọi nhiều lần.
Backend phải đảm bảo:
Nếu booking đã PAID → trả 200
Không tạo ticket trùng
Không update seat lại
Không được:
Tạo ticket mỗi lần callback

1️⃣3️⃣ Transaction Rule
Các API sau phải dùng transaction:
Confirm payment
Update seat → BOOKED
Create ticket
Phải dùng:
prisma.$transaction()
Không được update từng bảng riêng lẻ.

1️⃣4️⃣ Error Code Naming Convention
Error code viết theo UPPER_SNAKE_CASE:
Ví dụ:
SEAT_NOT_AVAILABLE
HOLD_EXPIRED
BOOKING_NOT_FOUND
PAYMENT_FAILED
UNAUTHORIZED
FORBIDDEN
Không được trả error message thuần text mà không có code.

1️⃣5️⃣ Breaking Change Policy
Nếu thay đổi:
Response structure
Field name
Enum value
Phải:
Cập nhật docs
Thảo luận team
Có thể tăng version API nếu ảnh hưởng lớn

1️⃣6️⃣ Definition of Done (API Stable)
API được coi là ổn định khi:
Tất cả endpoint tuân theo response format
Không có endpoint “đặc biệt”
Error code rõ ràng
Payment & Seat Hold không gây conflict logic
FE không phải đoán response structure
