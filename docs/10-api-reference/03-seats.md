# 03 — Seat Endpoints

**Last Updated:** 2026-03-05  
**Status:** Active (Known Bug — see below)  
**Section:** arc42 Chapter 10 — API Reference

---

## POST /api/seats/hold

Hold one or more seats for the authenticated user.

**Auth required:** Yes

**Request body:**

```json
{
  "seatIds": ["64a1b2c3d4e5f6a7b8c9d0e1", "64a1b2c3d4e5f6a7b8c9d0e2"],
  "tripType": "flight",
  "tripId": "64a1b2c3d4e5f6a7b8c9d0e3"
}
```

| Field | Type | Required | Constraint |
|---|---|---|---|
| `seatIds` | string[] | Yes | 1–9 seat IDs |
| `tripType` | string | Yes | `flight` or `train` |
| `tripId` | string | Yes | ObjectId of the trip |

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "heldSeats": [
      {
        "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
        "seat_number": "12A",
        "status": "HOLDING",
        "holdUntil": "2026-04-15T07:15:00.000Z"
      }
    ]
  }
}
```

**Error responses:** `409 SEAT_NOT_AVAILABLE`, `422 SEAT_HOLD_LIMIT_EXCEEDED`, `401 MISSING_TOKEN`

> **Known Bug:** `hold_expired_at` is currently stored as a Unix millisecond integer (Number) instead of a `Date` object. Fix: `new Date(Date.now() + env.seatHoldTtlMinutes * 60 * 1000)` in `seat.controller.js`.

---

## POST /api/seats/release

Release one or more seats held by the authenticated user.

**Auth required:** Yes

**Request body:**

```json
{
  "seatIds": ["64a1b2c3d4e5f6a7b8c9d0e1"],
  "tripId": "64a1b2c3d4e5f6a7b8c9d0e3"
}
```

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "released": ["64a1b2c3d4e5f6a7b8c9d0e1"]
  }
}
```

**Error responses:** `403 SEAT_NOT_HELD_BY_USER`, `404 SEAT_NOT_FOUND`

**Security:** Only seats where `held_by === req.user.userId` are released. Attempting to release another user's hold returns `403`.
