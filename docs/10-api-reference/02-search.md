# 02 — Search Endpoints

**Last Updated:** 2026-03-05  
**Status:** ⚠ Route not mounted — returns 404 until `search.routes.js` is added to `app.js`  
**Section:** arc42 Chapter 10 — API Reference

---

## GET /api/flights/search

Search available flights.

**Auth required:** No

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `origin` | string | Yes | IATA airport code (e.g., `HAN`, `SGN`) |
| `destination` | string | Yes | IATA airport code |
| `departure_date` | string | Yes | `YYYY-MM-DD` |
| `trip_type` | string | No | `one_way` (default) or `round_trip` |
| `seat_class` | string | No | `economy`, `business`, `first` |
| `passengers` | integer | No | Min available seats required (default `1`) |
| `return_date` | string | Cond. | Required if `trip_type=round_trip`. `YYYY-MM-DD` |

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "flight_number": "VN123",
      "airline": { "_id": "...", "name": "Vietnam Airlines", "code": "VN" },
      "origin_airport": { "_id": "...", "name": "Noi Bai", "code": "HAN" },
      "destination_airport": { "_id": "...", "name": "Tan Son Nhat", "code": "SGN" },
      "departure_time": "2026-04-15T07:00:00.000Z",
      "arrival_time": "2026-04-15T09:10:00.000Z",
      "duration_minutes": 130,
      "available_seats": { "economy": 45, "business": 8, "first": 2 },
      "prices": { "economy": 1200000, "business": 3800000, "first": 7500000 }
    }
  ]
}
```

**Error responses:** `400 VALIDATION_ERROR`, `404 NO_TRIPS_FOUND`

---

## GET /api/train-trips/search

Search available train trips.

**Auth required:** No

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `origin` | string | Yes | Train station code or name |
| `destination` | string | Yes | Train station code or name |
| `departure_date` | string | Yes | `YYYY-MM-DD` |
| `seat_class` | string | No | `hard_seat`, `soft_seat`, `hard_sleeper`, `soft_sleeper`, `vip_cabin` |
| `passengers` | integer | No | Min available seats required (default `1`) |

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e2",
      "train_number": "SE1",
      "train": { "_id": "...", "name": "SE1 Express" },
      "origin_station": { "_id": "...", "name": "Ga Hà Nội", "code": "HNI" },
      "destination_station": { "_id": "...", "name": "Ga Sài Gòn", "code": "SGN" },
      "departure_time": "2026-04-15T19:00:00.000Z",
      "arrival_time": "2026-04-16T19:30:00.000Z",
      "duration_minutes": 1470,
      "available_seats": { "soft_sleeper": 12, "hard_sleeper": 36 },
      "prices": { "soft_sleeper": 800000, "hard_sleeper": 550000 }
    }
  ]
}
```

**Error responses:** `400 VALIDATION_ERROR`, `404 NO_TRIPS_FOUND`

---

## GET /api/trips/:type/:tripId/seats

Get the full seat map for a specific trip.

**Auth required:** No

**Path parameters:**

| Parameter | Values | Description |
|---|---|---|
| `type` | `flight` or `train` | Trip type |
| `tripId` | ObjectId | Trip document ID |

**Response 200:**

```json
{
  "status": "success",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e3",
      "seat_number": "12A",
      "seat_class": "economy",
      "status": "AVAILABLE",
      "price": 1200000
    },
    {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e4",
      "seat_number": "12B",
      "seat_class": "economy",
      "status": "HOLDING",
      "hold_expired_at": "2026-04-15T07:15:00.000Z"
    }
  ]
}
```

> **Note:** `held_by` is never returned to clients — it is a server-side field only.

**Error responses:** `400 INVALID_TRIP_TYPE`, `404 TRIP_NOT_FOUND`
