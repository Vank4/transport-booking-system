Booking & Payment Endpoints
Transport Booking System

1️⃣ Tổng quan
Module Booking chịu trách nhiệm:
Tạo booking (PENDING_PAYMENT)
Lấy danh sách booking của user
Lấy chi tiết booking (kèm ticket)
Xử lý callback thanh toán (SUCCESS/FAILED)
Confirm booking → tạo ticket → set seat BOOKED (transaction)
Base paths:
User booking: /api/bookings
Payment callback: /api/payments
Các endpoint liên quan Seat Hold nằm ở endpoints-seat.md. Booking chỉ hợp lệ nếu seat đang HOLDING và chưa hết hạn.

2️⃣ Quy tắc bắt buộc (khóa conflict)
Không tạo ticket trước khi payment SUCCESS.
Không set seat BOOKED trước khi payment SUCCESS.
Payment callback phải idempotent (có thể gọi nhiều lần).
Confirm payment phải dùng transaction:
booking → PAID
payment → SUCCESS
seats → BOOKED
tickets → CREATED
Nếu hold expired:
trả 410 HOLD_EXPIRED
booking chuyển EXPIRED (best practice)

3️⃣ Header & Auth
Tất cả endpoint dưới đây (trừ callback gateway) yêu cầu JWT:
Authorization: Bearer <access_token>
Nếu thiếu token:
401 UNAUTHORIZED

4️⃣ GET /api/bookings/me
Mục đích
Lấy danh sách booking của user hiện tại.
Query hỗ trợ
page (mặc định 1)
limit (mặc định 10)
status (PENDING_PAYMENT | PAID | FAILED | EXPIRED | CANCELLED | REFUNDED)
sort (createdAt | departureTime)
order (asc | desc)
Ví dụ:
/api/bookings/me?page=1&limit=10&status=PAID&sort=createdAt&order=desc
Success Response (200)
{
"success": true,
"data": {
"items": [
{
"id": "booking-id",
"type": "FLIGHT",
"tripId": "flight-id",
"tripSummary": {
"from": "SGN",
"to": "HAN",
"departureTime": "2026-05-01T08:00:00Z",
"arrivalTime": "2026-05-01T10:00:00Z"
},
"totalAmount": 1200000,
"status": "PAID",
"createdAt": "2026-02-28T10:00:00Z"
}
],
"pagination": {
"page": 1,
"limit": 10,
"totalItems": 1,
"totalPages": 1
}
},
"message": "My bookings",
"errors": null
}

5️⃣ GET /api/bookings/{bookingId}
Mục đích
Lấy chi tiết 1 booking (kèm tickets, payment, voucher nếu có).
Authorization rule
USER chỉ xem booking của chính mình
ADMIN xem qua endpoint admin: /api/admin/bookings/{id} (nếu cần)
Success Response (200)
{
"success": true,
"data": {
"id": "booking-id",
"type": "TRAIN",
"tripId": "trainTrip-id",
"status": "PAID",
"totalAmount": 950000,
"expiresAt": "2026-02-28T10:15:00Z",
"createdAt": "2026-02-28T10:00:00Z",
"voucher": {
"id": "voucher-id",
"code": "SUMMER2026",
"discountType": "PERCENT",
"discountValue": 10
},
"tickets": [
{
"id": "ticket-id",
"seat": {
"id": "seat-id",
"code": "A1",
"class": "ECONOMY",
"price": 950000
},
"passenger": {
"name": "Nguyen Van A",
"type": "ADULT"
}
}
],
"payment": {
"id": "payment-id",
"method": "VNPAY",
"status": "SUCCESS",
"transactionId": "gateway-tx-id",
"paidAt": "2026-02-28T10:05:00Z"
},
"ticketCode": "PNR-ABCD1234",
"qrCode": "base64-or-url"
},
"message": "Booking detail",
"errors": null
}
Error cases:
booking không tồn tại → 404 BOOKING_NOT_FOUND
không phải chủ booking → 403 FORBIDDEN

