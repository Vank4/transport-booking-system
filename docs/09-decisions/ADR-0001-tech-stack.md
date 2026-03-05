# ADR-0001 — Technology Stack Selection

**Last Updated:** 2026-03-04  
**Status:** Accepted  
**Section:** arc42 Chapter 9 — Architecture Decisions  
**Deciders:** Core development team

---

## Context

The project requires a full-stack web application for booking flights and train trips. We needed to select a technology stack that balances:
- Developer familiarity (team is JavaScript-proficient)
- Rapid initial development velocity
- Sufficient scalability for the expected user load
- A flexible data model suited to heterogeneous trip types (flight vs. train)

---

## Decision

**Backend:** Node.js 20 LTS + Express.js 4 (JavaScript CommonJS)  
**Database:** MongoDB 7 via Mongoose ODM 8  
**Frontend:** React 18 + TypeScript + Next.js (App Router)  
**Realtime:** Socket.IO (to be added)  
**Auth:** JWT (jsonwebtoken) + bcrypt  

---

## Considered Alternatives

### Backend: Node.js vs. Python (FastAPI)

| Factor | Node.js + Express | Python + FastAPI |
|---|---|---|
| Team familiarity | High | Low |
| Async I/O model | Native (event loop) | Native (async/await) |
| WebSocket support | Excellent (Socket.IO) | Good (websockets lib) |
| Ecosystem | Largest npm registry | Strong but smaller |

**Decision:** Node.js — higher team familiarity, better Socket.IO integration.

### Database: MongoDB vs. PostgreSQL + Prisma

| Factor | MongoDB + Mongoose | PostgreSQL + Prisma |
|---|---|---|
| Schema evolution | Flexible (schemaless) | Strict (migrations required) |
| Data model fit | Good (heterogeneous trip types) | Good (relational) |
| Nested documents | Natural | Requires joins |
| Operational complexity | Higher (no ACID multi-doc by default) | Lower |
| Journey history | Started with Prisma | Switched to MongoDB |

**Decision:** MongoDB — heterogeneous trip models (flights have airlines/airports; trains have carriages/stations) map more naturally to embedded documents. The team's familiarity also shifted toward MongoDB during development.

> **Note:** This project started with PostgreSQL + Prisma. The switch to MongoDB was made early in development. `prisma/schema.prisma` exists but is empty and should be deleted.

---

## Consequences

### Positive
- Single language (JavaScript/TypeScript) across the full stack reduces context switching.
- Flexible MongoDB schema accommodates flight vs. train model differences without complex table inheritance.
- Socket.IO integrates natively with Node.js for real-time seat map updates.

### Negative / Risks
- MongoDB lacks multi-document ACID transactions without explicit session management. Booking creation (seat update + booking insert + ticket insert + payment insert) must use MongoDB sessions to avoid partial writes.
- No type safety on the backend (JavaScript, not TypeScript) — requires strict discipline and unit tests.
- `prisma/` directory in the repository creates confusion for new contributors.

---

## Action Items

- [ ] Delete `prisma/schema.prisma` and `prisma/` directory.
- [ ] Remove `prisma` from `backend/package.json` dependencies (if still present).
- [ ] Update all docs that reference PostgreSQL or Prisma.
- [ ] Add MongoDB session management to `booking.controller.js`.
