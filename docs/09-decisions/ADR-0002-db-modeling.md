# ADR-0002 — Database Modeling Approach

**Last Updated:** 2026-03-04  
**Status:** Accepted  
**Section:** arc42 Chapter 9 — Architecture Decisions  
**Deciders:** Core development team

---

## Context

With MongoDB chosen as the database, we needed to decide: how should the data be modeled? MongoDB supports two extremes:
1. **Fully embedded** — all related data nested within a single document.
2. **Fully referenced** — each entity in its own collection, linked by ObjectId (similar to relational).

The domain has clear entities (Users, Flights, Seats, Bookings, Tickets, Payments, Vouchers) that have multiple relationships. Both extremes have drawbacks in this domain.

---

## Decision

**Hybrid approach:** Referenced collections for primary entities, embedded documents for static or tightly coupled sub-entities.

### Embedding rules (embed when):
- The sub-entity is always accessed with the parent.
- The sub-entity has a 1:1 relationship with the parent that rarely changes.
- The sub-entity does not need to be independently queried.

### Referencing rules (reference when):
- The entity is large or grows unboundedly (e.g., seats per trip).
- The entity is independently queried.
- Multiple parent documents reference the same entity.

---

## Applied Modeling Decisions

| Relationship | Approach | Rationale |
|---|---|---|
| Booking → User | Reference (`user_id: ObjectId`) | Users exist independently; bookings are queried by user. |
| Booking → Seats | Reference array (`seat_ids: [ObjectId]`) | Seats exist independently and must be queried/updated atomically. |
| Booking → Tickets | Reference array (`ticket_ids: [ObjectId]`) | Tickets may be viewed independently (e.g., download one ticket). |
| Booking → Payment | Reference (`payment_id: ObjectId`) | Payment is independently updated via webhook; 1:1 with booking. |
| Ticket → Passenger | **Embed** (`passenger: { name, dob, passport }`) | Passenger data is immutable after booking and always needed with the ticket. |
| Flight → Airline | Reference (`airline_id: ObjectId`) | Airlines are shared across many flights. |
| Flight → Origin/Destination | Reference (`origin_airport_id`, `destination_airport_id`) | Airports are shared data referenced by thousands of flights. |
| Seat → Trip | Reference (`trip_id + trip_type`) | Seats belong to one trip; queried en masse per trip. |
| TrainTrip → Carriages | Reference (`carriages: [ObjectId]`) | Carriages are queried independently for seat maps. |

---

## Consequences

### Positive
- Clear separation of concerns between collections.
- Seat documents can be individually updated atomically (critical for hold/release).
- Queries for passengers can be done via a single Ticket document without joins.

### Negative / Risks
- Multiple round-trips for some queries (e.g., booking detail requires ticket + seat + flight population).
- `.populate()` chains in Mongoose can become long — must be careful with query performance.
- No foreign key enforcement — application code must maintain referential integrity.

---

## Index Strategy

Critical indexes to be maintained:

| Collection | Index | Cardinality | Query Pattern |
|---|---|---|---|
| `seats` | `{ trip_id: 1, status: 1 }` | High | Seat map per trip; filter by status |
| `seats` | `{ held_by: 1, hold_expired_at: 1 }` | Low | TTL expiry job batch release |
| `bookings` | `{ user_id: 1 }` | Medium | My bookings list |
| `bookings` | `{ status: 1 }` | Low | Admin filter by status |
| `flights` | `{ origin_airport_id: 1, destination_airport_id: 1, departure_time: 1 }` | High | Search query |
| `train_trips` | `{ origin_station_id: 1, destination_station_id: 1, departure_time: 1 }` | Medium | Search query |
| `users` | `{ email: 1 }` (unique) | High | Login lookup |
| `vouchers` | `{ code: 1 }` (unique) | Medium | Voucher apply lookup |
