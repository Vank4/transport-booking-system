Voucher Endpoints
Transport Booking System

1️⃣ Tổng quan
Voucher module phục vụ:
User áp dụng mã giảm giá ở bước checkout
Backend kiểm tra tính hợp lệ, tính giảm giá, trả về tổng tiền mới
Admin CRUD voucher để quản lý chương trình khuyến mãi
Base paths:
User: /api/vouchers/\*
Admin: /api/admin/vouchers/\*
Voucher phải đồng bộ với mô hình trong 20-database/data-dictionary.md.

2️⃣ Quy tắc bắt buộc
Voucher chỉ có tác dụng khi:
còn hạn (expiryDate >= now)
chưa vượt maxUsage (nếu có)
code đúng (không phân biệt hoa thường nếu đã chuẩn hóa)
Voucher chỉ nên “tạm áp dụng” ở checkout:
Tổng tiền cuối cùng được chốt khi tạo booking (POST /api/bookings)
Không được tin dữ liệu giảm giá do FE gửi lên:
FE chỉ gửi voucherCode hoặc voucherId
Backend tự tính discountAmount và finalTotal
Nếu voucher hết hạn hoặc không hợp lệ → trả 400 với VOUCHER_INVALID

3️⃣ User APIs
3.1 POST /api/vouchers/apply
Mục đích
User áp dụng voucher để xem tổng tiền sau giảm giá trước khi tạo booking.
Auth
Khuyến nghị yêu cầu JWT (để chống spam), nhưng có thể mở public nếu MVP.
Request Body
{
"code": "SUMMER2026",
"type": "FLIGHT",
"tripId": "trip-id",
"seatIds": ["seat-1", "seat-2"]
}
Giải thích:
code: voucher code
type/tripId/seatIds: để backend tính subtotal theo đúng seats
Backend rules
Validate code tồn tại
Check expiryDate
Check maxUsage > usedCount (nếu dùng)
Tính subtotal dựa trên ghế được gửi lên:
chỉ chấp nhận ghế thuộc tripId
không yêu cầu ghế phải HOLDING (optional), nhưng khuyến nghị kiểm tra ghế còn AVAILABLE/HOLDING hợp lệ để tránh báo giá sai
Tính discount:
PERCENT: discount = subtotal \* discountValue/100
FIXED: discount = discountValue
Giới hạn discount không vượt subtotal
Trả finalTotal = subtotal - discount
Success Response (200)
{
"success": true,
"data": {
"voucher": {
"id": "voucher-id",
"code": "SUMMER2026",
"discountType": "PERCENT",
"discountValue": 10,
"expiryDate": "2026-08-01T00:00:00Z"
},
"pricing": {
"subtotal": 2000000,
"discountAmount": 200000,
"finalTotal": 1800000
}
},
"message": "Voucher applied",
"errors": null
}
Error cases
code không tồn tại → 400 VOUCHER_NOT_FOUND
voucher hết hạn → 400 VOUCHER_EXPIRED
voucher hết lượt → 400 VOUCHER_OUT_OF_STOCK
seatIds không hợp lệ / không thuộc trip → 400 INVALID_SEATS
validation fail → 400 VALIDATION_ERROR

3.2 GET /api/vouchers/{code} (optional)
Mục đích
Cho FE hiển thị thông tin voucher (nếu cần UX).
Khuyến nghị MVP không cần, chỉ cần apply là đủ.

4️⃣ Admin APIs (CRUD)
Tất cả admin endpoints yêu cầu:
JWT
role = ADMIN
Header:
Authorization: Bearer <access_token>
Base:
/api/admin/vouchers

