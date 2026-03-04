Seat Endpoints (Realtime Hold & Sync)
Transport Booking System

1️⃣ Tổng quan
Module Seat chịu trách nhiệm quản lý trạng thái ghế theo thời gian thực:
AVAILABLE → ghế trống
HOLDING → ghế đang được giữ tạm
BOOKED → ghế đã được đặt thành công
Các API trong tài liệu này phục vụ:
Trang Trip Details / Seat Map
Flow chọn ghế trước khi tạo booking
Đồng bộ realtime qua WebSocket
Xử lý reconnect và refresh không lệch dữ liệu
Base paths:
Public trip seats: /api/trips/{type}/{tripId}/seats
Seat actions: /api/seats/\*
type nhận:
flight
train
Ví dụ:
/api/trips/flight/<tripId>/seats
/api/trips/train/<tripId>/seats

2️⃣ Quy tắc bắt buộc (khóa conflict)
Hold phải atomic: chỉ 1 người giữ được 1 ghế tại 1 thời điểm
Không được hold ghế BOOKED
Không được “override” status seat bằng FE
Release chỉ cho phép chủ sở hữu hold (userId hoặc sessionId) thực hiện
Khi payment SUCCESS → seat chuyển BOOKED trong transaction (xem 12-payment-flow.md)
Khi hold expired → trả 410 HOLD_EXPIRED hoặc tự động release (cron) theo 11-realtime-seat-hold.md

3️⃣ Auth & Session Rules
3.1 API public (không cần login)
Lấy seat map (để user xem ghế)

3.2 API yêu cầu login (khuyến nghị)
Hold seat
Release seat
Bulk hold/release
Nếu hệ thống cho phép chọn ghế trước login, bắt buộc dùng sessionId để xác định quyền giữ.

3.3 sessionId
FE phải tạo và lưu sessionId trong localStorage.
Ví dụ:
sessionId = uuidv4()
sessionId được gửi lên trong body của hold/release để BE xác định chủ hold.

4️⃣ GET Seat Map (Sync)
4.1 GET /api/trips/{type}/{tripId}/seats
Mục đích
Lấy danh sách ghế của chuyến để render seat map và đồng bộ khi refresh/reconnect.
Query params (optional)
class: ECONOMY | BUSINESS
includeHold: true | false (mặc định true)
Ví dụ:
/api/trips/flight/<tripId>/seats?class=ECONOMY
Success Response (200)
{
"success": true,
"data": {
"tripId": "trip-id",
"type": "FLIGHT",
"holdTtlMinutes": 15,
"serverTime": "2026-02-28T10:00:00Z",
"items": [
{
"id": "seat-id",
"code": "A1",
"class": "ECONOMY",
"price": 1200000,
"status": "AVAILABLE",
"holdUntil": null
},
{
"id": "seat-id-2",
"code": "A2",
"class": "ECONOMY",
"price": 1200000,
"status": "HOLDING",
"holdUntil": "2026-02-28T10:10:00Z"
},
{
"id": "seat-id-3",
"code": "A3",
"class": "ECONOMY",
"price": 1200000,
"status": "BOOKED",
"holdUntil": null
}
]
},
"message": "Seat map",
"errors": null
}
Ghi chú:
serverTime dùng để FE tính countdown chính xác (không phụ thuộc đồng hồ máy)
FE phải render seat theo status
Error cases:
trip không tồn tại → 404 TRIP_NOT_FOUND

5️⃣ Hold Seat (Atomic)
5.1 POST /api/seats/hold
Mục đích
Giữ 1 ghế trong thời gian TTL (ví dụ 15 phút).
Auth
Khuyến nghị yêu cầu JWT.
Nếu chưa login vẫn cho giữ thì phải có sessionId.
Request Body
{
"type": "FLIGHT",
"tripId": "trip-id",
"seatId": "seat-id",
"sessionId": "client-session-id"
}
Success Response (200)
{
"success": true,
"data": {
"seatId": "seat-id",
"status": "HOLDING",
"holdUntil": "2026-02-28T10:15:00Z"
},
"message": "Seat held",
"errors": null
}
Error cases
ghế đã HOLDING (còn hạn) hoặc BOOKED → 409 SEAT_NOT_AVAILABLE
ghế hold hết hạn nhưng chưa được cron dọn (race) → backend phải xử lý như AVAILABLE (không trả lỗi)
trip/seat không tồn tại → 404 SEAT_NOT_FOUND

