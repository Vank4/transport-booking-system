Search & Trips Endpoints
Transport Booking System (Flight & Train)

1️⃣ Tổng quan
Module Search & Trips cung cấp API cho:
Tìm kiếm chuyến bay / chuyến tàu theo tuyến và thời gian
Lấy danh sách kết quả (có filter/sort/pagination)
Xem chi tiết 1 chuyến (để vào trang Trip Details + Seat Map)
Lấy thông tin tổng quan số ghế còn trống (để hiển thị ngoài trang kết quả)
Base paths:
Flights: /api/flights
Train trips: /api/train-trips
Trip detail chung: /api/trips/{type}/{id} (optional – nếu muốn chuẩn hóa 1 endpoint)

2️⃣ Quy ước input tìm kiếm (áp dụng cho cả Flight và TrainTrip)
Các query param dùng chung:
fromId: id điểm đi
với flight → airportId
với train → stationId
toId: id điểm đến
với flight → airportId
với train → stationId
date: ngày khởi hành (YYYY-MM-DD)
passengers: số hành khách (default 1)
class: hạng vé (ECONOMY | BUSINESS) (optional)
page, limit: phân trang
sort: trường sắp xếp (departureTime | price)
order: asc | desc
Ví dụ:
/api/flights/search?fromId=SGN_AIRPORT_UUID&toId=HAN_AIRPORT_UUID&date=2026-05-01&passengers=2&sort=departureTime&order=asc&page=1&limit=10

3️⃣ Flights APIs
3.1 GET /api/flights/search
Mục đích
Tìm kiếm danh sách chuyến bay theo tuyến và ngày.
Query params
fromId (required)
toId (required)
date (required)
passengers (optional)
class (optional)
page, limit (optional)
sort, order (optional)
minPrice, maxPrice (optional)
airlineId (optional)
timeFrom, timeTo (optional, HH:mm)
Ví dụ:
/api/flights/search?fromId=<airportId>&toId=<airportId>&date=2026-05-01&airlineId=<airlineId>&minPrice=500000&maxPrice=3000000&sort=price&order=asc
Business rules (backend)
Chỉ trả về flight có status = SCHEDULED (trừ khi admin)
date lọc theo departureTime trong ngày đó
Nếu passengers > số ghế available → flight vẫn có thể xuất hiện nhưng FE nên hiển thị “Không đủ ghế” (tùy scope)
Success Response (200)
{
"success": true,
"data": {
"items": [
{
"id": "flight-id",
"type": "FLIGHT",
"airline": {
"id": "airline-id",
"name": "Vietnam Airlines",
"code": "VN"
},
"route": {
"from": {
"id": "airport-id",
"code": "SGN",
"name": "Tan Son Nhat"
},
"to": {
"id": "airport-id",
"code": "HAN",
"name": "Noi Bai"
}
},
"departureTime": "2026-05-01T08:00:00Z",
"arrivalTime": "2026-05-01T10:00:00Z",
"durationMinutes": 120,
"priceFrom": 1200000,
"availableSeats": 25,
"status": "SCHEDULED"
}
],
"pagination": {
"page": 1,
"limit": 10,
"totalItems": 1,
"totalPages": 1
}
},
"message": "Flights found",
"errors": null
}
Error cases
thiếu fromId/toId/date → 400 VALIDATION_ERROR

3.2 GET /api/flights/{id}
Mục đích
Lấy chi tiết 1 chuyến bay để hiển thị trang Trip Details.
Success Response (200)
{
"success": true,
"data": {
"id": "flight-id",
"type": "FLIGHT",
"airline": {
"id": "airline-id",
"name": "Vietnam Airlines",
"code": "VN"
},
"route": {
"from": {
"id": "airport-id",
"code": "SGN",
"name": "Tan Son Nhat",
"city": "Ho Chi Minh"
},
"to": {
"id": "airport-id",
"code": "HAN",
"name": "Noi Bai",
"city": "Ha Noi"
}
},
"departureTime": "2026-05-01T08:00:00Z",
"arrivalTime": "2026-05-01T10:00:00Z",
"basePrice": 1200000,
"status": "SCHEDULED",
"seatClasses": [
{
"class": "ECONOMY",
"priceFrom": 1200000
},
{
"class": "BUSINESS",
"priceFrom": 2500000
}
],
"policies": {
"holdTtlMinutes": 15,
"changeRefund": "Optional text"
}
},
"message": "Flight detail",
"errors": null
}
Error cases:
không tìm thấy → 404 TRIP_NOT_FOUND

