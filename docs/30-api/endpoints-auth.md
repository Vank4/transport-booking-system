Authentication Endpoints
Transport Booking System

1️⃣ Tổng quan
Module Authentication chịu trách nhiệm:
Đăng ký tài khoản
Đăng nhập
Lấy thông tin người dùng hiện tại
Cập nhật hồ sơ
Phân quyền theo role
Base path:
/api/auth/
Tất cả response phải tuân theo format chuẩn trong api-conventions.md.

2️⃣ POST /api/auth/register
Mục đích
Tạo tài khoản mới với role mặc định là USER.
Request Body
{
"email": "user@example.com",
"password": "12345678",
"fullName": "Nguyen Van A",
"phone": "0900000000"
}
Validation Rules
Email phải đúng format
Password tối thiểu 6 ký tự
Email không được trùng
Success Response (201)
{
"success": true,
"data": {
"id": "user-id",
"email": "user@example.com",
"role": "USER"
},
"message": "User registered successfully",
"errors": null
}
Error Cases
Email đã tồn tại → 409 CONFLICT
error code: EMAIL_ALREADY_EXISTS
Validation fail → 400 BAD REQUEST
error code: VALIDATION_ERROR

3️⃣ POST /api/auth/login
Mục đích
Đăng nhập và trả về JWT access token.
Request Body
{
"email": "user@example.com",
"password": "12345678"
}
Success Response (200)
{
"success": true,
"data": {
"accessToken": "jwt_token_here",
"user": {
"id": "user-id",
"email": "user@example.com",
"fullName": "Nguyen Van A",
"role": "USER"
}
},
"message": "Login successful",
"errors": null
}
Error Cases
Sai email hoặc password → 401 UNAUTHORIZED
error code: INVALID_CREDENTIALS
User bị BLOCKED → 403 FORBIDDEN
error code: ACCOUNT_BLOCKED

4️⃣ GET /api/auth/me
Mục đích
Lấy thông tin user hiện tại.
Header bắt buộc
Authorization: Bearer <access_token>
Success Response
{
"success": true,
"data": {
"id": "user-id",
"email": "user@example.com",
"fullName": "Nguyen Van A",
"phone": "0900000000",
"role": "USER",
"status": "ACTIVE"
},
"message": "User profile",
"errors": null
}
Error Cases
Không có token → 401 UNAUTHORIZED
Token không hợp lệ → 401 UNAUTHORIZED

5️⃣ PATCH /api/auth/profile
Mục đích
Cập nhật thông tin cá nhân.
Request Body (có thể gửi 1 phần)
{
"fullName": "Nguyen Van B",
"phone": "0911111111"
}
Success Response
{
"success": true,
"data": null,
"message": "Profile updated",
"errors": null
}

6️⃣ PATCH /api/auth/change-password
Mục đích
Đổi mật khẩu.
Request Body
{
"currentPassword": "12345678",
"newPassword": "newPassword123"
}
Validation Rules
newPassword phải >= 6 ký tự
currentPassword phải đúng
Error Cases
Sai mật khẩu cũ → 400 BAD REQUEST
error code: INVALID_CURRENT_PASSWORD

7️⃣ JWT Convention
Access Token
Thời hạn: ví dụ 1 giờ
Chứa:
userId
role
tokenVersion (nếu có)
Middleware Flow
Parse token
Verify signature
Lấy userId
Kiểm tra user.status != BLOCKED
Gắn user vào request context

8️⃣ Role-based Access
USER → chỉ truy cập API user
ADMIN → có thể truy cập /api/admin/\*
Nếu role không đủ quyền → trả 403 FORBIDDEN

9️⃣ Security Requirements
Password phải hash bằng bcrypt
Không trả password trong response
Không log raw password
Không expose JWT secret
Không trả lỗi chi tiết quá mức (ví dụ “email không tồn tại”)

🔟 Definition of Done
Auth API được coi là hoàn chỉnh khi:
Đăng ký hoạt động đúng
Login trả JWT hợp lệ
/me trả đúng user
Role check hoạt động đúng
Account BLOCKED không login được
Không có lỗ hổng lộ password
