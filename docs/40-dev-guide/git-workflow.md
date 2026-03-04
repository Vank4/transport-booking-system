Git Workflow
Transport Booking System

1️⃣ Mục tiêu
Tài liệu này quy định:
Cách tạo branch
Cách làm việc mỗi ngày
Cách pull code
Cách tạo Pull Request
Cách merge
Cách xử lý conflict
Tất cả thành viên bắt buộc tuân thủ.

2️⃣ Branch Strategy (Chuẩn cho team 5 người)
Chúng ta dùng mô hình đơn giản nhưng chặt chẽ:
main → branch production ổn định
develop → branch tích hợp cho team
feature/\* → branch cho từng chức năng
fix/\* → sửa bug
hotfix/\* → sửa gấp production

2.1 Ý nghĩa từng branch
main
→ chỉ chứa code ổn định
→ chỉ lead được merge vào
develop
→ nơi tích hợp code của team
→ thành viên merge vào đây
feature/booking-flow
→ làm xong → PR vào develop

3️⃣ Luồng làm việc chuẩn mỗi ngày
Bước 1: Luôn cập nhật develop trước
git checkout develop
git pull origin develop
Bước 2: Tạo branch mới từ develop
git checkout -b feature/seat-hold
Không bao giờ tạo branch từ main.
Bước 3: Code & commit nhỏ, rõ ràng
Ví dụ commit:
git commit -m "feat(seat): implement hold seat API"
Không commit:
update code
fix bug
aaaa
Bước 4: Push branch
git push origin feature/seat-hold
Bước 5: Tạo Pull Request
PR phải:
Có mô tả rõ ràng
Ghi rõ module ảnh hưởng
Không chứa console.log
Không chứa file rác

4️⃣ Quy tắc dành cho thành viên
4.1 Không bao giờ push thẳng vào main
Cấm dùng:
git push origin main

4.2 Không force push vào branch chung
Cấm:
git push origin develop --force

4.3 Mỗi feature 1 branch riêng
Không làm:
1 branch cho nhiều chức năng
1 branch dùng chung cho 2 người

4.4 Sau khi merge xong
Lead sẽ:
Merge PR vào develop
Xóa branch feature
Thành viên không tự xóa main/develop.

5️⃣ Quy tắc dành cho Lead (Nhóm trưởng)
Lead có trách nhiệm:
Review code
Kiểm tra coding convention
Kiểm tra migration
Kiểm tra API contract
Merge đúng quy trình

5.1 Merge Strategy
Khuyến nghị:
Squash merge để giữ lịch sử sạch
Không dùng merge commit lộn xộn

5.2 Trước khi merge
Lead phải:
Pull develop mới nhất
Test local
Kiểm tra không conflict

6️⃣ Xử lý Conflict Chuẩn
Nếu có conflict:
Không panic
Checkout branch của mình
Pull develop mới nhất:
git pull origin develop
Resolve conflict
Commit lại
Push lại branch
Không force push nếu không hiểu rõ.

7️⃣ Quy tắc Migration (Rất quan trọng)
Vì dùng Prisma:
Không sửa migration đã commit
Nếu cần sửa schema:
Pull develop mới nhất
Chạy migrate dev
Commit migration mới
Nếu 2 người cùng tạo migration:
Lead merge theo thứ tự
Người sau phải rebase lại develop

8️⃣ Commit Message Convention
Format:
type(scope): short description
Các type chuẩn:
feat → thêm chức năng
fix → sửa bug
refactor → cải tiến code
docs → sửa tài liệu
chore → cấu hình, build
Ví dụ:
feat(booking): implement create booking API
fix(seat): prevent double hold race condition
docs(api): update voucher endpoints

9️⃣ Release Flow (Khi gần hoàn thành)
Khi chuẩn bị release:
Lead merge develop → main
Tạo tag:
git tag v1.0.0
git push origin v1.0.0
main luôn phải ổn định

🔟 Những điều cấm trong repo này
Không commit file .env
Không commit node_modules
Không commit build/dist
Không xóa migration cũ
Không sửa schema trực tiếp trên DB production

1️⃣1️⃣ Checklist trước khi tạo PR
Đã pull develop mới nhất
Không có conflict
Code tuân thủ coding-conventions.md
Không có console.log
Không phá vỡ API contract
Không tạo migration thừa

1️⃣2️⃣ Definition of Done (Git)
Workflow được coi là chuẩn khi:
Không ai push thẳng main
Không force push develop
Conflict được xử lý đúng cách
Migration không đụng nhau
Lịch sử commit sạch
