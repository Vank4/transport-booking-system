12 – Payment Flow & Transaction Rules
Transport Booking System (Flight & Train)

1. Mục tiêu
   Tài liệu này định nghĩa:
   Luồng thanh toán từ lúc user chọn ghế → thanh toán → nhận vé
   Trạng thái Booking/Payment/Seat
   Quy tắc transaction bắt buộc để tránh lỗi:
   giữ ghế hết hạn nhưng vẫn book
   2 người thanh toán cùng lúc cùng ghế
   callback bị gọi lại nhiều lần (idempotency)
   Đây là tài liệu “khung xương” để FE gọi API thống nhất, BE xử lý nghiệp vụ chuẩn.

2. Entity & trạng thái liên quan
   2.1 BookingStatus (Enum)
   DRAFT (optional): user mới chọn ghế, chưa vào checkout
   PENDING_PAYMENT: đã tạo booking tạm, đang chờ thanh toán
   PAID: thanh toán thành công
   FAILED: thanh toán thất bại
   EXPIRED: hết thời gian giữ ghế/checkout timeout
   CANCELLED: user/admin hủy (nếu hỗ trợ)
   REFUNDED: đã hoàn tiền (nếu hỗ trợ)
   MVP có thể dùng tối thiểu: PENDING_PAYMENT, PAID, FAILED, EXPIRED.

2.2 PaymentStatus (Enum)
PENDING
SUCCESS
FAILED
REFUNDED

2.3 SeatStatus (Enum) (liên quan 11-realtime-seat-hold.md)
AVAILABLE
HOLDING
BOOKED

3. Nguyên tắc vàng (Rules bắt buộc)
   Rule A — Seat chỉ được chuyển BOOKED trong transaction payment success
   Tuyệt đối không set seat BOOKED trước khi xác nhận payment thành công.
   Rule B — Booking chỉ được chuyển PAID khi seat vẫn còn hold hợp lệ
   Seat hold phải còn hạn: holdUntil >= now
   Seat phải thuộc user/session đang thanh toán
   Rule C — Callback/payment confirmation phải idempotent
   Callback có thể gửi lại nhiều lần → BE phải xử lý “lần 2 không làm lại”.
   Rule D — Không tạo Ticket trước khi PAID
   Ticket được tạo trong cùng transaction với:
   booking → PAID
   payment → SUCCESS
   seat → BOOKED

4. Flow tổng thể (Happy Path)
   4.1 Sơ đồ luồng
   [Seat Map] -> Hold Seat (HOLDING)
   |
   v
   [Passenger Info] -> Save passengers to booking draft (optional)
   |
   v
   [Checkout] -> Apply voucher -> Create booking PENDING_PAYMENT
   |
   v
   [Payment Gateway] -> Pay
   |
   v
   [Callback/Webhook] -> Verify -> TRANSACTION:
   booking=PAID, payment=SUCCESS, seats=BOOKED, tickets=CREATED
   |
   v
   [Success Page] -> show PNR/QR + booking detail

5. Thiết kế API tối thiểu theo flow
   Chi tiết endpoint sẽ nằm trong 30-api/endpoints-booking.md và endpoints-payment.md (nếu tách). Ở đây chốt luồng & contract logic.

5.1 Pre-checkout: Lấy thông tin booking summary
GET /api/checkout/summary?tripId=...&seatIds=...
Backend trả:
chuyến đi
ghế đã chọn
giá tạm tính
hạn giữ ghế còn lại (remaining seconds)
FE dùng để hiển thị “Tóm tắt” + countdown.

5.2 Apply Voucher
POST /api/vouchers/apply
Body:
code
tripId
seatIds
Response:
discountAmount
finalTotal
voucherId
Voucher chỉ “tạm áp dụng” ở checkout, booking chưa PAID thì có thể thay đổi.

5.3 Create Booking (PENDING_PAYMENT)
POST /api/bookings
Body:
tripId
seatIds[]
passengers[]
voucherId?
sessionId (nếu cần)
Response:
bookingId
paymentUrl (hoặc payment token)
expiresAt (timeout checkout)
totalAmount
Backend bắt buộc kiểm tra:
Tất cả seatIds phải đang HOLDING
hold thuộc đúng user/session
hold chưa hết hạn
Nếu OK:
Tạo booking PENDING_PAYMENT
Tạo payment record PENDING
Trả paymentUrl để FE redirect

5.4 Payment Callback/Webhook (Gateway → Backend)
POST /api/payments/callback
Gateway gửi:
bookingId
amount
status
signature
transactionId
Backend làm:
Verify signature
Kiểm tra booking tồn tại và đang PENDING_PAYMENT
Xử lý idempotency
Nếu success → chạy Transaction Confirm
Nếu failed → đánh dấu FAILED và release seats

5.5 Payment Result (FE gọi để hiển thị)
GET /api/bookings/{bookingId}
Response:
booking info
payment status
tickets (nếu PAID)
PNR/QR

