Coding Conventions
Transport Booking System

1️⃣ Mục tiêu
Tài liệu này định nghĩa:
Quy tắc đặt tên
Cấu trúc thư mục
Quy tắc viết backend (Node + Prisma)
Quy tắc viết frontend
Quy tắc xử lý error
Quy tắc logging
Quy tắc commit & PR
Tất cả thành viên phải tuân thủ.

2️⃣ General Naming Conventions
2.1 Biến và hàm
Dùng camelCase
Ví dụ đúng:
getUserById
createBooking
holdSeat
releaseSeat
totalAmount
holdUntil
Không dùng:
GetUserById
create_booking
HOLD_SEAT

2.2 Constant
Dùng UPPER_SNAKE_CASE
Ví dụ:
MAX_HOLD_MINUTES
JWT_SECRET
DEFAULT_PAGE_SIZE

2.3 Enum
Tên enum: PascalCase
Giá trị enum: UPPER_SNAKE_CASE
Ví dụ:
enum SeatStatus {
AVAILABLE
HOLDING
BOOKED
}

2.4 File Name
Dùng kebab-case
Ví dụ:
booking.service.ts
seat.controller.ts
payment.module.ts
auth.middleware.ts
Không dùng:
BookingService.ts
seatController.ts

3️⃣ Backend Structure Convention
3.1 Thư mục chuẩn
src/
modules/
auth/
booking/
seat/
payment/
voucher/
admin/
common/
middlewares/
utils/
constants/
prisma/

3.2 Module Structure
Mỗi module phải có:
booking/
booking.controller.ts
booking.service.ts
booking.routes.ts
booking.validation.ts
Không viết toàn bộ logic vào controller.

4️⃣ Layer Responsibilities (Bắt buộc)
Controller
Chỉ làm:
Nhận request
Validate input
Gọi service
Trả response theo chuẩn API
Không làm:
Logic nghiệp vụ phức tạp
Truy vấn Prisma trực tiếp
Service
Chứa:
Toàn bộ business logic
Transaction
Tương tác Prisma
Không phụ thuộc vào Express request/response.
Prisma Layer
Không gọi Prisma từ Controller
Chỉ gọi từ Service

5️⃣ Error Handling Convention
5.1 Không throw lỗi raw
Không làm:
throw new Error("Seat not available")
Phải dùng error chuẩn hệ thống:
throw new AppError("SEAT_NOT_AVAILABLE", 409)

5.2 Error phải có:
message
code
http status
Response phải theo chuẩn trong api-conventions.md.

6️⃣ Transaction Rules
Các nghiệp vụ sau bắt buộc dùng:
prisma.$transaction()
Áp dụng cho:
Confirm payment
Update seat → BOOKED
Create ticket
Refund booking
Không được update từng bảng riêng lẻ.

7️⃣ Validation Rules
Không validate bằng if rải rác.
Phải dùng thư viện validate (ví dụ Zod / Joi).
Ví dụ:
bookingSchema.parse(req.body)

8️⃣ Logging Convention
8.1 Không dùng console.log trong production
Dùng logger chuẩn:
logger.info()
logger.error()
logger.warn()

8.2 Không log dữ liệu nhạy cảm
Không log:
password
accessToken
full payment payload

9️⃣ Frontend Convention
9.1 API Call
Tất cả API gọi qua 1 file wrapper
Không gọi fetch/axios trực tiếp trong component
Ví dụ:
api.booking.create()
api.seat.hold()

9.2 Không hardcode URL
Không làm:
fetch("http://localhost:3000/api/bookings")
Phải dùng:
API_BASE_URL

9.3 State Management
Không lưu trạng thái seat local mà không sync lại server
Khi reload seat map phải gọi lại GET seat map

🔟 Git Convention
10.1 Branch Naming
Format:
feature/<module-name>
fix/<issue-name>
hotfix/<description>
Ví dụ:
feature/booking-flow
fix/seat-hold-expire

10.2 Commit Message
Format:
type(scope): short description
Ví dụ:
feat(booking): implement create booking API
fix(seat): prevent double hold race condition
refactor(auth): improve jwt middleware

10.3 Pull Request Rules
PR phải:
Không quá lớn
Có mô tả rõ ràng
Có test local
Không chứa console.log
Không chứa code chưa dùng

1️⃣1️⃣ Code Cleanliness Rules
Không để code comment thừa
Không để TODO chưa xử lý
Không để function quá dài (> 50 dòng)
Không lồng if quá sâu (tối đa 3 cấp)

1️⃣2️⃣ Definition of Done (Coding)
Code được coi là đạt chuẩn khi:
Tuân thủ naming convention
Không vi phạm layer rule
Có transaction đúng chỗ
Error format đúng chuẩn
Không phá vỡ API contract
Không gây migration conflict
