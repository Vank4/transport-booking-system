# 10 — API Reference

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 10 — API Reference

---

## Overview

Base URL: `http://localhost:3000/api` (local) | `https://api.yourdomain.com/api` (production)

See [08-crosscutting/01-api-conventions.md](../08-crosscutting/01-api-conventions.md) for request/response formats, authentication, and status code conventions.

---

## Endpoint Groups

| File | Routes | Auth Required |
|---|---|---|
| [01-auth.md](./01-auth.md) | `/api/auth/*` | Partial |
| [02-search.md](./02-search.md) | `/api/flights/search`, `/api/train-trips/search` | No |
| [03-seats.md](./03-seats.md) | `/api/seats/*`, `/api/trips/:type/:tripId/seats` | Yes |
| [04-bookings.md](./04-bookings.md) | `/api/bookings/*` | Yes |
| [05-vouchers.md](./05-vouchers.md) | `/api/vouchers/*` | Yes |
| [06-admin.md](./06-admin.md) | `/api/admin/*` | ADMIN role |

---

## Implementation Status

| Route Group | Status |
|---|---|
| Auth | ✅ Implemented |
| Search | ⚠ Implemented but route not mounted in `app.js` |
| Seats | ✅ Implemented (with known bug — see `03-seats.md`) |
| Bookings | ⚠ Implemented but `getAllBookings` has security bug |
| Vouchers | ❌ Not implemented |
| Admin | ❌ Not implemented |
| Payments callback | ❌ Not implemented |
