# 04 — Booking Endpoints

**Last Updated:** 2026-03-05  
**Status:** Active (Known Security Bug — see below)  
**Section:** arc42 Chapter 10 — API Reference

---

## POST /api/bookings

Create a new booking from held seats.

**Auth required:** Yes

**Request body:**

```json
{
  "seatIds": ["64a1b2c3d4e5f6a7b8c9d0e1", "64a1b2c3d4e5f6a7b8c9d0e2"],
  "tripType": "flight",
  "tripId": "64a1b2c3d4e5f6a7b8c9d0e3",
  "passengers": [
    {
      "fullName": "Nguyen Van A",
      "dateOfBirth": "1990-05-15",
      "passportNumber": "B1234567",
      "seatId": "64a1b2c3d4e5f6a7b8c9d0e1"
    },
    {
      "fullName": "Tran Thi B",
      "dateOfBirth": "1992-08-20",
      "passportNumber": "C7654321",
      "seatId": "64a1b2c3d4e5f6a7b8c9d0e2"
    }
  ],
  "voucherId": "64a1b2c3d4e5f6a7b8c9d0e5"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `seatIds` | string[] | Yes | Must all be HOLDING by the requesting user |
| `tripType` | string | Yes | `flight` or `train` |
| `tripId` | string | Yes | ObjectId |
| `passengers` | object[] | Yes | Length must equal `seatIds.length` |
| `passengers[].seatId` | string | Yes | Must be in `seatIds` array |
| `voucherId` | string | No | ObjectId of a valid voucher |

**Response 201:**

```json
{
  "status": "success",
  "data": {
    "bookingId": "64a1b2c3d4e5f6a7b8c9d0e6",
    "paymentUrl": "https://sandbox.vnpay.vn/paymentv2/vpcpay.html?...",
    "totalAmount": 2280000,
    "originalAmount": 2400000,
    "discountAmount": 120000
  }
}
```

**Error responses:** `409 SEAT_NOT_HELD_BY_USER`, `400 PASSENGER_COUNT_MISMATCH`, `422 VOUCHER_EXPIRED`, `422 VOUCHER_EXHAUSTED`

---

## GET /api/bookings/me

Return the authenticated user's bookings.

**Auth required:** Yes

**Query parameters:** `page`, `limit`, `status` (filter by booking status)

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e6",
      "status": "CONFIRMED",
      "totalAmount": 2280000,
      "tripType": "flight",
      "createdAt": "2026-04-10T10:00:00.000Z",
      "tickets": [ { "_id": "...", "seatNumber": "12A" } ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3 }
}
```

> **Known Bug:** Currently calls `Booking.find({})` — returns all users' bookings. Must filter: `Booking.find({ user_id: req.user.userId })`.

---

## GET /api/bookings/:id

Get a specific booking by ID.

**Auth required:** Yes (must be booking owner or ADMIN)

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e6",
    "status": "CONFIRMED",
    "tripType": "flight",
    "trip": { "_id": "...", "flight_number": "VN123", "departure_time": "..." },
    "tickets": [
      {
        "_id": "...",
        "seat": { "seat_number": "12A", "seat_class": "economy" },
        "passenger": { "fullName": "Nguyen Van A", "passportNumber": "B1234567" }
      }
    ],
    "payment": { "status": "COMPLETED", "amount": 2280000 },
    "totalAmount": 2280000,
    "createdAt": "2026-04-10T10:00:00.000Z"
  }
}
```

**Error responses:** `404 BOOKING_NOT_FOUND`, `403 FORBIDDEN`

---

## GET /api/bookings/:id/ticket

Download ticket detail (for QR / PDF generation — planned).

**Auth required:** Yes (booking owner only)

**Response 200:** Ticket data with QR token. PDF generation is not yet implemented.

---

## DELETE /api/bookings/:id

Cancel a booking and initiate a refund.

**Auth required:** Yes (booking owner or ADMIN)

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "bookingId": "...",
    "status": "CANCELLED",
    "refundId": "re_abc123",
    "refundAmount": 2280000
  }
}
```

**Error responses:** `404 BOOKING_NOT_FOUND`, `422 BOOKING_NOT_CANCELLABLE`, `403 FORBIDDEN`
