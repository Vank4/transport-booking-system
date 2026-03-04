Folder Structure
Transport Booking System

1️⃣ Mục tiêu
Tài liệu này định nghĩa:
Cấu trúc tổng thể repo
Cấu trúc Backend
Cấu trúc Frontend
Cấu trúc Docs
Quy tắc thêm module mới
Mọi thành viên phải tuân thủ cấu trúc này.

2️⃣ Root Structure (Toàn bộ repo)
Cấu trúc chuẩn:
transport-booking/
backend/
frontend/
docs/
docker-compose.yml
README.md
Giải thích:
backend → toàn bộ API + Prisma
frontend → toàn bộ UI
docs → toàn bộ tài liệu kỹ thuật
docker-compose.yml → chạy Postgres (dev)
README.md → hướng dẫn setup tổng quan

3️⃣ Backend Structure
3.1 Tổng thể backend
backend/
src/
prisma/
package.json
tsconfig.json
.env
.env.example

3.2 Thư mục src/
src/
app.ts
server.ts
modules/
common/
config/
sockets/
routes/

3.3 app.ts
Chứa:
Khởi tạo Express
Setup middleware (cors, json, logger)
Setup routes
Setup error handler
Không chứa logic nghiệp vụ.

3.4 server.ts
Chỉ làm:
Load env
Kết nối DB (nếu cần)
Listen port

4️⃣ Modules Structure (Backend)
Mỗi module phải nằm trong:
src/modules/
Ví dụ:
modules/
auth/
booking/
seat/
payment/
voucher/
admin/
flight/
train/

4.1 Cấu trúc 1 module chuẩn
Ví dụ module booking:
booking/
booking.controller.ts
booking.service.ts
booking.routes.ts
booking.validation.ts
booking.types.ts
Giải thích:
controller → nhận request
service → business logic
routes → định nghĩa endpoint
validation → schema validate
types → interface/type riêng module
Không viết tất cả trong 1 file.

5️⃣ Common Folder
src/common/
middlewares/
utils/
constants/
errors/
logger/

5.1 middlewares/
Ví dụ:
auth.middleware.ts
role.middleware.ts
error.middleware.ts

5.2 utils/
generateTicketCode.ts
calculateDiscount.ts
dateHelpers.ts

5.3 errors/
AppError.ts
errorCodes.ts

6️⃣ Prisma Structure
6.1 Thư mục prisma/
prisma/
schema.prisma
migrations/
seed.ts

6.2 Quy tắc
Không đặt schema trong src/
Không xóa migration cũ
Không sửa migration đã commit
Prisma chỉ tồn tại trong backend.

7️⃣ Sockets Structure (Realtime Seat)
src/sockets/
socket.server.ts
seat.socket.ts
Giải thích:
socket.server.ts → khởi tạo Socket.IO
seat.socket.ts → xử lý event SEAT_HELD, SEAT_RELEASED, SEAT_BOOKED
Không trộn logic socket vào controller.

8️⃣ Frontend Structure
8.1 Tổng thể frontend
frontend/
src/
public/
package.json
vite.config.ts
.env
.env.example

8.2 src/
src/
main.tsx
App.tsx
pages/
components/
layouts/
hooks/
services/
store/
routes/
utils/
types/

8.3 pages/
Ví dụ:
pages/
HomePage.tsx
SearchResultsPage.tsx
TripDetailPage.tsx
SeatSelectionPage.tsx
CheckoutPage.tsx
BookingSuccessPage.tsx
BookingFailPage.tsx
MyBookingsPage.tsx
AdminDashboardPage.tsx

8.4 services/
Tất cả API call nằm trong:
services/
api.ts
auth.service.ts
booking.service.ts
seat.service.ts
voucher.service.ts
Không gọi fetch trực tiếp trong component.

9️⃣ Docs Structure
9.1 docs/
docs/
00-overview.md
01-roles-permissions.md
02-functional-modules.md
03-sitemap-pages.md
10-architecture.md
11-realtime-seat-hold.md
12-payment-flow.md
20-database/
30-api/
coding-conventions.md
env.md
folder-structure.md
Docs không được để lẫn trong backend hoặc frontend.

🔟 Quy tắc thêm module mới
Khi thêm module:
Tạo folder trong:
backend/src/modules/<module-name>
Tạo:
controller
service
routes
validation
Update:
API docs
Database docs (nếu có schema)
Tạo migration nếu cần
Không được thêm file rải rác ngoài cấu trúc chuẩn.

1️⃣1️⃣ Những điều không được làm
Không để logic nghiệp vụ trong controller
Không gọi Prisma trực tiếp từ route
Không đặt file test trong production folder (nên có test/)
Không tạo folder ngoài quy định

1️⃣2️⃣ Definition of Done (Structure)
Structure được coi là chuẩn khi:
Mỗi module tách riêng rõ ràng
Backend và Frontend độc lập
Docs đầy đủ và nằm đúng chỗ
Prisma nằm đúng thư mục
Lead có thể tìm file trong < 10 giây
