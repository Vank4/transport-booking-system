Admin Endpoints
Transport Booking System

1️⃣ Tổng quan
Toàn bộ endpoint trong tài liệu này:
Bắt buộc có JWT
Bắt buộc role = ADMIN
Nếu không có quyền → trả 403 FORBIDDEN
Header bắt buộc:
Authorization: Bearer <access_token>
Base path:
/api/admin/

2️⃣ Dashboard & Statistics
GET /api/admin/dashboard
Mục đích:
Lấy dữ liệu tổng quan cho dashboard admin
Response data bao gồm:
totalUsers
totalBookings
totalRevenue
totalFlights
totalTrainTrips
occupancyRate
Response mẫu:
{
"success": true,
"data": {
"totalUsers": 120,
"totalBookings": 450,
"totalRevenue": 25000000,
"totalFlights": 80,
"totalTrainTrips": 60,
"occupancyRate": 0.72
},
"message": "Dashboard data",
"errors": null
}

3️⃣ User Management
GET /api/admin/users
Mục đích:
Lấy danh sách user
Hỗ trợ query:
page
limit
search (email hoặc name)
status (ACTIVE | BLOCKED)
Response data:
items[]
pagination
PATCH /api/admin/users/{id}/status
Mục đích:
Khóa hoặc mở khóa tài khoản
Request body:
{
"status": "BLOCKED"
}
Response:
{
"success": true,
"data": null,
"message": "User status updated",
"errors": null
}

4️⃣ Airlines Management
GET /api/admin/airlines
Lấy danh sách hãng hàng không
POST /api/admin/airlines
Tạo hãng mới
Request body:
{
"name": "Vietnam Airlines",
"code": "VN"
}
PATCH /api/admin/airlines/{id}
Cập nhật hãng
DELETE /api/admin/airlines/{id}
Xóa hãng (nếu chưa có flight liên quan)

5️⃣ Airports Management
GET /api/admin/airports
Lấy danh sách sân bay
POST /api/admin/airports
Tạo sân bay mới
Request body:
{
"name": "Tan Son Nhat",
"code": "SGN",
"city": "Ho Chi Minh",
"country": "Vietnam"
}
PATCH /api/admin/airports/{id}
Cập nhật sân bay
DELETE /api/admin/airports/{id}
Xóa sân bay

6️⃣ Train & Station Management
GET /api/admin/trains
POST /api/admin/trains
PATCH /api/admin/trains/{id}
DELETE /api/admin/trains/{id}
GET /api/admin/train-stations
POST /api/admin/train-stations
PATCH /api/admin/train-stations/{id}
DELETE /api/admin/train-stations/{id}
GET /api/admin/train-carriages
POST /api/admin/train-carriages
PATCH /api/admin/train-carriages/{id}
DELETE /api/admin/train-carriages/{id}

7️⃣ Flight Management
GET /api/admin/flights
Query hỗ trợ:
page
limit
departureAirportId
arrivalAirportId
status
POST /api/admin/flights
Tạo flight mới
Request body:
{
"airlineId": "uuid",
"departureAirportId": "uuid",
"arrivalAirportId": "uuid",
"departureTime": "2026-05-01T08:00:00Z",
"arrivalTime": "2026-05-01T10:00:00Z",
"basePrice": 1200000
}
PATCH /api/admin/flights/{id}
Cập nhật flight
DELETE /api/admin/flights/{id}
Xóa flight (nếu chưa có booking)

8️⃣ Train Trip Management
GET /api/admin/train-trips
POST /api/admin/train-trips
PATCH /api/admin/train-trips/{id}
DELETE /api/admin/train-trips/{id}
Cấu trúc tương tự flights.

9️⃣ Seat Configuration
GET /api/admin/trips/{id}/seats
Lấy toàn bộ ghế của trip
POST /api/admin/trips/{id}/seats
Tạo seat map ban đầu
Request body:
{
"seats": [
{
"code": "A1",
"class": "ECONOMY",
"price": 1200000
}
]
}
PATCH /api/admin/seats/{id}
Cập nhật giá hoặc trạng thái ghế
Không được dùng endpoint này để override logic seat hold.

🔟 Voucher Management
GET /api/admin/vouchers
POST /api/admin/vouchers
{
"code": "SUMMER2026",
"discountType": "PERCENT",
"discountValue": 10,
"maxUsage": 100,
"expiryDate": "2026-08-01T00:00:00Z"
}
PATCH /api/admin/vouchers/{id}
DELETE /api/admin/vouchers/{id}

1️⃣1️⃣ Booking Management (Admin)
GET /api/admin/bookings
Lấy toàn bộ booking
Hỗ trợ filter:
status
date range
userId
PATCH /api/admin/bookings/{id}/cancel
Hủy booking (nếu nghiệp vụ cho phép)
PATCH /api/admin/bookings/{id}/refund
Hoàn tiền thủ công
Bắt buộc:
Dùng transaction
Update payment → REFUNDED
Update booking → REFUNDED
Không được thay đổi seat nếu vé đã sử dụng

1️⃣2️⃣ Báo cáo
GET /api/admin/reports/revenue
Query:
from
to
Response:
totalRevenue
breakdownByDay
GET /api/admin/reports/occupancy
Response:
tripId
occupancyRate
totalSeats
bookedSeats

1️⃣3️⃣ Nguyên tắc bắt buộc cho Admin API
Không trả dữ liệu nhạy cảm (password hash)
Không hard delete booking đã PAID
Không bypass seat hold logic
Không cho xóa trip nếu đã có booking

1️⃣4️⃣ Definition of Done
Admin API được coi là hoàn chỉnh khi:
CRUD hoạt động đúng
Pagination đầy đủ
Không vi phạm rule seat hold
Không vi phạm rule payment flow
Role check hoạt động đúng
Không phá vỡ contract API
