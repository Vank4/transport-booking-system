Phân tích và triển khai: THÀNH VIÊN 2 – SEAT & HOLD MODULE
I. Chức năng cần triển khai:

1. Hiển thị Seat Map
2. Chọn ghế
3. Giữ ghế 15 phút
4. Tự động hủy giữ ghế
5. Đồng bộ trạng thái ghế WebSocket
   II. Mô tả chi tiết các chức năng:
   1️⃣ Hiển thị Seat Map
   Đặc tả: Hệ thống cần hiển thị sơ đồ ghế của chuyến bay hoặc tàu. Trạng thái ghế (trống, đang giữ, đã đặt) phải được cập nhật thời gian thực.
   Mô tả:

- Input: Người dùng chọn chuyến bay/tàu.
- Output: Sơ đồ ghế với các trạng thái (Ghế trống, Ghế đã đặt, Ghế đang giữ).
  Hướng xử lý:
  Frontend sẽ sử dụng một thư viện hoặc custom component để vẽ sơ đồ ghế. Backend sẽ cung cấp dữ liệu ghế từ cơ sở dữ liệu và gửi các trạng thái ghế qua WebSocket.
  WebSocket sẽ tự động cập nhật các thay đổi trạng thái ghế theo thời gian thực khi người dùng chọn hoặc giữ ghế.
  2️⃣ Chọn ghế
  Đặc tả: Người dùng có thể chọn ghế trên sơ đồ và ghế sẽ được giữ trong 15 phút.
  Mô tả:
- Input: Người dùng nhấn vào ghế trên sơ đồ.
- Output: Ghế được đánh dấu là "Đang giữ" trong vòng 15 phút.
  Hướng xử lý:
  Frontend sẽ thay đổi trạng thái của ghế từ "Trống" sang "Đang giữ" và bắt đầu countdown 15 phút.
  Backend sẽ ghi nhận ghế đã được chọn và cập nhật trạng thái vào cơ sở dữ liệu.
  WebSocket sẽ đảm bảo rằng các thay đổi về trạng thái ghế sẽ được cập nhật và đồng bộ với tất cả người dùng đang xem sơ đồ.
  3️⃣ Giữ ghế 15 phút
  Đặc tả: Sau khi chọn ghế, hệ thống sẽ giữ ghế đó trong 15 phút.
  Mô tả:
- Input: Người dùng chọn ghế.
- Output: Ghế sẽ được giữ trong 15 phút.
  Hướng xử lý:
  Frontend sẽ hiển thị countdown 15 phút và ngừng cho phép người khác chọn ghế này trong thời gian giữ.
  Backend sẽ tính toán thời gian giữ ghế và lưu trữ thông tin này trong cơ sở dữ liệu.
  WebSocket sẽ thông báo cho các người dùng khác nếu ghế bị giữ.
  4️⃣ Tự động hủy giữ ghế
  Đặc tả: Nếu người dùng không thanh toán trong vòng 15 phút, ghế sẽ tự động được hủy giữ và trở lại trạng thái "Trống".
  Mô tả:
- Input: Ghế đang giữ và hết thời gian giữ (15 phút).
- Output: Ghế trở lại trạng thái "Trống".
  Hướng xử lý:
  Backend sẽ kiểm tra thời gian giữ ghế. Nếu quá 15 phút mà không có hành động thanh toán, ghế sẽ được cập nhật lại thành "Trống" trong cơ sở dữ liệu.
  Frontend sẽ cập nhật giao diện ghế về trạng thái "Trống".
  WebSocket sẽ thông báo trạng thái ghế thay đổi cho tất cả người dùng.
  5️⃣ Đồng bộ trạng thái ghế WebSocket
  Đặc tả: Tất cả các thay đổi trạng thái ghế cần được đồng bộ giữa các người dùng trong thời gian thực.
  Mô tả:
- Input: Thay đổi trạng thái ghế (chọn, hủy giữ, thanh toán).
- Output: Cập nhật trạng thái ghế thời gian thực cho tất cả người dùng đang xem sơ đồ ghế.
  Hướng xử lý:
  Frontend sử dụng WebSocket để lắng nghe sự kiện thay đổi trạng thái ghế từ server.
  Backend sẽ gửi thông báo qua WebSocket mỗi khi có thay đổi trạng thái ghế, đảm bảo tất cả người dùng được cập nhật ngay lập tức.
  III. Mô tả chi tiết các trang giao diện:
  1️⃣ Trang chọn ghế (Seat Map)
  Mục đích: Cho phép người dùng chọn ghế.
  Bố cục gồm:
- Sơ đồ ghế trực quan
- Legend trạng thái: Ghế trống / Đang giữ / Đã đặt
- Countdown 15 phút (thời gian giữ ghế)
- Summary bên phải (thông tin chuyến, ghế đã chọn, tổng tiền tạm tính)
- Nút “Tiếp tục”

2️⃣ Trang nhập thông tin hành khách
Mục đích: Thu thập thông tin người đi.
Bố cục gồm:

- Form cho từng hành khách (tên, giấy tờ, loại hành khách...)
- Tùy chọn thêm/sửa hành khách (nếu nhiều người)
- Summary bên phải

3️⃣ Trang áp dụng voucher
Mục đích: Cho phép nhập mã giảm giá.
Bố cục gồm:

- Input nhập mã voucher
- Nút “Áp dụng”
- Danh sách voucher khả dụng (nếu có)
- Thông báo thành công/lỗi (voucher sai, hết hạn, không đủ điều kiện)

4️⃣ Trang xác nhận booking
Mục đích: Kiểm tra lại toàn bộ thông tin trước khi thanh toán.
Bố cục gồm:

- Thông tin chuyến
- Danh sách ghế đã chọn
- Thông tin hành khách
- Tổng tiền (bao gồm phí & giảm giá)
- Nút “Thanh toán”

5️⃣ Trang chi tiết booking (vé điện tử + QR)
Mục đích: Hiển thị vé sau khi thanh toán thành công.
Bố cục gồm:

- Thông tin chuyến
- Thông tin hành khách
- QR code
- Nút tải PDF / tải vé