6. Transaction Confirm (Quan trọng nhất)
   6.1 Điều kiện để confirm PAID
   Booking đang PENDING_PAYMENT
   Payment callback SUCCESS
   Amount đúng với booking total
   Seats vẫn:
   HOLDING
   holdUntil >= NOW
   thuộc đúng user/session/booking

6.2 Transaction bắt buộc gồm các bước
Tất cả trong 1 DB transaction.
TRANSACTION:

1. Lock/ensure booking is still PENDING_PAYMENT
2. Update payment -> SUCCESS (store gateway transactionId)
3. Update booking -> PAID (store paidAt)
4. Update seats -> BOOKED (clear hold fields)
5. Create tickets (1 ticket per passenger/seat)
   COMMIT
   6.3 Pseudocode (logic)
   INPUT: bookingId, gatewayTransactionId, status=SUCCESS, amount
   NOW = current time
   BEGIN TRANSACTION
   booking = find booking by id
   IF booking.status != PENDING_PAYMENT:
   // callback lặp hoặc booking đã xử lý
   RETURN OK (idempotent)
   IF booking.totalAmount != amount:
   mark payment FAILED, booking FAILED
   RELEASE seats (best effort)
   COMMIT
   RETURN 400
   // validate seats
   seats = find seats in booking.seatIds
   IF any seat.status != HOLDING OR seat.holdUntil < NOW:
   booking -> EXPIRED
   payment -> FAILED (or EXPIRED)
   COMMIT
   RETURN 410 (hold expired)
   // update
   payment -> SUCCESS (transactionId)
   booking -> PAID
   seats -> BOOKED (clear hold fields)
   create tickets
   COMMIT
   EMIT socket SEAT_BOOKED for each seat (or bulk)
   RETURN 200 7) Xử lý thanh toán thất bại

7.1 Khi gateway trả FAILED
Update payment FAILED
Update booking FAILED
Release seats (ngay lập tức hoặc best-effort)
Emit socket SEAT_RELEASED

7.2 Nếu release thất bại?
Cron job ở seat-hold sẽ dọn các hold hết hạn, nhưng để UX tốt thì release ngay.

8. Checkout timeout & Booking expiration
   8.1 Tại sao cần timeout riêng?
   Seat hold TTL: 15 phút (ví dụ)
   Checkout timeout có thể = hold TTL hoặc ngắn hơn (vd 10 phút)
   Khi user tạo booking PENDING_PAYMENT mà không thanh toán → booking bị EXPIRED

8.2 Cron xử lý booking pending quá hạn
Job chạy mỗi 1–5 phút:
find bookings PENDING_PAYMENT và expiresAt < NOW
set booking EXPIRED
set payment FAILED/EXPIRED
release seats (nếu vẫn holding)

9. Idempotency & chống callback lặp
   9.1 Vấn đề
   Gateway có thể gửi callback nhiều lần (retry) → nếu không idempotent sẽ:
   tạo ticket trùng
   set seat booked lại
   sai doanh thu

9.2 Cách làm
Payment record có gatewayTransactionId unique
Booking status check: chỉ confirm nếu đang PENDING_PAYMENT
Nếu booking đã PAID → return 200 OK luôn

10. Error codes chuẩn để FE hiển thị đúng
    | Tình huống | HTTP | Code | Hướng FE xử lý |
    | ------------------------- | ------- | ------------------- | ----------------------------------------------------- |
    | Seat hold expired | 410 | `HOLD_EXPIRED` | Hiện popup “Hết thời gian giữ ghế”, quay lại seat map |
    | Amount mismatch | 400 | `AMOUNT_MISMATCH` | Báo lỗi thanh toán, liên hệ hỗ trợ |
    | Booking not found | 404 | `BOOKING_NOT_FOUND` | Quay về trang chủ |
    | Already paid (idempotent) | 200 | `ALREADY_CONFIRMED` | Hiển thị success |
    | Payment failed | 200/400 | `PAYMENT_FAILED` | Hiển thị fail page |

11. Checklist bắt buộc để “khóa conflict”
    Backend phải đảm bảo
    Transaction confirm như mục 6
    Atomic update seat status
    Cron dọn booking pending quá hạn
    Socket broadcast seat changes
    Idempotency callback
    Frontend phải đảm bảo
    Checkout có countdown
    Nếu 410 hold expired → tự động điều hướng về seat map
    Result page luôn GET booking detail để hiển thị trạng thái thật

12. Definition of Done (DoD)
    Module Payment Flow đạt khi:
    Payment success → booking PAID + ticket created + seat BOOKED (transaction)
    Payment fail → booking FAILED + seat released
    Callback lặp → không tạo ticket trùng, không lỗi
    Hold hết hạn → không cho confirm PAID
    FE hiển thị đúng Success/Fail dựa trên booking status

13. Tài liệu liên quan
    11-realtime-seat-hold.md (giữ ghế realtime + cron release)
    20-database/\* (schema + migrate)
    30-api/\* (endpoint details)
    03-sitemap-pages.md (Success/Fail/My Bookings pages)