3.3 GET /api/flights
Mục đích
Danh sách flight (public hoặc dùng nội bộ).
Khuyến nghị FE dùng /search để đúng nghiệp vụ.
Hỗ trợ page/limit/sort.

4️⃣ Train Trips APIs
4.1 GET /api/train-trips/search
Mục đích
Tìm kiếm danh sách chuyến tàu theo tuyến và ngày.
Query params
fromId (stationId, required)
toId (stationId, required)
date (required)
passengers (optional)
class (optional)
page, limit (optional)
sort, order (optional)
minPrice, maxPrice (optional)
trainId (optional)
timeFrom, timeTo (optional, HH:mm)
Ví dụ:
/api/train-trips/search?fromId=<stationId>&toId=<stationId>&date=2026-05-01&trainId=<trainId>&sort=departureTime&order=asc
Success Response (200)
{
"success": true,
"data": {
"items": [
{
"id": "trainTrip-id",
"type": "TRAIN",
"train": {
"id": "train-id",
"name": "SE1",
"code": "SE1"
},
"route": {
"from": {
"id": "station-id",
"name": "Sai Gon Station",
"city": "Ho Chi Minh"
},
"to": {
"id": "station-id",
"name": "Ha Noi Station",
"city": "Ha Noi"
}
},
"departureTime": "2026-05-01T06:00:00Z",
"arrivalTime": "2026-05-02T06:00:00Z",
"durationMinutes": 1440,
"priceFrom": 950000,
"availableSeats": 120,
"status": "SCHEDULED"
}
],
"pagination": {
"page": 1,
"limit": 10,
"totalItems": 1,
"totalPages": 1
}
},
"message": "Train trips found",
"errors": null
}

4.2 GET /api/train-trips/{id}
Mục đích
Lấy chi tiết chuyến tàu để hiển thị Trip Details.
Success Response
{
"success": true,
"data": {
"id": "trainTrip-id",
"type": "TRAIN",
"train": {
"id": "train-id",
"name": "SE1",
"code": "SE1"
},
"route": {
"from": {
"id": "station-id",
"name": "Sai Gon Station",
"city": "Ho Chi Minh"
},
"to": {
"id": "station-id",
"name": "Ha Noi Station",
"city": "Ha Noi"
}
},
"departureTime": "2026-05-01T06:00:00Z",
"arrivalTime": "2026-05-02T06:00:00Z",
"basePrice": 950000,
"status": "SCHEDULED",
"seatClasses": [
{
"class": "ECONOMY",
"priceFrom": 950000
}
],
"policies": {
"holdTtlMinutes": 15
}
},
"message": "Train trip detail",
"errors": null
}
Error cases:
không tìm thấy → 404 TRIP_NOT_FOUND

5️⃣ Public Reference Data (để FE build search form)
FE cần danh sách điểm đi/đến và hãng/ tàu để render dropdown. Các endpoint sau là public.

5.1 GET /api/public/airports
Mục đích:
Lấy danh sách sân bay để FE làm dropdown
Response data:
id
code
name
city
country

5.2 GET /api/public/airlines
Mục đích:
Lấy danh sách airlines cho filter

5.3 GET /api/public/train-stations
Mục đích:
Lấy danh sách ga tàu cho dropdown

5.4 GET /api/public/trains
Mục đích:
Lấy danh sách tàu cho filter

6️⃣ Business Rules quan trọng (để FE/BE không lệch)
Search luôn ưu tiên trả chuyến có status = SCHEDULED
availableSeats lấy theo seat.status = AVAILABLE
priceFrom là giá nhỏ nhất theo class trong chuyến (để hiển thị list)
Trip Details phải trả:
seatClasses (để FE render giá theo hạng)
policies.holdTtlMinutes (để FE hiển thị countdown chuẩn)

7️⃣ Error Codes chuẩn
VALIDATION_ERROR
TRIP_NOT_FOUND
INVALID_DATE
INVALID_FILTER

8️⃣ Definition of Done
Search & Trips API hoàn chỉnh khi:
Flight search chạy đúng tuyến + ngày
TrainTrip search chạy đúng tuyến + ngày
Có filter/sort/pagination theo chuẩn
Trip detail đủ dữ liệu để vào seat map
FE có đủ endpoint public để build form search