4.1 GET /api/admin/vouchers
Mục đích
Lấy danh sách voucher (admin quản lý).
Query hỗ trợ
page, limit
search (theo code)
status:
ACTIVE (expiryDate >= now và usedCount < maxUsage)
EXPIRED
OUT_OF_STOCK
sort: createdAt | expiryDate | usedCount
order: asc | desc
Success Response (200)
{
"success": true,
"data": {
"items": [
{
"id": "voucher-id",
"code": "SUMMER2026",
"discountType": "PERCENT",
"discountValue": 10,
"maxUsage": 100,
"usedCount": 12,
"expiryDate": "2026-08-01T00:00:00Z",
"createdAt": "2026-02-01T00:00:00Z"
}
],
"pagination": {
"page": 1,
"limit": 10,
"totalItems": 1,
"totalPages": 1
}
},
"message": "Vouchers",
"errors": null
}

4.2 POST /api/admin/vouchers
Mục đích
Tạo voucher mới.
Request Body
{
"code": "SUMMER2026",
"discountType": "PERCENT",
"discountValue": 10,
"maxUsage": 100,
"expiryDate": "2026-08-01T00:00:00Z"
}
Validation rules
code không rỗng, nên trim và uppercase khi lưu
code unique
discountType phải thuộc enum (PERCENT | FIXED)
discountValue > 0
nếu PERCENT: discountValue <= 100
maxUsage >= 1
expiryDate phải là tương lai
Success Response (201)
{
"success": true,
"data": {
"id": "voucher-id"
},
"message": "Voucher created",
"errors": null
}
Error cases
code trùng → 409 VOUCHER_CODE_EXISTS
validation fail → 400 VALIDATION_ERROR

4.3 PATCH /api/admin/vouchers/{id}
Mục đích
Cập nhật voucher.
Request Body (partial)
{
"discountValue": 15,
"maxUsage": 200,
"expiryDate": "2026-09-01T00:00:00Z"
}
Rules
Không cho phép đổi code nếu đã phát hành (khuyến nghị)
Nếu usedCount đã lớn, không được set maxUsage < usedCount
Nếu voucher đã EXPIRED, có thể cho gia hạn (tuỳ chính sách)
Success Response (200)
{
"success": true,
"data": null,
"message": "Voucher updated",
"errors": null
}
Error cases:
voucher không tồn tại → 404 VOUCHER_NOT_FOUND
maxUsage < usedCount → 409 INVALID_MAX_USAGE

4.4 DELETE /api/admin/vouchers/{id}
Mục đích
Xóa voucher.
Rules
Khuyến nghị:
Không hard delete nếu voucher đã từng được dùng
MVP có thể cho phép delete nếu usedCount = 0
Nếu usedCount > 0 → trả 409 và yêu cầu disable (nếu có field status)
Success Response
{
"success": true,
"data": null,
"message": "Voucher deleted",
"errors": null
}
Error cases:
usedCount > 0 → 409 VOUCHER_ALREADY_USED

5️⃣ Voucher trong Booking (điểm chốt contract)
Khi tạo booking:
FE gửi voucherCode (hoặc voucherId)
Backend tự:
validate voucher
tính discount
lưu voucherId vào booking (nullable)
tăng usedCount khi booking PAID (khuyến nghị)
Khuyến nghị logic usedCount:
Không tăng usedCount khi booking PENDING_PAYMENT
Chỉ tăng usedCount khi booking PAID (trong transaction payment success)
Nếu payment FAILED/EXPIRED:
không tăng usedCount

6️⃣ Error Codes chuẩn
Các code dùng trong module Voucher:
VOUCHER_NOT_FOUND
VOUCHER_EXPIRED
VOUCHER_OUT_OF_STOCK
VOUCHER_INVALID
VOUCHER_CODE_EXISTS
VOUCHER_ALREADY_USED
INVALID_SEATS
INVALID_MAX_USAGE
VALIDATION_ERROR

7️⃣ Definition of Done
Voucher module hoàn chỉnh khi:
User apply voucher trả đúng subtotal/discount/finalTotal
Voucher hết hạn/hết lượt trả lỗi đúng code
Admin CRUD voucher hoạt động với pagination
Booking chốt voucher đúng ở bước tạo booking + payment success
usedCount không bị tăng sai khi payment fail
