# ADR-0002: Database Modeling Strategy (MongoDB)

Status: Accepted
Date: 2026-03-04
Supersedes: ADR-0002-db-modeling (PostgreSQL normalized schema)

## Context

Hệ thống có các domain chính:

- Auth/RBAC: users, roles
- Catalog: airlines, airports, trains, stations, carriages
- Trips: flights, trainTrips
- Seat inventory + hold: seats
- Booking + tickets + payments
- Voucher

MongoDB không có FK, nên cần chiến lược modeling rõ ràng để:

- Truy vấn nhanh (search trips, load seat map).
- Tránh double booking (atomic hold + transaction confirm).
- Giữ tính nhất quán dữ liệu ở các điểm quan trọng (payment callback).

## Decision

### 1) Collection strategy (tách collection theo domain)

- users
- roles (optional, có thể hardcode enum USER/ADMIN giai đoạn MVP)
- airlines, airports
- trains, stations, carriages
- flights, trainTrips
- seats
- bookings
- payments
- vouchers

### 2) ID strategy

- Dùng ObjectId mặc định của MongoDB.
- API trả về id dạng string.
- Không tự tạo “increment id”.

### 3) Flight và TrainTrip

- Tách 2 collection: flights và trainTrips.
- Không tạo “Trip” collection chung để tránh polymorphic phức tạp ở DB.
- Ở API layer có thể dùng DTO chung { type, tripId } để frontend dễ xử lý.

### 4) Seat model (core)

- seats là collection riêng (không embed trong booking).
- Mỗi seat có:
  - type: FLIGHT | TRAIN
  - tripId: ObjectId (trỏ tới flights hoặc trainTrips theo type)
  - seatCode (A1, A2…)
  - class (ECONOMY/BUSINESS…)
  - price
  - status: AVAILABLE | HOLDING | BOOKED
  - holdByUserId (nullable)
  - holdBySessionId (nullable)
  - holdUntil (nullable)

Bắt buộc index/unique:

- unique: { type, tripId, seatCode } để không trùng ghế trong 1 chuyến.
- index: { type, tripId, status } để load seat map nhanh.
- optional: index holdUntil để hỗ trợ cleanup.

### 5) Booking + Payment

- bookings:
  - userId
  - type + tripId
  - seatIds: [ObjectId]
  - passengers: [{...}]
  - status: PENDING_PAYMENT | PAID | FAILED | EXPIRED | CANCELLED
  - subtotal/discount/total
  - voucherCode (optional)
- payments:
  - bookingId (unique)
  - provider, providerRef
  - status: PENDING | SUCCESS | FAILED
  - amount, currency
  - rawPayload (optional, để debug)
  - idempotencyKey / signatureVerified (optional)

Bắt buộc:

- payments.bookingId unique (1-1)
- Trong confirm payment SUCCESS phải dùng transaction:
  - update booking -> PAID
  - update payment -> SUCCESS
  - update seats -> BOOKED (clear hold fields)
  - tạo ticket docs (nếu tách tickets collection) hoặc embed tickets trong booking

### 6) Ticket modeling

MVP khuyến nghị 1 trong 2:
A) Embed tickets trong bookings (đơn giản):

- bookings.tickets = [{ seatId, seatCode, passengerName, qrData, pnr }]
  B) Tách tickets collection (chuẩn hơn):
- tickets: { bookingId, seatId (unique), passengerInfo, qrData, pnr }
  MVP ưu tiên A để triển khai nhanh; khi cần báo cáo/tra cứu nâng cao thì chuyển sang B.

### 7) Voucher usage rule

- vouchers:
  - code (unique)
  - discountType (PERCENT/FIXED)
  - discountValue
  - maxDiscount (optional)
  - minAmount (optional)
  - maxUsage, usedCount
  - expiryDate
  - isActive
- usedCount chỉ tăng khi booking PAID (trong transaction payment SUCCESS).

### 8) Data integrity guardrails (do Mongo không FK)

- Mọi write quan trọng phải validate:
  - seatIds thuộc đúng type+tripId
  - seat HOLDING còn hạn và owner match (userId/sessionId) trước khi tạo booking
- Không hard delete:
  - booking PAID không xóa, chỉ chuyển trạng thái
  - seat BOOKED không xóa
  - voucher đã dùng không xóa

## Alternatives Considered

1. Embed seats vào flights/trainTrips:

- Nhược: seat-hold update nhiều, dễ conflict, khó atomic theo từng ghế, khó index tối ưu.

2. Một collection “trips” chung:

- Nhược: polymorphic, phình schema, ràng buộc yếu.

## Consequences

### Positive

- Modeling đơn giản, dev nhanh, phù hợp MVP.
- Seat-hold realtime hiệu quả nhờ seats collection + indexes.
- Có thể mở rộng dần (tách tickets, thêm reporting).

### Risks / Mitigations

- Không FK → phải enforce bằng code:
  - validate input
  - indexes/unique
  - transaction tại điểm confirm payment
- Cleanup hold:
  - dùng lazy expiration + optional cron cleanup
