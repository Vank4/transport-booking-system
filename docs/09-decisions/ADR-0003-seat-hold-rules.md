# ADR-0003 — Seat Hold Rules

**Last Updated:** 2026-03-04  
**Status:** Accepted  
**Section:** arc42 Chapter 9 — Architecture Decisions  
**Deciders:** Core development team

---

## Context

Multiple users may attempt to select the same seat at the same time. Without a reservation mechanism, a user could spend time filling in passenger details only to discover at checkout that the seat was just purchased by someone else.

We needed to define:
1. The seat status model (what states exist).
2. The hold mechanism (how a temporary reservation is created).
3. The TTL strategy (when holds expire and how they are released).
4. The concurrency strategy (how race conditions are prevented).

---

## Decision

### 1. Seat Statuses

Three statuses only. The term **`HOLDING`** is canonical — do not use the alias `HELD`.

| Status | Description |
|---|---|
| `AVAILABLE` | Seat is open for anyone to hold. |
| `HOLDING` | Temporarily reserved by a specific user for `SEAT_HOLD_TTL_MINUTES`. |
| `BOOKED` | Permanently reserved; associated with a confirmed or pending-payment booking. |

### 2. Hold Mechanism

Holds are created via `POST /api/seats/hold`. The operation is a single atomic MongoDB `findOneAndUpdate`:

```javascript
Seat.findOneAndUpdate(
  { _id: seatId, status: 'AVAILABLE' },   // Filter: only match if still available
  {
    status: 'HOLDING',
    held_by: userId,
    hold_expired_at: new Date(Date.now() + env.seatHoldTtlMinutes * 60 * 1000)
  },
  { new: true }
)
```

If the returned document is `null`, the seat was taken concurrently — return `409 SEAT_NOT_AVAILABLE`.

### 3. TTL Strategy

- Hold TTL: `SEAT_HOLD_TTL_MINUTES` (default `15`, overridable via env).
- A background job polls for expired holds every 60 seconds and releases them in batch.
- Releasing a hold sets `{ status: 'AVAILABLE', held_by: null, hold_expired_at: null }`.
- Each release emits a `SEAT_RELEASED` Socket.IO event to the trip room.

### 4. Hold Constraints

| Rule | Value |
|---|---|
| Max seats held per user per trip | 9 |
| Re-hold by same user | Allowed — resets TTL |
| Re-hold by different user | Rejected — returns `409` |
| Hold must be active at booking creation | Enforced — `held_by === req.user.userId` check |

---

## Considered Alternatives

### Alternative: Optimistic Locking (No Pre-Hold)

Let users select seats and submit bookings without a pre-hold. At submission, check if seats are still available; if not, reject.

**Rejected because:** Poor UX — users complete full passenger forms only to fail at checkout. In high-demand scenarios (popular flights), this causes repeated retries.

### Alternative: Redis-Based Hold

Use Redis with `SET NX EX` for TTL-enforced atomic holds.

**Rejected (for now):** Adds a dependency (Redis) before the core booking flow is implemented. MongoDB's `findOneAndUpdate` is sufficient for MVP concurrency requirements. Revisit if seat contention under high load is measured.

### Alternative: Database-Level TTL Index

Use MongoDB TTL index on `hold_expired_at` to auto-delete or auto-zero the field.

**Rejected:** TTL indexes delete entire documents, not just fields. A partial update (resetting status to AVAILABLE) cannot be done with a TTL index. The background job approach gives explicit control.

---

## Consequences

### Positive
- Atomic MongoDB operation guarantees no two users can hold the same seat simultaneously.
- TTL background job keeps lock duration bounded regardless of client disconnects.
- Socket.IO events ensure all connected users see seat state changes in real time.

### Negative / Risks
- The background job (`backend/src/jobs/seatHoldExpiry.job.js`) does not exist yet — holds never expire automatically.
- `seat.controller.js` currently stores `hold_expired_at` as a Unix millisecond integer (Number) instead of a `Date` object — must be fixed.
- Without the job, holds accumulate indefinitely, blocking seats from other users.

---

## Action Items

- [ ] Fix `seat.controller.js`: `hold_expired_at` must use `new Date(...)` not `new Date().getTime()`.
- [ ] Implement `backend/src/jobs/seatHoldExpiry.job.js` using `node-cron`.
- [ ] Wire the job into `server.js` startup.
- [ ] Standardize all code and docs to use `HOLDING` (not `HELD`).
