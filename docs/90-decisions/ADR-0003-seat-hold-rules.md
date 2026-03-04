ADR-0003: Seat Hold Strategy & Concurrency Rules
Transport Booking System

Status
Accepted
Date
2026-02-28
Context
Hệ thống booking có yêu cầu:
Nhiều người có thể truy cập cùng 1 trip
Nhiều người có thể chọn cùng 1 ghế
Phải đảm bảo:
Không double booking
Không mất ghế do race condition
Không giữ ghế vô hạn
Seat hold phải:
Tạm giữ ghế trong một khoảng thời gian
Đồng bộ realtime giữa các user
Tự động hết hạn
Chỉ confirm khi payment thành công
Problem
Nếu không có chiến lược rõ ràng:
2 user có thể cùng giữ 1 ghế
2 booking có thể cùng thanh toán 1 ghế
Hold không hết hạn sẽ làm “kẹt ghế”
FE và BE có thể hiểu khác nhau về trạng thái ghế
Decision
Chúng ta chọn chiến lược:
Database-driven seat hold
TTL-based expiration
Atomic update khi hold
Transaction confirm khi payment success
Realtime sync bằng WebSocket
Idempotent payment confirmation

1️⃣ Seat Status Model
Seat có 3 trạng thái chính:
AVAILABLE
HOLDING
BOOKED
Không dùng boolean.

2️⃣ Hold TTL Strategy
Quyết định
Seat hold có thời gian sống (TTL):
Mặc định: 15 phút
Config qua env: SEAT_HOLD_TTL_MINUTES
Seat hold lưu:
status = HOLDING
holdUntil = timestamp
userId hoặc sessionId
Vì sao không giữ vô hạn?
Tránh chiếm ghế ảo
Tránh block user khác
Tránh dead seat

3️⃣ Atomic Hold Rule
Khi user giữ ghế
Backend phải thực hiện update dạng điều kiện:
Chỉ update nếu:
status = AVAILABLE
OR
status = HOLDING nhưng holdUntil < now (đã hết hạn)
Nếu không thỏa → trả 409 SEAT_NOT_AVAILABLE
Không được:
Đọc trước rồi update sau (race condition)
Tin dữ liệu từ FE

4️⃣ Expiration Strategy
Cách xử lý hết hạn
Có 2 lớp bảo vệ:
Layer 1 – Lazy expiration
Khi request hold mới đến:
Nếu holdUntil < now
Xem như AVAILABLE
Layer 2 – Background cleanup (optional)
Cron job chạy mỗi X phút
Reset ghế hết hạn về AVAILABLE
Không phụ thuộc hoàn toàn vào cron.

5️⃣ Release Rules
User có thể release ghế nếu:
seat.status = HOLDING
userId/sessionId trùng với người giữ
Không được:
User A release ghế của user B
Nếu không đúng → 403 NOT_SEAT_HOLDER

6️⃣ Booking & Seat Interaction
Khi tạo booking
Backend phải kiểm tra:
Tất cả seatIds đang HOLDING
holdUntil còn hạn
userId/sessionId khớp
Nếu không → 410 HOLD_EXPIRED
Khi payment SUCCESS
Trong transaction:
booking.status → PAID
payment.status → SUCCESS
seat.status → BOOKED
clear holdUntil
create ticket
Phải dùng transaction atomic.

7️⃣ Payment FAILED
Nếu payment thất bại:
booking.status → FAILED
seat.status → AVAILABLE
Không được giữ ghế tiếp.

8️⃣ Realtime Sync Strategy
Khi seat thay đổi trạng thái:
Server broadcast:
SEAT_HELD
SEAT_RELEASED
SEAT_BOOKED
Room theo:
trip:<tripId>
FE không tự quyết định trạng thái ghế.
FE chỉ render theo server.

9️⃣ Reconnect Strategy
Khi user refresh:
FE gọi GET seat map
Server trả:
serverTime
holdUntil
FE tính countdown dựa trên serverTime
Không dùng đồng hồ máy client làm chuẩn.

🔟 Concurrency Protection
Double Hold
2 user giữ cùng ghế:
1 thành công
1 nhận 409
Double Payment Callback
Callback SUCCESS 2 lần:
Lần đầu confirm
Lần sau ignore (idempotent)

1️⃣1️⃣ Why Not Redis Lock?
Đã cân nhắc:
Redis distributed lock
Không chọn vì:
Scope hiện tại chưa cần scale lớn
PostgreSQL đủ xử lý với conditional update
Giảm complexity hạ tầng
Có thể thêm Redis sau nếu scale cao.

1️⃣2️⃣ Data Integrity Rules
Không bao giờ được tồn tại:
Seat BOOKED mà không có booking PAID
Booking PAID mà seat chưa BOOKED
Transaction confirm là bắt buộc.

1️⃣3️⃣ Failure Scenarios
Server crash giữa transaction
Prisma transaction đảm bảo rollback.
User đóng trình duyệt
Seat tự hết hạn theo TTL.
Payment callback trễ
Nếu booking EXPIRED:
Có thể từ chối
Hoặc xử lý theo business rule (tuỳ quyết định tương lai)
Consequences
Positive
Không double booking
Không dead seat
Realtime rõ ràng
Dễ maintain
Negative
Cần kiểm soát chặt transaction
Cần discipline code đúng atomic rule
Risks
Nếu quên điều kiện update → race condition
Nếu TTL xử lý sai → ghế bị kẹt
Nếu payment không idempotent → duplicate ticket
Summary
Seat hold được thiết kế:
TTL-based
Database-driven
Atomic update
Transaction confirm
Realtime sync
Đây là phần quan trọng nhất của hệ thống booking.
