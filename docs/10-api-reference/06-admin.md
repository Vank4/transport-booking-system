# 06 — Admin Endpoints

**Last Updated:** 2026-03-05  
**Status:** Not Implemented  
**Section:** arc42 Chapter 10 — API Reference

> All admin endpoints require `Authorization: Bearer <token>` with an `ADMIN` role. Non-admin requests receive `403 FORBIDDEN`.

---

## User Management

### GET /api/admin/users

List all users with pagination.

**Query parameters:** `page`, `limit`, `status` (`ACTIVE` | `INACTIVE`), `role`

**Response 200:** Array of user objects (without `password` field).

---

### PATCH /api/admin/users/:id

Update a user's role or status.

**Request body:**

```json
{
  "role": "ADMIN",
  "status": "INACTIVE"
}
```

---

## Booking Management

### GET /api/admin/bookings

List all bookings across all users.

**Query parameters:** `page`, `limit`, `status`, `userId`, `tripId`

**Response 200:** Array of booking objects with user and trip details populated.

---

### POST /api/admin/bookings/:id/refund

Issue a full or partial refund for a confirmed booking.

**Request body:**

```json
{
  "refundAmount": 1200000,
  "reason": "Flight cancelled by airline"
}
```

---

## Fleet Management

### Airlines

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/airlines` | List all airlines |
| `POST` | `/api/admin/airlines` | Create airline |
| `PATCH` | `/api/admin/airlines/:id` | Update airline |
| `DELETE` | `/api/admin/airlines/:id` | Deactivate airline |

### Airports

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/airports` | List all airports |
| `POST` | `/api/admin/airports` | Create airport |
| `PATCH` | `/api/admin/airports/:id` | Update airport |

### Trains & Stations

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/trains` | List all trains |
| `POST` | `/api/admin/trains` | Create train |
| `GET` | `/api/admin/train-stations` | List all stations |
| `POST` | `/api/admin/train-stations` | Create station |

---

## Trip Scheduling

### Flights

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/flights` | List all flights |
| `POST` | `/api/admin/flights` | Create flight + auto-generate seats |
| `PATCH` | `/api/admin/flights/:id` | Update flight (time, price, status) |
| `DELETE` | `/api/admin/flights/:id` | Cancel flight + notify affected bookings |

### Train Trips

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/train-trips` | List all train trips |
| `POST` | `/api/admin/train-trips` | Create train trip |
| `PATCH` | `/api/admin/train-trips/:id` | Update train trip |
| `DELETE` | `/api/admin/train-trips/:id` | Cancel train trip |

---

## Analytics

### GET /api/admin/stats/revenue

Revenue summary by time period and route.

**Query parameters:** `from` (ISO date), `to` (ISO date), `tripType`

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "totalRevenue": 150000000,
    "bookingCount": 342,
    "byRoute": [
      { "route": "HAN→SGN", "revenue": 85000000, "bookings": 189 }
    ]
  }
}
```

### GET /api/admin/stats/seats

Seat utilization rates per trip.

**Response 200:** Array of trips with `totalSeats`, `bookedSeats`, `utilizationRate`.
