ERD – Entity Relationship Diagram
Transport Booking System (Flight & Train)

1. Mục tiêu
   Tài liệu này mô tả:
   Danh sách entity/bảng trong hệ thống
   Quan hệ giữa các entity (1–1, 1–N, N–N)
   Cardinality & ràng buộc quan trọng
   Các quyết định modeling để BE/FE thống nhất khi triển khai Prisma + Postgres
   ⚠ ERD phải khớp 100% với schema.prisma. Mọi thay đổi ERD phải cập nhật song song schema & migration.

2. Nhóm Entity theo module
   Authentication
   roles
   users
   Infrastructure
   airlines
   airports
   trains
   trainStations
   trainCarriages
   Trips
   flights
   trainTrips
   Seat / Booking / Payment
   seats
   bookings
   tickets
   payments
   vouchers

3. Quan hệ tổng quan (High-level relationships)
   3.1 Role ↔ User
   roles (1) —— (N) users
   Một role có nhiều user
   Một user thuộc đúng 1 role

3.2 Airline/Airport ↔ Flight
airlines (1) —— (N) flights
airports (1) —— (N) flights (vai trò Departure)
airports (1) —— (N) flights (vai trò Arrival)
Một flight thuộc 1 airline, có 1 sân bay đi và 1 sân bay đến.

3.3 Train/Station ↔ TrainTrip
trains (1) —— (N) trainTrips
trainStations (1) —— (N) trainTrips (vai trò Departure)
trainStations (1) —— (N) trainTrips (vai trò Arrival)

3.4 Train ↔ TrainCarriage
trains (1) —— (N) trainCarriages

3.5 Trip ↔ Seat (quan hệ quan trọng nhất cho Seat Hold)
Một trip có nhiều seats.
Seat thuộc đúng 1 trip.
Do hệ thống có 2 loại trip (Flight / TrainTrip), có 2 hướng thiết kế:
Option A (Khuyến nghị cho team dùng Prisma + Postgres, dễ triển khai)
seats.tripType = FLIGHT | TRAIN
seats.flightId nullable
seats.trainTripId nullable
→ Seat sẽ FK vào đúng trip theo tripType.
Ưu điểm: dễ query, dễ enforce FK.
Option B (Chung 1 trường tripId – polymorphic)
seats.tripId trỏ chung, không FK cứng
→ phải tự validate logic bằng code.
Nhược điểm: dễ bug, khó enforce constraint.
📌 Khuyến nghị: dùng Option A để DB rõ ràng và tránh conflict khi code.

3.6 User ↔ Booking
users (1) —— (N) bookings
Một user có thể có nhiều booking
Một booking thuộc về đúng 1 user

3.7 Booking ↔ Ticket
bookings (1) —— (N) tickets

3.8 Ticket ↔ Seat
seats (1) —— (0..1) tickets (khuyến nghị unique constraint)
Giải thích:
Một ticket luôn gắn với 1 seat
Một seat sau khi BOOKED chỉ được xuất hiện tối đa trong 1 ticket
📌 Ràng buộc nên có:
tickets.seatId unique (đảm bảo 1 seat không bị bán 2 lần)

3.9 Booking ↔ Payment
bookings (1) —— (1) payments (khuyến nghị 1-1)
📌 Ràng buộc nên có:
payments.bookingId unique

3.10 Voucher ↔ Booking
Có 2 hướng:
Option A (MVP, đơn giản)
bookings.voucherId nullable → FK vouchers.id
Quan hệ: vouchers (1) —— (N) bookings
Option B (đếm usage chuẩn theo user, chống spam)
tạo bảng voucherUsages (id, voucherId, userId, bookingId, usedAt)
Quan hệ: vouchers (1) —— (N) voucherUsages, users (1) —— (N) voucherUsages
📌 Khuyến nghị MVP: Option A (nhanh, ít bảng). Nếu cần chặt hơn thì nâng cấp sang Option B.

4. ERD mô tả chi tiết (entity → keys → relationships)
   4.1 roles
   PK: roles.id
   Unique: roles.name
   Rel:
   roles (1) -> (N) users

4.2 users
PK: users.id
Unique: users.email
FK:
users.roleId -> roles.id
Rel:
users (1) -> (N) bookings

4.3 airlines
PK: airlines.id
Unique: airlines.code (khuyến nghị)
Rel:
airlines (1) -> (N) flights

