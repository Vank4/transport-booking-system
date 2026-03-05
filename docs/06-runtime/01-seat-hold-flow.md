# 01 — Seat Hold Flow

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 6 — Runtime View

---

## 1. Seat Status State Machine

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : Seat created / booking cancelled

    AVAILABLE --> HOLDING : POST /api/seats/hold\n(atomic update, 15-min TTL)
    HOLDING --> AVAILABLE : TTL expired (background job)\nor POST /api/seats/release
    HOLDING --> HOLDING : Re-hold by same user\n(TTL reset)
    HOLDING --> BOOKED : POST /api/bookings\n(payment initiated)
    BOOKED --> AVAILABLE : Booking cancelled\n+ refund issued
    BOOKED --> [*]
```

**Status definitions:**

| Status | Meaning | Who can transition out |
|---|---|---|
| `AVAILABLE` | No hold, open for booking | Any authenticated user (hold action) |
| `HOLDING` | Reserved for a specific user for 15 minutes | Same user (release / book) or background job (TTL expiry) |
| `BOOKED` | Confirmed in a booking | Admin (cancel + refund) |

---

## 2. Happy Path — Seat Hold

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (SeatMap)
    participant BE as Backend API
    participant DB as MongoDB (seats)
    participant WS as Socket.IO Server

    User->>FE: Click seat cell
    FE->>BE: POST /api/seats/hold\n{ seatIds: [s1], tripType: "flight", tripId: "abc" }
    BE->>DB: findOneAndUpdate(\n  { _id: s1, status: "AVAILABLE" },\n  { status: "HOLDING", held_by: userId,\n    hold_expired_at: now+15min },\n  { new: true }\n)
    DB-->>BE: Updated seat document
    BE->>WS: emit("SEAT_HELD", { seatId: s1, heldBy: userId, holdUntil })
    WS-->>FE: broadcast SEAT_HELD to tripId room (all clients)
    BE-->>FE: 200 { seat, holdUntil }
    FE->>FE: Update seatStore: seat → HOLDING\nStart countdown timer
```

---

## 3. TTL Expiry Flow

> **Current status: NOT IMPLEMENTED.** No background job exists. The hold TTL is set correctly in the database but holds are never automatically released.

```mermaid
sequenceDiagram
    participant Job as TTL Release Job\n(backend/src/jobs/)
    participant DB as MongoDB (seats)
    participant WS as Socket.IO Server

    loop Every 60 seconds
        Job->>DB: find({ status: "HOLDING",\n  hold_expired_at: { $lt: now } })
        DB-->>Job: Expired seat documents
        Job->>DB: updateMany(expiredIds,\n  { status: "AVAILABLE",\n    held_by: null,\n    hold_expired_at: null })
        Job->>WS: emit("SEAT_RELEASED", { seatId }) per seat
        WS-->>FE: broadcast to tripId room
    end
```

**Required implementation:** `backend/src/jobs/seatHoldExpiry.job.js` — scheduled with `node-cron` or `setInterval`.

---

## 4. Concurrent Hold Conflict

The atomic `findOneAndUpdate` with a `{ status: "AVAILABLE" }` filter prevents double-booking at the database level.

```mermaid
sequenceDiagram
    actor UserA
    actor UserB
    participant BE as Backend API
    participant DB as MongoDB (seats)

    UserA->>BE: POST /api/seats/hold { seatIds: [s1] }
    UserB->>BE: POST /api/seats/hold { seatIds: [s1] }

    Note over BE,DB: Both requests arrive near simultaneously

    BE->>DB: UserA: findOneAndUpdate\n{ _id: s1, status: "AVAILABLE" } → HOLDING
    DB-->>BE: ✅ Updated (UserA wins)

    BE->>DB: UserB: findOneAndUpdate\n{ _id: s1, status: "AVAILABLE" } → HOLDING
    DB-->>BE: null (document no longer matches filter)

    BE-->>UserA: 200 { seat, holdUntil }
    BE-->>UserB: 409 { error: "SEAT_NOT_AVAILABLE", message: "Seat s1 is no longer available" }
```

---

## 5. Release Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant BE as Backend API
    participant DB as MongoDB (seats)
    participant WS as Socket.IO Server

    User->>FE: Navigate away / cancel
    FE->>BE: POST /api/seats/release\n{ seatIds: [s1], tripId: "abc" }
    BE->>DB: updateMany(\n  { _id: {$in: [s1]}, held_by: userId },\n  { status: "AVAILABLE", held_by: null, hold_expired_at: null }\n)
    DB-->>BE: Modified count
    BE->>WS: emit("SEAT_RELEASED", { seatId: s1 }) per seat
    WS-->>FE: broadcast SEAT_RELEASED to room
    BE-->>FE: 200 { released: [s1] }
```

**Security rule:** The release endpoint must only release seats held by `req.user.userId`. A user cannot release seats held by another user.

---

## 6. Frontend Seat Map Sync on Join

When a user opens a trip detail page, the frontend must fetch full seat state before relying on WebSocket events.

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend API
    participant WS as Socket.IO Server

    FE->>BE: GET /api/trips/flight/:tripId/seats
    BE-->>FE: Full seats array (all seats with current status)
    FE->>FE: Initialize seatStore with full snapshot
    FE->>WS: emit("JOIN_TRIP_ROOM", { tripId })
    WS-->>FE: Acknowledge (no initial data push)
    Note over FE,WS: From here, FE updates\nonly via socket events
```

This two-step pattern (REST snapshot + WebSocket delta updates) prevents stale data after reconnects.
