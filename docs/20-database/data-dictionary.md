Data Dictionary
Transport Booking System (PostgreSQL + Prisma)

1️⃣ Mục đích
Tài liệu này định nghĩa:
Tất cả bảng trong hệ thống
Ý nghĩa từng field
Kiểu dữ liệu logic
Ràng buộc nghiệp vụ quan trọng
Quan hệ giữa các bảng
⚠ Mọi thay đổi schema phải cập nhật tài liệu này trước khi tạo migration.

2️⃣ Authentication Module
Roles
Table: roles
id: UUID
→ Khóa chính
name: String
→ USER / ADMIN
createdAt: DateTime
→ Thời điểm tạo
updatedAt: DateTime
→ Thời điểm cập nhật
Users
Table: users
id: UUID
→ Khóa chính
email: String (unique)
→ Email đăng nhập
password: String
→ Mật khẩu đã hash (bcrypt)
fullName: String
→ Tên đầy đủ
phone: String (nullable)
→ Số điện thoại
roleId: UUID
→ FK → roles
status: Enum (ACTIVE | BLOCKED)
→ Trạng thái tài khoản
createdAt: DateTime
→ Thời điểm tạo
updatedAt: DateTime
→ Thời điểm cập nhật

3️⃣ Infrastructure Module
Airlines
Table: airlines
id: UUID
→ Khóa chính
name: String
→ Tên hãng
code: String
→ Mã hãng
createdAt: DateTime
Airports
Table: airports
id: UUID
name: String
code: String
→ Mã IATA
city: String
country: String
Trains
Table: trains
id: UUID
name: String
code: String
TrainStations
Table: trainStations
id: UUID
name: String
city: String
TrainCarriages
Table: trainCarriages
id: UUID
trainId: UUID
→ FK → trains
carriageNumber: String
class: String
→ Hạng ghế

4️⃣ Trip Module
Flights
Table: flights
id: UUID
airlineId: UUID
→ FK → airlines
departureAirportId: UUID
→ FK → airports
arrivalAirportId: UUID
→ FK → airports
departureTime: DateTime
arrivalTime: DateTime
basePrice: Decimal
status: Enum (SCHEDULED | DELAYED | CANCELLED)
TrainTrips
Table: trainTrips
id: UUID
trainId: UUID
→ FK → trains
departureStationId: UUID
→ FK → trainStations
arrivalStationId: UUID
→ FK → trainStations
departureTime: DateTime
arrivalTime: DateTime
basePrice: Decimal
status: Enum (SCHEDULED | DELAYED | CANCELLED)

5️⃣ Seat Module
Seats
Table: seats
id: UUID
tripId: UUID
→ FK → flights hoặc trainTrips
code: String
→ Ví dụ: A1, B2
class: Enum (ECONOMY | BUSINESS)
price: Decimal
status: Enum (AVAILABLE | HOLDING | BOOKED)
holdByUserId: UUID (nullable)
→ User đang giữ ghế
holdBySessionId: String (nullable)
→ Session giữ ghế
holdUntil: DateTime (nullable)
→ Thời điểm hết hạn giữ
createdAt: DateTime

6️⃣ Booking Module
Bookings
Table: bookings
id: UUID
userId: UUID
→ FK → users
tripId: UUID
→ FK → flights hoặc trainTrips
totalAmount: Decimal
status: Enum (PENDING_PAYMENT | PAID | FAILED | EXPIRED)
expiresAt: DateTime
→ Hạn thanh toán
createdAt: DateTime
Tickets
Table: tickets
id: UUID
bookingId: UUID
→ FK → bookings
seatId: UUID
→ FK → seats
passengerName: String
passengerType: Enum (ADULT | CHILD)
createdAt: DateTime
Payments
Table: payments
id: UUID
bookingId: UUID
→ FK → bookings
amount: Decimal
method: Enum (MOMO | VNPAY | MOCK)
status: Enum (PENDING | SUCCESS | FAILED)
transactionId: String (nullable)
→ ID từ gateway
paidAt: DateTime (nullable)

7️⃣ Voucher Module
Vouchers
Table: vouchers
id: UUID
code: String (unique)
discountType: Enum (PERCENT | FIXED)
discountValue: Decimal
maxUsage: Int
usedCount: Int
expiryDate: DateTime
createdAt: DateTime

8️⃣ Quan hệ chính trong hệ thống
1 User → nhiều Bookings
1 Booking → nhiều Tickets
1 Ticket → 1 Seat
1 Trip → nhiều Seats
1 Booking → 1 Payment
1 Voucher → nhiều Bookings

9️⃣ Enum Tổng hợp
UserStatus:
ACTIVE
BLOCKED
SeatStatus:
AVAILABLE
HOLDING
BOOKED
BookingStatus:
PENDING_PAYMENT
PAID
FAILED
EXPIRED
PaymentStatus:
PENDING
SUCCESS
FAILED

🔟 Nguyên tắc bắt buộc
Không đổi enum nếu chưa cập nhật docs & toàn hệ thống.
Không xóa field nếu chưa có migration phù hợp.
Seat.status phải đồng bộ với tài liệu 11-realtime-seat-hold.md.
Booking.status phải đồng bộ với 12-payment-flow.md.