4.4 airports
PK: airports.id
Unique: airports.code (IATA, khuyến nghị)
Rel:
airports (1) -> (N) flights (departureAirportId)
airports (1) -> (N) flights (arrivalAirportId)

4.5 flights
PK: flights.id
FK:
flights.airlineId -> airlines.id
flights.departureAirportId -> airports.id
flights.arrivalAirportId -> airports.id
Rel:
flights (1) -> (N) seats (nếu áp dụng Option A cho seat)

4.6 trains
PK: trains.id
Unique: trains.code (khuyến nghị)
Rel:
trains (1) -> (N) trainCarriages
trains (1) -> (N) trainTrips

4.7 trainStations
PK: trainStations.id
Rel:
trainStations (1) -> (N) trainTrips (departureStationId)
trainStations (1) -> (N) trainTrips (arrivalStationId)

4.8 trainCarriages
PK: trainCarriages.id
FK:
trainCarriages.trainId -> trains.id
Lưu ý: Nếu seat của tàu gắn theo carriage thì có thể mở rộng:
trainCarriages (1) -> (N) seats (chỉ cho train).

4.9 trainTrips
PK: trainTrips.id
FK:
trainTrips.trainId -> trains.id
trainTrips.departureStationId -> trainStations.id
trainTrips.arrivalStationId -> trainStations.id
Rel:
trainTrips (1) -> (N) seats (nếu áp dụng Option A)

4.10 seats
PK: seats.id
FK (Option A):
seats.flightId -> flights.id (nullable)
seats.trainTripId -> trainTrips.id (nullable)
Rel:
seats (0..1) -> (1) ticket (sau khi book)
📌 Constraints quan trọng:
Seat hold fields: status, holdUntil, holdByUserId, holdBySessionId
Seat booked không được quay về available trừ khi có nghiệp vụ hoàn/huỷ (nếu triển khai)

4.11 bookings
PK: bookings.id
FK:
bookings.userId -> users.id
bookings.voucherId -> vouchers.id (nullable, nếu MVP Option A)
bookings.flightId -> flights.id (nullable) / bookings.trainTripId -> trainTrips.id (nullable) (khuyến nghị theo Option A tương tự seat)
Rel:
bookings (1) -> (N) tickets
bookings (1) -> (1) payments
📌 Constraints:
expiresAt để xử lý checkout timeout
status đồng bộ theo 12-payment-flow.md

4.12 tickets
PK: tickets.id
FK:
tickets.bookingId -> bookings.id
tickets.seatId -> seats.id
Constraints:
tickets.seatId unique (khuyến nghị bắt buộc)

4.13 payments
PK: payments.id
FK:
payments.bookingId -> bookings.id
Constraints:
payments.bookingId unique (khuyến nghị bắt buộc)

4.14 vouchers
PK: vouchers.id
Unique:
vouchers.code
Rel:
vouchers (1) -> (N) bookings (MVP Option A)

5. Constraints bắt buộc để chống double booking
   Để đảm bảo không “bán trùng ghế”, DB nên có các ràng buộc tối thiểu:
   tickets.seatId UNIQUE
   payments.bookingId UNIQUE
   Seat update phải atomic ở tầng service (theo 11-realtime-seat-hold.md)
   Transaction confirm payment phải atomic (theo 12-payment-flow.md)

6. Gợi ý index (tối ưu tìm kiếm)
   Khuyến nghị index:
   flights(departureAirportId, arrivalAirportId, departureTime)
   trainTrips(departureStationId, arrivalStationId, departureTime)
   seats(flightId, status) hoặc seats(trainTripId, status)
   bookings(userId, createdAt)
   vouchers(code) unique

7. Checklist cập nhật ERD
   Khi đổi schema:
   Thêm/sửa quan hệ → cập nhật erd.md
   Thêm field mới → cập nhật data-dictionary.md
   Sửa schema.prisma → tạo migration mới
   Không sửa migration cũ

8. Kết luận
   ERD này là bản mô tả chính thức cho quan hệ dữ liệu hệ thống đặt vé máy bay & tàu hỏa.
   Mục tiêu là:
   Rõ ràng quan hệ
   Ràng buộc chống bán trùng
   Đồng bộ với thuật toán giữ ghế và flow thanh toán
   Giảm conflict khi nhiều người cùng code Prisma
