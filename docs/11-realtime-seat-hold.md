11 – Realtime Seat Hold (Algorithm Spec)
Transport Booking System (Flight & Train)

1. Mục tiêu
   Module Realtime Seat Hold đảm bảo:
   Một ghế không thể bị 2 người giữ cùng lúc
   Khi user chọn ghế, ghế chuyển trạng thái Holding trong thời gian giới hạn (ví dụ 15 phút)
   Trạng thái ghế được đồng bộ realtime cho tất cả user đang xem seat map
   Nếu hết thời gian giữ chỗ mà chưa thanh toán, ghế tự động Release → Available
   Khi thanh toán thành công, ghế chuyển Booked và không thể bị giữ nữa

2. Định nghĩa trạng thái ghế (Seat State Machine)
   2.1 SeatStatus (Enum)
   AVAILABLE : ghế trống, ai cũng có thể giữ
   HOLDING : đang bị giữ tạm thời
   BOOKED : đã được đặt/đã bán, không thể giữ nữa
   (optional) DISABLED : ghế không bán (bảo trì/không sử dụng)

2.2 Luồng trạng thái
AVAILABLE -> HOLDING -> BOOKED
^ |
| v
+-------- (expire/release) --------+ 3) Dữ liệu cần có (DB/Prisma Schema Requirements)
Phần này là “điểm neo” để mọi dev không tự chế field khác nhau.

3.1 Bảng/Model Seat
Các field tối thiểu:
id
tripId (flightId hoặc trainTripId/carriageId tuỳ thiết kế)
code (A1, A2…)
class (Economy/Business…)
status (AVAILABLE/HOLDING/BOOKED)
holdByUserId (nullable)
holdBySessionId (nullable) (để xử lý user chưa login hoặc multi-tab)
holdUntil (nullable) (timestamp hết hạn giữ)
version (optional) (optimistic lock)
Nếu hệ thống tách “ghế máy bay” và “ghế tàu” thì vẫn phải giữ các field hold giống nhau.

3.2 Bảng/Model Booking (liên quan hold)
id
userId
status (PENDING/PAID/CANCELLED/EXPIRED)
expiresAt (thường sync theo holdUntil hoặc checkout timeout)

3.3 Bảng/Model Ticket (liên quan seat)
id
bookingId
seatId
passengerInfo...

4. Quy tắc thời gian giữ (Hold Rules)
   HOLD_TTL_MINUTES = 15 (config qua ENV)
   Một user có thể giữ tối đa N ghế cho 1 booking (thường N = số hành khách)
   Hold chỉ hợp lệ nếu:
   ghế đang AVAILABLE, hoặc
   ghế HOLDING nhưng đã hết hạn (holdUntil < now)

5. Realtime: Socket Rooms & Events
   5.1 Room theo chuyến đi
   Client join room: trip:<tripId>
   Mọi cập nhật ghế trong trip này sẽ broadcast vào room đó

5.2 Danh sách event chuẩn
Client → Server
JOIN_TRIP_ROOM { tripId }
LEAVE_TRIP_ROOM { tripId }
Server → Client
SEATS_SYNC { tripId, seats[] } (đồng bộ initial)
SEAT_HELD { seatId, status, holdUntil, holdBy? }
SEAT_RELEASED { seatId, status }
SEAT_BOOKED { seatId, status }
FE chỉ update UI theo event, tuyệt đối không tự suy luận.

6. API thiết kế cho Seat Hold (để FE/BE không lệch)
   Đây là “contract tối thiểu”. Chi tiết endpoint sẽ nằm ở 30-api/endpoints-seat.md nhưng ở đây chốt thuật toán.

6.1 Get Seat Map
GET /api/trips/{tripId}/seats
Response: danh sách ghế + status + holdUntil

6.2 Hold Seat (Atomic)
POST /api/seats/hold
Body:
tripId
seatId
sessionId (FE tạo/ lưu local)
Response:
seatId, status=HOLDING, holdUntil

6.3 Release Seat
POST /api/seats/release
Body: seatId, sessionId
Response: status=AVAILABLE

6.4 Confirm Booking (after payment)
POST /api/bookings/{bookingId}/confirm
Backend sẽ set seat → BOOKED (transaction)

7. Thuật toán giữ ghế “chuẩn” (Atomic Hold)
   7.1 Mục tiêu thuật toán
   Đảm bảo khi 2 user click cùng lúc:
   chỉ 1 người hold thành công
   người còn lại nhận lỗi “seat already held/booked”

