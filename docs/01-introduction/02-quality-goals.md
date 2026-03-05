# 02 — Quality Goals

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 1 — Introduction & Goals

---

## 1. Overview

This document defines the non-functional requirements (NFRs) that constrain architectural and implementation decisions. Every significant design choice in the system should be traceable to one of these goals.

---

## 2. Quality Goals (Priority Ordered)

| Priority | Quality Goal | Scenario | Measure |
|---|---|---|---|
| 1 | **Concurrency correctness** | Two users click the same seat simultaneously | Exactly one hold succeeds; the second receives `409 SEAT_NOT_AVAILABLE`. No double booking ever occurs. |
| 2 | **Payment reliability** | Payment gateway sends the same callback twice | Booking status, seat status, and ticket count are identical after the first and second callback — no duplicates created. |
| 3 | **Real-time consistency** | User A holds a seat; User B is viewing the same seat map | User B's UI updates within 1 second of User A's hold, via WebSocket broadcast. |
| 4 | **Data integrity** | Application process crashes mid-transaction | All database writes in a confirm-payment transaction (booking, payment, seats, tickets) either all succeed or all roll back. |
| 5 | **Developer onboarding speed** | A new team member joins | They can clone the repo, follow the local setup guide, and have a running dev environment in under 30 minutes. |
| 6 | **API contract stability** | A frontend developer calls a documented endpoint | The response shape matches the contract in `10-api-reference/`. A field is never silently removed or renamed without a version bump. |
| 7 | **Security** | An authenticated user makes a request | JWT is verified on every protected route; a `USER` role cannot access any `/api/admin/*` endpoint; a user cannot view another user's bookings. |

---

## 3. Tradeoffs Accepted for MVP

| Tradeoff | Rationale |
|---|---|
| MongoDB over PostgreSQL | Flexible schema during rapid iteration; Mongoose transactions satisfy MVP atomicity needs. See [ADR-0001](../09-decisions/ADR-0001-tech-stack.md). |
| Single backend process (no microservices) | Team size of 4–5; microservices would add operational overhead disproportionate to the project scale. |
| TTL-based hold via cron (not MongoDB TTL index) | Cron allows batch broadcast of WebSocket release events; a native TTL index cannot trigger socket emissions. |
| No refresh tokens (single JWT) | Simplifies auth for MVP; tokens expire in 1 hour. |
| Mock payment gateway in dev | Allows full end-to-end testing without real payment credentials. |