6️⃣ POST /api/bookings
Mục đích
Tạo booking ở trạng thái PENDING_PAYMENT và tạo Payment(PENDING), trả về paymentUrl để FE redirect.
Request Body
{
"type": "FLIGHT",
"tripId": "flight-id",
"seatIds": ["seat-1", "seat-2"],
"passengers": [
{
"name": "Nguyen Van A",
"type": "ADULT"
},
{
"name": "Nguyen Van B",
"type": "CHILD"
}
],
"voucherCode": "SUMMER2026",
"paymentMethod": "VNPAY",
"sessionId": "client-session-id"
}
Giải thích field:
type: FLIGHT hoặc TRAIN
tripId: id chuyến
seatIds: danh sách ghế user đang giữ
passengers: danh sách hành khách ứng với số ghế
voucherCode: optional
paymentMethod: MOMO | VNPAY | MOCK
sessionId: để xác thực hold (nhất là multi-tab hoặc pre-login flow)
Validation Rules (bắt buộc)
seatIds.length phải bằng passengers.length
Tất cả seatIds phải thuộc tripId
Tất cả seat phải ở trạng thái HOLDING
holdUntil phải còn hạn
seat phải do user/session hiện tại giữ
voucherCode nếu có phải hợp lệ và chưa hết hạn
Success Response (201)
{
"success": true,
"data": {
"bookingId": "booking-id",
"status": "PENDING_PAYMENT",
"totalAmount": 1710000,
"expiresAt": "2026-02-28T10:15:00Z",
"payment": {
"id": "payment-id",
"method": "VNPAY",
"status": "PENDING"
},
"paymentUrl": "https://payment-gateway/redirect?token=..."
},
"message": "Booking created, waiting for payment",
"errors": null
}
Error Cases
seat không available/đã bị giữ bởi người khác → 409 SEAT_NOT_AVAILABLE
hold expired → 410 HOLD_EXPIRED
voucher invalid/expired → 400 VOUCHER_INVALID
passengers mismatch → 400 PASSENGERS_MISMATCH

7️⃣ POST /api/bookings/{bookingId}/cancel (optional MVP)
Mục đích
User yêu cầu hủy booking.
Lưu ý nghiệp vụ:
Nếu booking PAID thì thường phải qua quy trình refund (tuỳ scope).
MVP có thể chỉ cho hủy khi PENDING_PAYMENT.
Response
Nếu hủy thành công → 200, message “Booking cancelled”
Nếu booking đã PAID → 409 CANNOT_CANCEL_PAID_BOOKING

8️⃣ POST /api/payments/callback (Gateway → Backend)
Mục đích
Nhận callback/webhook từ cổng thanh toán.
⚠ Endpoint này không yêu cầu JWT, nhưng yêu cầu verify signature.
Request Body (ví dụ)
{
"bookingId": "booking-id",
"status": "SUCCESS",
"amount": 1710000,
"transactionId": "gateway-tx-id",
"signature": "signed-hash"
}
Backend bắt buộc làm
Verify signature
Verify amount = booking.totalAmount
Idempotency:
nếu booking đã PAID → return 200 OK
Nếu SUCCESS:
chạy transaction confirm (mục 9)
Nếu FAILED:
update booking FAILED
update payment FAILED
release seats (best effort)
Success Response (200)
{
"success": true,
"data": null,
"message": "Callback processed",
"errors": null
}

9️⃣ Transaction Confirm (bắt buộc, nội bộ)
FE không gọi trực tiếp, BE gọi bên trong callback hoặc endpoint confirm riêng (nếu dùng mock).
Transaction gồm:
Update payment → SUCCESS
Update booking → PAID
Update seats → BOOKED (clear hold fields)
Create tickets
Generate ticketCode/PNR + QR
Nếu bất kỳ bước nào fail → rollback.

🔟 POST /api/payments/mock-confirm (chỉ cho môi trường dev)
Mục đích
Dùng khi demo hoặc chưa tích hợp gateway thật.
Request:
{
"bookingId": "booking-id",
"status": "SUCCESS"
}
Behavior:
Gọi chung logic transaction confirm như callback.

1️⃣1️⃣ GET /api/bookings/{bookingId}/ticket
Mục đích
Lấy dữ liệu vé điện tử (PNR/QR) để FE hiển thị hoặc tải về.
Chỉ cho phép nếu:
booking thuộc user hiện tại
booking status = PAID
Success response:
{
"success": true,
"data": {
"ticketCode": "PNR-ABCD1234",
"qrCode": "base64-or-url",
"issuedAt": "2026-02-28T10:05:00Z"
},
"message": "E-ticket",
"errors": null
}
Nếu chưa PAID → 409 BOOKING_NOT_PAID

1️⃣2️⃣ Error Codes chuẩn cho module Booking
Danh sách code dùng trong module này:
BOOKING_NOT_FOUND
FORBIDDEN
SEAT_NOT_AVAILABLE
HOLD_EXPIRED
PASSENGERS_MISMATCH
VOUCHER_INVALID
PAYMENT_FAILED
AMOUNT_MISMATCH
BOOKING_NOT_PAID
CANNOT_CANCEL_PAID_BOOKING

1️⃣3️⃣ Definition of Done
Booking module được coi là hoàn chỉnh khi:
Tạo booking chỉ thành công khi seat đang HOLDING và còn hạn
Payment success → booking PAID + seat BOOKED + ticket created (transaction)
Payment failed → booking FAILED + seat released
Callback gọi nhiều lần không tạo ticket trùng (idempotent)
User chỉ xem booking của chính mình