7.2 Cách làm chuẩn (khuyến nghị)
Dùng transaction + điều kiện cập nhật (conditional update).
Pseudocode (logic)
INPUT: seatId, tripId, userId/sessionId
NOW = current time
HOLD_UNTIL = NOW + TTL
STEP 1: update Seat where:
id = seatId
tripId = tripId
AND (
status = AVAILABLE
OR (status = HOLDING AND holdUntil < NOW) // hold hết hạn
)
SET:
status = HOLDING
holdByUserId = userId (nullable)
holdBySessionId = sessionId
holdUntil = HOLD_UNTIL
IF affectedRows == 0:
=> seat đang HOLDING hợp lệ hoặc BOOKED
=> return 409 CONFLICT ("Seat not available")
STEP 2: emit socket event SEAT_HELD to room trip:<tripId>
RETURN seatId + holdUntil

7.3 Luật “ai được release”
Chỉ người giữ ghế mới được release:
nếu holdByUserId == userId OR holdBySessionId == sessionId
Nếu không đúng → 403 Forbidden

8. Thuật toán release ghế (manual release)
   8.1 Khi nào release
   User bấm bỏ chọn ghế
   User thoát trang seat map / quay lại
   Payment failed / cancel checkout

8.2 Pseudocode
INPUT: seatId, sessionId/userId
NOW = current time
UPDATE Seat WHERE
id = seatId
AND status = HOLDING
AND (holdBySessionId = sessionId OR holdByUserId = userId)
SET:
status = AVAILABLE
holdByUserId = null
holdBySessionId = null
holdUntil = null
IF affectedRows == 0:
return 409 or 403 (không phải người giữ hoặc ghế không ở HOLDING)
EMIT SEAT_RELEASED 9) Thuật toán auto-release (Cron Job)

9.1 Tần suất chạy
Mỗi 30 giây hoặc 1 phút (config)

9.2 Điều kiện auto-release
status = HOLDING
holdUntil < NOW

9.3 Pseudocode
NOW = current time
EXPIRED_SEATS = find seats where status=HOLDING and holdUntil < NOW
UPDATE those seats SET:
status = AVAILABLE
holdByUserId = null
holdBySessionId = null
holdUntil = null
For each tripId impacted:
EMIT SEATS_SYNC or bulk SEAT_RELEASED events
Lưu ý tối ưu: cron nên release theo batch, hạn chế emit từng seat nếu số lượng lớn. Có thể emit “bulk”.

10. Chuyển ghế sang BOOKED khi thanh toán thành công
    10.1 Nguyên tắc
    Chỉ set BOOKED khi payment SUCCESS
    Phải thực hiện trong transaction cùng với:
    cập nhật booking status → PAID
    tạo tickets
    update seats → BOOKED

10.2 Pseudocode
TRANSACTION:
verify payment success
update booking status = PAID
create tickets for passengers
update seats where:
id in selectedSeats
AND status = HOLDING
AND holdUntil >= NOW
AND holdByUserId = userId (or sessionId)
set status = BOOKED, clear hold fields
COMMIT
EMIT SEAT_BOOKED events
Nếu update seats affectedRows != numberOfSeats:
rollback → tránh trường hợp hold đã hết hạn nhưng vẫn book

11. Lỗi & mã lỗi chuẩn (để FE xử lý thống nhất)
    Trường hợp HTTP Code Message gợi ý
    Seat đã bị giữ/đặt 409 SEAT_NOT_AVAILABLE Seat is already held/booked
    Không phải người giữ 403 NOT_SEAT_HOLDER You are not allowed to release this seat
    Hold hết hạn 410 SEAT_HOLD_EXPIRED Seat hold expired
    Seat không tồn tại 404 SEAT_NOT_FOUND Seat not found

12. Các case đặc biệt cần thống nhất (để tránh bug)
    12.1 Multi-tab / refresh trang
    FE phải lưu sessionId ở localStorage
    Khi refresh, FE gọi GET seats để sync lại trạng thái

12.2 User chưa login nhưng vẫn chọn ghế?
Nếu hệ thống bắt login trước seat map: không cần sessionId
Nếu cho chọn trước login: bắt buộc dùng sessionId để giữ ghế

12.3 User giữ quá nhiều ghế
Backend nên giới hạn MAX_HELD_SEATS_PER_SESSION

12.4 Mạng chập chờn, socket mất kết nối
Khi reconnect: FE join room lại và gọi GET seats để sync

13. Definition of Done (DoD) cho module Seat Hold
    Một module “đạt” khi:
    2 user click cùng ghế → chỉ 1 người hold được
    Ghế hold hiển thị realtime ở client khác
    Hết TTL → ghế tự trả về AVAILABLE
    Payment success → ghế chuyển BOOKED và không hold lại được
    Payment failed/cancel → release ghế ngay
    Reconnect socket → sync lại đúng trạng thái

14. Tài liệu liên quan
    10-architecture.md (kiến trúc tổng thể)
    12-payment-flow.md (booking/payment confirm)
    20-database/\* (schema + migration)
    30-api/endpoints-seat.md (contract endpoint chi tiết)
