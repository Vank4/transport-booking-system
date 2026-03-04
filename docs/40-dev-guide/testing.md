Testing Strategy
Transport Booking System

1️⃣ Mục tiêu
Testing trong dự án này tập trung vào:
Đảm bảo không double booking ghế
Đảm bảo transaction payment không lỗi
Đảm bảo API contract không bị phá vỡ
Đảm bảo voucher tính đúng
Đảm bảo role & permission đúng
Vì hệ thống có tính concurrency cao (seat hold), testing là bắt buộc.

2️⃣ Các loại test trong dự án
Chúng ta chia thành:
Unit Test
Integration Test
API Test (Postman)
Manual Flow Test
Concurrency Test
Regression Test

3️⃣ Unit Test (Backend)
3.1 Mục tiêu
Test:
Business logic trong service
Utility functions
Validation logic
Không test controller riêng lẻ nếu hông cần.

3.2 Những phần bắt buộc có unit test
calculateDiscount()
generateTicketCode()
seat hold validation logic
booking price calculation
voucher validation logic

3.3 Ví dụ test quan trọng
Test seat hold:
Khi seat AVAILABLE → hold thành công
Khi seat HOLDING chưa hết hạn → throw SEAT_NOT_AVAILABLE
Khi seat BOOKED → throw SEAT_NOT_AVAILABLE

4️⃣ Integration Test
4.1 Mục tiêu
Test:
API + Database thật
Prisma transaction hoạt động đúng
Payment confirm chạy đúng flow
4.2 Các flow bắt buộc test
Flow 1 – Booking thành công
Hold seat
Create booking
Mock confirm payment SUCCESS
Kiểm tra:
booking.status = PAID
seat.status = BOOKED
ticket được tạo
Flow 2 – Payment thất bại
Hold seat
Create booking
Mock confirm payment FAILED
Kiểm tra:
booking.status = FAILED
seat.status = AVAILABLE
Flow 3 – Hold hết hạn
Hold seat
Chờ quá TTL
Tạo booking
Nhận lỗi HOLD_EXPIRED

5️⃣ API Testing (Postman)
5.1 Bắt buộc test các endpoint:
Auth
Search flights/train
Seat hold
Seat release
Create booking
Payment callback
Apply voucher
Admin CRUD voucher
5.2 Response Format Check
Tất cả API phải trả:
{
"success": true,
"data": {},
"message": "",
"errors": null
}
Không được trả format khác.

6️⃣ Concurrency Testing (Cực kỳ quan trọng)
6.1 Test Double Hold
Mở 2 browser:
Cùng chọn ghế A1
Người 1 hold thành công
Người 2 phải nhận 409

6.2 Test Double Payment Callback
Gửi callback SUCCESS 2 lần:
Lần 1 → confirm
Lần 2 → không tạo ticket trùng
Phải idempotent.

6.3 Test Bulk Hold
Hold nhiều ghế
Nếu 1 ghế fail:
Kiểm tra logic all-or-nothing hoặc partial đúng theo thiết kế

7️⃣ Voucher Testing
Test các trường hợp:
Voucher hợp lệ
Voucher hết hạn
Voucher hết lượt
Voucher giảm PERCENT
Voucher giảm FIXED
Voucher không được vượt subtotal

8️⃣ Permission Testing
Test:
USER không gọi được /api/admin/\*
ADMIN gọi được tất cả
USER không xem được booking của người khác
Không login → 401

9️⃣ Regression Checklist (Trước khi Merge)
Trước khi merge PR vào develop:
Search vẫn hoạt động
Seat hold không lỗi
Booking tạo được
Payment confirm vẫn đúng
Voucher vẫn tính đúng
Migration không lỗi

🔟 Manual End-to-End Test Flow
Test full flow như user thật:
Đăng ký
Login
Search flight
Chọn chuyến
Chọn ghế
Áp voucher
Thanh toán
Nhận vé điện tử
Vào My Bookings xem vé
Nếu flow này chạy trơn tru → hệ thống ổn.

1️⃣1️⃣ Performance Testing (Cơ bản)
Test:
50 request search liên tục
20 người cùng hold ghế
10 booking song song
Kiểm tra:
Không crash server
Không deadlock DB
Không duplicate booking

1️⃣2️⃣ Bug Severity Level
Chia mức độ:
Critical → Double booking ghế
High → Payment confirm sai
Medium → Voucher tính sai
Low → UI hiển thị lệch
Critical & High phải fix ngay.

1️⃣3️⃣ Definition of Done (Testing)
Module được coi là test đạt khi:
Không double booking
Transaction booking atomic
Payment idempotent
Role permission đúng
API contract không bị phá
Không có lỗi console
