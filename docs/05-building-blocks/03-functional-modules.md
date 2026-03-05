# 03 — Functional Modules

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 5 — Building Blocks

---

## Overview

The system is organized into five functional modules, each owning a self-contained slice of business logic across backend controllers, routes, frontend pages, and database collections.

---

## Module 1 — Authentication & User Management

**Scope:** Registration, login, JWT issuance, profile management, role assignment.

| Layer | Responsibilities |
|---|---|
| Routes | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Controller | `auth.controller.js` |
| Middleware | `authMiddleware.js` — verify JWT, attach `req.user` |
| Model | `users.model.js` (User collection) |
| Frontend | `/auth/login`, `/auth/register`, `/user/profile` |

**Role model:**

| Role | Description |
|---|---|
| `USER` | Default role on registration. Can search, book, view own bookings, cancel. |
| `ADMIN` | Elevated role. Can manage trips, view all bookings, issue refunds, manage vouchers. |

**Key rules:**
- Passwords are hashed with bcrypt (10 rounds minimum).
- JWT payload: `{ userId }`. Expiry: 1 hour.
- Role defaults to `USER` on `POST /api/auth/register`.
- `ADMIN` roles are assigned out-of-band (e.g., database script) — no public promotion endpoint.

---

## Module 2 — Trip Search & Discovery

**Scope:** Searching available flights and train trips, browsing seat classes, viewing schedules.

| Layer | Responsibilities |
|---|---|
| Routes | `GET /api/flights/search`, `GET /api/train-trips/search` |
| Controller | `search.controller.js` |
| Models | `flights.model.js`, `trainTrips.model.js`, `trainCarriages.model.js`, `seats.model.js`, `airports.model.js`, `trainStations.model.js` |
| Frontend | `/flights/search`, `/trains/search`, `/flights/[id]`, `/trains/[id]` |

**Search parameters (flights):**

| Parameter | Type | Description |
|---|---|---|
| `origin` | string | IATA airport code |
| `destination` | string | IATA airport code |
| `departure_date` | ISO 8601 date | Date only (YYYY-MM-DD) |
| `trip_type` | `one_way` \| `round_trip` | |
| `seat_class` | `economy` \| `business` \| `first` | Optional filter |
| `passengers` | integer | Minimum available seats required |

**Known issue:** `search.routes.js` is not mounted in `app.js`. The search module is not currently functional.

---

## Module 3 — Seat Hold & Management

**Scope:** Real-time seat availability display, holding seats for a booking session, releasing holds.

| Layer | Responsibilities |
|---|---|
| Routes | `POST /api/seats/hold`, `POST /api/seats/release`, `GET /api/trips/:type/:tripId/seats` |
| Controller | `seat.controller.js` |
| Model | `seats.model.js` |
| Realtime | Socket.IO room per `tripId` (planned; Socket.IO not yet installed) |
| Frontend | `SeatMap`, `SeatCell`, `useSeatMap`, `useSocket`, `seatStore` |

**Seat status lifecycle:**

```
stateDiagram-v2
  [*] --> AVAILABLE
  AVAILABLE --> HOLDING : POST /api/seats/hold (15-min TTL)
  HOLDING --> AVAILABLE : TTL expired (job required) or POST /api/seats/release
  HOLDING --> BOOKED    : POST /api/bookings / payment confirmed
  BOOKED    --> AVAILABLE : Booking cancelled (refund issued)
```

**Key rules:**
- A user may hold a maximum of 9 seats per trip at a time.
- Hold TTL: `SEAT_HOLD_TTL_MINUTES` (default 15, configurable via env).
- Holding is idempotent: re-holding an already-held seat by the same user resets the TTL.
- Holding must be an atomic MongoDB update (`$set` with `filter: { status: 'AVAILABLE' }`) to prevent race conditions.

**Known bug:** `seat.controller.js` stores `hold_expired_at` as a Unix millisecond integer rather than a `Date` object. The TTL release job does not yet exist.

---

## Module 4 — Booking & Ticketing

**Scope:** Creating multi-passenger bookings, applying vouchers, generating tickets, viewing booking history.

| Layer | Responsibilities |
|---|---|
| Routes | `POST /api/bookings`, `GET /api/bookings/me`, `GET /api/bookings/:id`, `DELETE /api/bookings/:id`, `GET /api/bookings/:id/ticket` |
| Controller | `booking.controller.js` |
| Models | `bookings.model.js`, `tickets.model.js`, `vouchers.model.js`, `payments.model.js` |
| Frontend | `/user/booking/*` (full flow), `/user/bookings` (list + detail) |

**Booking flow:**

```
1. Seats in HOLDING state (from Module 3)
2. POST /api/bookings
   - Validates seat hold ownership
   - Validates voucher (if provided)
   - Creates Booking (status: PENDING)
   - Creates Ticket records
   - Creates Payment record (status: PENDING)
   - Transitions seats to BOOKED
3. Payment provider webhook → PATCH /api/payments/callback
   - Booking status → CONFIRMED
   - Issues ticket PDF / QR (planned)
4. Booking cancellation → seats return to AVAILABLE
```

**Booking statuses:**

| Status | Description |
|---|---|
| `PENDING` | Created, awaiting payment |
| `CONFIRMED` | Payment received and verified |
| `CANCELLED` | Cancelled by user or admin |
| `REFUNDED` | Refund issued after cancellation |

**Known bug:** `GET /api/bookings/me` currently calls `Booking.find({})` — returns all users' bookings. Must filter by `user_id: req.user.userId`.

---

## Module 5 — Administration

**Scope:** Fleet management, trip scheduling, user management, analytics, voucher management.

| Layer | Responsibilities |
|---|---|
| Routes | `/api/admin/*` (not yet implemented) |
| Frontend | `/admin/*` (skeleton exists, not implemented) |

**Planned admin capabilities:**

| Feature | Description |
|---|---|
| User management | View, deactivate, role-change user accounts |
| Fleet management | CRUD for Airlines, Airports, Trains, Train Stations |
| Trip scheduling | Create/edit/cancel Flights and Train Trips |
| Booking oversight | View all bookings, issue refunds, export CSVs |
| Voucher management | CRUD vouchers, set usage limits and expiry |
| Analytics dashboard | Revenue by route, booking trends, seat utilization |

All admin routes must be protected by `authMiddleware` AND a role-check middleware that rejects non-`ADMIN` tokens.
