# 01 — Data Model

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 11 — Database

> **All data is stored in MongoDB 7.** Collection names are lowercase plural. Documents use `_id: ObjectId` as the primary key. Timestamps (`createdAt`, `updatedAt`) are managed by Mongoose `{ timestamps: true }`.

---

## Collection: `users`

Stores registered users and their authentication credentials.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `email` | String | Yes | Unique index |
| `password` | String | Yes | bcrypt hash — never returned in API responses |
| `fullName` | String | Yes | |
| `phoneNumber` | String | No | |
| `role` | String | Yes | `USER` (default) or `ADMIN` |
| `status` | String | Yes | `ACTIVE` (default) or `INACTIVE` |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

---

## Collection: `flights`

Represents a scheduled flight offering.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `flight_number` | String | Yes | e.g., `VN123` |
| `airline_id` | ObjectId → `airlines` | Yes | |
| `origin_airport_id` | ObjectId → `airports` | Yes | |
| `destination_airport_id` | ObjectId → `airports` | Yes | |
| `departure_time` | Date | Yes | UTC |
| `arrival_time` | Date | Yes | UTC |
| `duration_minutes` | Number | Yes | |
| `prices` | Object | Yes | `{ economy, business, first }` in VND |
| `status` | String | Yes | `SCHEDULED`, `DEPARTED`, `LANDED`, `CANCELLED` |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

---

## Collection: `seats`

One document per physical seat on a specific trip.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `trip_id` | ObjectId | Yes | References `flights._id` or `train_trips._id` |
| `trip_type` | String | Yes | `flight` or `train` |
| `seat_number` | String | Yes | e.g., `12A`, `5B` |
| `seat_class` | String | Yes | `economy`/`business`/`first` (flight) or `hard_seat`/`soft_seat`/`hard_sleeper`/`soft_sleeper`/`vip_cabin` (train) |
| `price` | Number | Yes | Override price in VND (inherits from trip if null) |
| `status` | String | Yes | `AVAILABLE`, `HOLDING`, `BOOKED` |
| `held_by` | ObjectId → `users` | No | Populated during HOLDING state |
| `hold_expired_at` | **Date** | No | UTC expiry of hold (**must be Date, not Number**) |
| `carriage_id` | ObjectId → `train_carriages` | Cond. | Required for train seats |

**Key indexes:**
- `{ trip_id: 1, status: 1 }` — seat map query
- `{ held_by: 1, hold_expired_at: 1 }` — TTL expiry job

---

## Collection: `bookings`

Represents a completed booking session (one or more passengers + seats).

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `user_id` | ObjectId → `users` | Yes | |
| `trip_id` | ObjectId | Yes | |
| `trip_type` | String | Yes | `flight` or `train` |
| `seat_ids` | ObjectId[] → `seats` | Yes | |
| `ticket_ids` | ObjectId[] → `tickets` | Yes | |
| `payment_id` | ObjectId → `payments` | Yes | |
| `voucher_id` | ObjectId → `vouchers` | No | |
| `original_amount` | Number | Yes | Pre-discount total in VND |
| `discount_amount` | Number | Yes | Default `0` |
| `total_amount` | Number | Yes | Final amount paid |
| `status` | String | Yes | `PENDING`, `CONFIRMED`, `CANCELLED`, `REFUNDED` |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

---

## Collection: `tickets`

One document per passenger+seat combination within a booking.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `booking_id` | ObjectId → `bookings` | Yes | |
| `seat_id` | ObjectId → `seats` | Yes | |
| `passenger` | Object | Yes | Embedded: `{ fullName, dateOfBirth, passportNumber, nationality }` |
| `qr_token` | String | No | Generated on `CONFIRMED`. Used for check-in QR. |
| `createdAt` | Date | Auto | |

---

## Collection: `payments`

One-to-one with bookings. Tracks payment provider state.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `booking_id` | ObjectId → `bookings` | Yes | |
| `provider` | String | Yes | `vnpay` or `stripe` |
| `provider_session_id` | String | No | Provider's payment session ID |
| `provider_refund_id` | String | No | Populated on refund |
| `amount` | Number | Yes | Amount in VND |
| `currency` | String | Yes | `VND` |
| `status` | String | Yes | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

---

## Collection: `vouchers`

Discount codes applicable to bookings.

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | Auto | |
| `code` | String | Yes | Unique, uppercase |
| `discountType` | String | Yes | `PERCENTAGE` or `FIXED_AMOUNT` |
| `discountValue` | Number | Yes | Percent or VND |
| `minOrderAmount` | Number | No | Minimum order to apply |
| `maxUsage` | Number | No | Null = unlimited |
| `usageCount` | Number | Yes | Default `0` |
| `expiresAt` | Date | No | Null = no expiry |
| `applicableTripTypes` | String[] | No | Null = all types |
| `status` | String | Yes | `ACTIVE` or `INACTIVE` |
| `createdAt` | Date | Auto | |

---

## Supporting Collections

| Collection | Purpose | Key Fields |
|---|---|---|
| `airlines` | Airline master data | `name`, `code` (IATA), `logo_url` |
| `airports` | Airport master data | `name`, `code` (IATA), `city`, `country` |
| `trains` | Train master data | `name`, `train_number` |
| `train_stations` | Station master data | `name`, `code`, `city` |
| `train_trips` | Scheduled train journeys | `train_id`, `origin_station_id`, `destination_station_id`, `departure_time`, `arrival_time`, `prices` |
| `train_carriages` | Carriages per train type | `train_id`, `carriage_number`, `carriage_type`, `capacity` |
