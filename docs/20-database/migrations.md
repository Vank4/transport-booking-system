Migrations Guide
Prisma Migrate – Transport Booking System

1. Mục tiêu
   Tài liệu này quy định:
   Cách tạo và quản lý migration bằng Prisma
   Quy trình thay đổi schema.prisma trong team
   Cách xử lý conflict migration khi merge
   Best practices để database luôn đồng bộ trên máy của mọi người
   Nếu không tuân thủ, migration sẽ conflict liên tục và lead sẽ mất rất nhiều thời gian resolve.

2. Nguyên tắc vàng (Bắt buộc)
   Rule 1 — Không sửa migration cũ đã commit
   Migration đã commit và push lên repo là “đã đóng”.
   Nếu sai → tạo migration mới để sửa.
   Rule 2 — Pull trước khi migrate
   Trước khi chạy migrate, luôn:
   git pull
   npm i
   npx prisma generate
   Rồi mới:
   npx prisma migrate dev
   Rule 3 — Chỉ tạo migration khi schema đã được thống nhất
   Thêm bảng/field/relation phải được cập nhật trong:
   data-dictionary.md
   erd.md (nếu đổi relation)
   Sau đó mới sửa schema.prisma và tạo migration.
   Rule 4 — 1 PR chỉ nên có migration cho 1 thay đổi chính
   Tránh “gom quá nhiều thay đổi DB trong 1 migration” vì:
   khó review
   dễ conflict
   khó rollback

3. Quy trình tạo migration chuẩn
   3.1 Checklist trước khi tạo migration
   Cập nhật docs:
   data-dictionary.md
   erd.md (nếu thay đổi quan hệ)
   Pull code mới nhất:
   git pull
   Đảm bảo DB local đang sync:
   npx prisma migrate dev

3.2 Tạo migration
Sửa backend/prisma/schema.prisma
Tạo migration:
npx prisma migrate dev --name <migration_name>
Ví dụ:
npx prisma migrate dev --name add_vouchers_table
Prisma sẽ:
tạo thư mục migration mới trong prisma/migrations
apply migration lên DB local

3.3 Commit bắt buộc
Trong PR phải có đủ:
schema.prisma
thư mục migration mới
docs đã cập nhật

4. Quy tắc đặt tên migration
   Migration name theo format:
   <action>_<entity>_<short_description>
   Ví dụ:
   add_users_table
   add_hold_fields_to_seats
   create_booking_payment_ticket
   add_unique_ticket_seatId
   Tên phải:
   viết thường
   dùng \_
   mô tả rõ thay đổi

5. Reset DB & migrate lại từ đầu (chỉ dùng khi cần)
   Nếu DB local bị lỗi nặng hoặc migration conflict không thể fix nhanh:
   npx prisma migrate reset
   Lưu ý:
   Lệnh này xóa sạch dữ liệu local
   Chỉ dùng trong môi trường dev

6. Prisma Generate (bắt buộc)
   Mỗi khi schema đổi:
   npx prisma generate
   Nếu FE/BE báo lỗi type Prisma:
   90% là do quên prisma generate.

7. Seed dữ liệu (tuỳ chọn nhưng khuyến nghị)
   7.1 Khi nào cần seed?
   Khi team cần dữ liệu mẫu để test nhanh:
   airports
   airlines
   stations
   trips
   seat maps mẫu

7.2 Quy tắc seed
Seed phải chạy được sau migrate dev
Không hardcode dữ liệu nhạy cảm
Seed data nên tối thiểu, đủ demo
Khuyến nghị:
có prisma/seed.ts
chạy bằng:
npx prisma db seed 8) Xử lý conflict migration khi merge (QUAN TRỌNG)
Migration conflict thường xảy ra khi:
2 người cùng sửa schema
2 người cùng chạy migrate tạo 2 migration song song

8.1 Cách phòng tránh (khuyến nghị)
Chỉ 1 người sửa DB tại 1 thời điểm (lead hoặc người được phân công)
Nếu cần sửa song song:
chia rõ phạm vi: người A thêm bảng, người B thêm index
merge theo thứ tự

8.2 Nếu vẫn bị conflict thì xử lý thế nào?
Case A: Conflict file schema.prisma
Resolve bằng cách giữ cả thay đổi hợp lệ
Sau khi resolve:
npx prisma format
npx prisma generate
npx prisma migrate dev
Case B: Conflict trong thư mục migrations
Không sửa migration đã tồn tại.
Cách xử lý chuẩn:
Pull branch đã merge trước
Chạy migrate để sync DB local:
npx prisma migrate dev
Nếu migration của bạn không còn phù hợp → tạo migration mới thay vì sửa migration cũ.
Case C: 2 migration cùng tạo bảng/field giống nhau
Giữ migration đã merge vào dev/main
Xóa migration trùng (trong branch của bạn) và tạo migration mới theo tình trạng schema hiện tại
Lưu ý: việc “xóa migration trùng” chỉ làm khi migration đó chưa merge lên nhánh chính.

9. Quy trình review DB trong PR (Lead checklist)
   Lead khi review PR có thay đổi DB phải check:
   Docs đã cập nhật chưa? (data-dictionary, erd)
   schema.prisma có đúng naming convention không?
   Migration name có rõ không?
   Có index/unique constraint cần thiết không?
   PR có chạy được:
   npx prisma migrate dev
   npx prisma generate

10. Definition of Done (Migration Done)
    Một thay đổi DB được coi là hoàn tất khi:
    Schema.prisma cập nhật đúng
    Migration tạo mới và apply được
    Docs đã cập nhật đầy đủ
    Team pull về chạy migrate thành công
    Không phát sinh conflict
11. Quick Commands (Cheatsheet)

# chạy migrate dev

npx prisma migrate dev

# tạo migration mới

npx prisma migrate dev --name add_xxx

# generate prisma client

npx prisma generate

# reset db dev

npx prisma migrate reset

# xem trạng thái migrate

npx prisma migrate status
