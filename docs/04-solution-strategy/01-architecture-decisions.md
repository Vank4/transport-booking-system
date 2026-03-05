# 01 — Architecture Decisions Index

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 4 — Solution Strategy

---

## Overview

This section consolidates the key architectural decisions that shape the system. Each decision is recorded as an Architecture Decision Record (ADR) in [09-decisions/](../09-decisions/).

---

## Decision Summary

| ADR | Decision | Status | Date |
|---|---|---|---|
| [ADR-0001](../09-decisions/ADR-0001-tech-stack.md) | **Tech Stack** — Node.js + Express + MongoDB + Mongoose + Socket.IO + React/Next.js | Accepted | 2026-03-04 |
| [ADR-0002](../09-decisions/ADR-0002-db-modeling.md) | **Database Modeling** — Separate MongoDB collections per domain; seats collection independent; ObjectId references | Accepted | 2026-03-04 |
| [ADR-0003](../09-decisions/ADR-0003-seat-hold-rules.md) | **Seat Hold Strategy** — Database-driven TTL hold; atomic conditional update; lazy expiration + optional cron cleanup | Accepted | 2026-02-28 |

---

## Core Strategy Principles

### 1. Thin client, thick server

The frontend is presentation-only. It never:
- Decides seat status
- Calculates final prices
- Creates bookings unilaterally

All state transitions happen on the backend.

### 2. Layered backend (Routes → Controllers → Services → Models)

Business logic lives exclusively in the `services/` layer. Controllers only orchestrate request parsing and response formatting. Models contain only schema definitions.

> ⚠ The `services/` directory is currently empty in the codebase. This is the highest-priority structural gap.

### 3. Atomic writes for critical state transitions

Any operation that touches more than one collection (confirm payment, seat booking, ticket creation) must use a Mongoose session + transaction. No partial updates.

### 4. WebSocket for seat map sync, REST for everything else

The HTTP API is the source of truth. WebSocket events are notifications that prompt clients to update their local state — the client must be able to re-sync via `GET /api/trips/{type}/{tripId}/seats` at any time.

### 5. Idempotent payment callbacks

The payment callback endpoint is designed to be called multiple times safely. The guard is: if `booking.status !== 'PENDING_PAYMENT'`, return `200 OK` immediately without re-processing.
