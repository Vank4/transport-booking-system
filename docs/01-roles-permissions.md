01 – Roles & Permissions
Transport Booking System

1️⃣ Tổng quan phân quyền
Hệ thống sử dụng mô hình Role-Based Access Control (RBAC).
Hiện tại hệ thống định nghĩa 2 nhóm quyền chính:
USER (Khách hàng)
ADMIN (Quản trị viên)
Trong tương lai có thể mở rộng thêm các role như:
SUPER_ADMIN
STAFF
SUPPORT

2️⃣ Danh sách Role
Role Mô tả
USER Người dùng đặt vé
ADMIN Quản trị hệ thống

3️⃣ Quy tắc phân quyền chung
Người chưa đăng nhập chỉ có quyền truy cập các route public.
USER chỉ được thao tác trên dữ liệu của chính mình.
ADMIN có quyền truy cập và quản lý toàn bộ hệ thống.
Mọi API cần xác thực phải kiểm tra JWT.
Mọi API quản trị phải kiểm tra role ADMIN.

4️⃣ Quyền của USER (Chi tiết)
4.1 Authentication
Chức năng Quyền
Đăng ký Public
Đăng nhập Public
Đăng xuất USER
Xem profile USER
Cập nhật profile USER

4.2 Tìm kiếm & Xem chuyến đi
Chức năng Quyền
Tìm kiếm chuyến Public
Xem kết quả Public
Xem chi tiết chuyến Public
Xem sơ đồ ghế Public

4.3 Chọn ghế & Giữ ghế
Chức năng Quyền
Giữ ghế (hold seat) USER
Hủy giữ ghế USER
Xem trạng thái ghế realtime Public

⚠️ USER chỉ được giữ ghế trong thời gian giới hạn (ví dụ 15 phút).

4.4 Booking & Thanh toán
Chức năng Quyền
Tạo booking USER
Áp dụng voucher USER
Thanh toán USER
Xem kết quả thanh toán USER
Nhận vé điện tử USER

⚠️ USER chỉ được xem booking của chính mình.

4.5 Quản lý booking cá nhân
Chức năng Quyền
Xem danh sách booking USER
Xem chi tiết booking USER
Yêu cầu hủy booking USER
Yêu cầu đổi vé USER

4.6 Hành khách thường xuyên
Chức năng Quyền
Lưu hành khách USER
Sửa hành khách USER
Xóa hành khách USER

5️⃣ Quyền của ADMIN (Chi tiết)
ADMIN có toàn quyền quản trị hệ thống.

5.1 Quản lý người dùng
Chức năng Quyền
Xem danh sách user ADMIN
Khóa / Mở khóa user ADMIN
Thay đổi role ADMIN
Xóa user ADMIN

5.2 Quản lý hạ tầng
Module Quyền
Airlines CRUD
Airports CRUD
Trains CRUD
Train Stations CRUD
Train Carriages CRUD

5.3 Quản lý chuyến đi
Module Quyền
Flights CRUD
Train Trips CRUD
Cập nhật trạng thái (Scheduled/Delayed/Cancelled) ADMIN

5.4 Quản lý ghế & giá vé
Chức năng Quyền
Cấu hình sơ đồ ghế ADMIN
Thiết lập giá vé ADMIN
Cập nhật trạng thái ghế ADMIN

5.5 Quản lý voucher
Chức năng Quyền
Tạo voucher ADMIN
Sửa voucher ADMIN
Xóa voucher ADMIN
Giới hạn số lượng ADMIN

5.6 Quản lý booking
Chức năng Quyền
Xem toàn bộ booking ADMIN
Hủy booking ADMIN
Hoàn tiền thủ công ADMIN
Cập nhật trạng thái payment ADMIN

5.7 Báo cáo & Thống kê
Chức năng Quyền
Xem doanh thu ADMIN
Xem tỷ lệ lấp đầy ghế ADMIN
Thống kê theo ngày/tháng ADMIN

6️⃣ Quy tắc kiểm tra quyền trong Backend
6.1 Middleware bắt buộc
authenticate() → kiểm tra JWT
authorize(role) → kiểm tra role
Ví dụ:
router.post("/admin/flights", authenticate, authorize("ADMIN"), createFlight);

6.2 Quy tắc bảo mật dữ liệu
USER:
Không được truy cập booking của user khác.
Không được truy cập route /admin/\*.
ADMIN:
Không được truy cập bằng route USER nếu đã login admin panel riêng (nếu tách domain).

7️⃣ Route Protection phía Frontend
Frontend phải:
Chặn route /admin/\* nếu không phải ADMIN
Chặn route /user/\* nếu chưa login
Redirect về login nếu token hết hạn

8️⃣ State Machine liên quan đến Role
USER có thể ở trạng thái:
ACTIVE
BLOCKED
Nếu BLOCKED:
Không được login
Không được tạo booking
ADMIN có thể:
ACTIVE
DISABLED

9️⃣ Nguyên tắc mở rộng trong tương lai
Nếu thêm role mới:
Cập nhật bảng roles
Cập nhật middleware
Cập nhật docs file này
Không sửa trực tiếp logic cũ mà không cập nhật tài liệu

🔐 1️⃣0️⃣ Kết luận
Tài liệu này định nghĩa rõ:
Ai được làm gì
API nào yêu cầu role nào
Module nào thuộc phạm vi USER
Module nào thuộc phạm vi ADMIN
Mọi kiểm tra quyền trong hệ thống phải bám sát nội dung tài liệu này.