6️⃣ Release Seat (Manual)
6.1 POST /api/seats/release
Mục đích
Bỏ giữ ghế (khi user unselect hoặc thoát flow).
Request Body
{
"seatId": "seat-id",
"sessionId": "client-session-id"
}
Success Response (200)
{
"success": true,
"data": {
"seatId": "seat-id",
"status": "AVAILABLE"
},
"message": "Seat released",
"errors": null
}
Error cases
không phải người giữ ghế → 403 NOT_SEAT_HOLDER
seat không ở HOLDING → 409 SEAT_NOT_HOLDING
seat không tồn tại → 404 SEAT_NOT_FOUND

7️⃣ Bulk Hold / Bulk Release (Khuyến nghị để FE thao tác nhiều ghế)
7.1 POST /api/seats/hold-bulk
Mục đích
Giữ nhiều ghế cùng lúc (multi passengers), giảm số lần call API.
Request Body
{
"type": "TRAIN",
"tripId": "trip-id",
"seatIds": ["seat-1", "seat-2"],
"sessionId": "client-session-id"
}
Success Response (200)
{
"success": true,
"data": {
"held": [
{
"seatId": "seat-1",
"status": "HOLDING",
"holdUntil": "2026-02-28T10:15:00Z"
},
{
"seatId": "seat-2",
"status": "HOLDING",
"holdUntil": "2026-02-28T10:15:00Z"
}
],
"failed": []
},
"message": "Bulk hold result",
"errors": null
}
Nếu có seat fail (đã bị giữ/đặt), failed trả về:
{
"seatId": "seat-x",
"code": "SEAT_NOT_AVAILABLE",
"message": "Seat already held/booked"
}
Khuyến nghị backend:
Không rollback toàn bộ nếu 1 seat fail (tùy UX).
Nếu muốn “all-or-nothing” thì dùng transaction và trả 409 nếu fail bất kỳ seat nào.

7.2 POST /api/seats/release-bulk
Mục đích
Release nhiều ghế một lần (khi user back khỏi checkout).
Request Body
{
"seatIds": ["seat-1", "seat-2"],
"sessionId": "client-session-id"
}
Success Response (200)
{
"success": true,
"data": {
"released": ["seat-1", "seat-2"],
"failed": []
},
"message": "Bulk release result",
"errors": null
}

8️⃣ Re-sync sau reconnect (Khuyến nghị)
Khi socket reconnect hoặc user refresh:
FE gọi GET /api/trips/{type}/{tripId}/seats
FE join lại room socket trip:<tripId>
FE không được “giữ ghế lại” tự động nếu holdUntil đã hết

9️⃣ WebSocket Events (để FE update realtime)
Room naming:
trip:<tripId>
Client -> Server:
JOIN_TRIP_ROOM { tripId }
LEAVE_TRIP_ROOM { tripId }
Server -> Client:
SEATS_SYNC { tripId, items[] }
SEAT_HELD { seatId, status, holdUntil }
SEAT_RELEASED { seatId, status }
SEAT_BOOKED { seatId, status }
FE chỉ cập nhật UI theo event + GET sync khi cần.

🔟 Error Codes chuẩn cho module Seat
Các code dùng trong module này:
TRIP_NOT_FOUND
SEAT_NOT_FOUND
SEAT_NOT_AVAILABLE
HOLD_EXPIRED
NOT_SEAT_HOLDER
SEAT_NOT_HOLDING
VALIDATION_ERROR

1️⃣1️⃣ Definition of Done
Seat API hoàn chỉnh khi:
2 user chọn cùng ghế → chỉ 1 người hold được (409 cho người còn lại)
Seat hold có countdown chính xác theo serverTime
Release chỉ chủ hold mới làm được
Bulk hold/release hoạt động đúng
Reconnect/refresh không lệch trạng thái
Socket broadcast đúng theo event chuẩn
Payment success chuyển seat BOOKED (không cho hold lại)
