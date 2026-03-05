# 01 — System Overview

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 1 — Introduction & Goals

---

## 1. Purpose

Transport Booking System is an online ticket booking platform for both **flights** and **trains** on a single interface. It simulates the core workflows of a commercial booking platform, including:

- Multi-modal transport search (airport-to-airport, station-to-station)
- Visual seat map with real-time availability
- Seat reservation with a 15-minute hold TTL
- Online payment integration (MoMo / VNPAY / Mock)
- E-ticket generation (PNR + QR Code)
- Administrative management and revenue analytics

---

## 2. Goals

### User-Facing Goals

| Goal | Description |
|---|---|
| Fast booking | Complete a booking in under 5 minutes from search to payment |
| Real-time seat visibility | Seat status synchronized across all active clients |
| Safe payment | Idempotent payment processing; no duplicate tickets |
| Booking history | Users can view, retrieve, and download their tickets |
| Voucher support | Apply promotional discount codes at checkout |

### Admin Goals

| Goal | Description |
|---|---|
| Infrastructure management | CRUD for airlines, airports, trains, stations, carriages |
| Trip scheduling | Create and manage flight / train trip schedules |
| Seat & pricing configuration | Configure seat layouts and class pricing |
| Booking oversight | View and manage all bookings across the platform |
| Revenue reporting | Dashboard with booking counts, revenue, and occupancy rates |

---

## 3. Scope

### In Scope (MVP)

- User registration, login, profile management
- Search flights and train trips by route and date
- Real-time seat map with hold/release/book state machine
- Full booking flow: seat selection → passenger info → voucher → checkout → payment
- Payment callback processing with transaction atomicity
- Admin CRUD for all catalog entities
- Admin dashboard with basic analytics

### Out of Scope (Post-MVP)

- Mobile native applications
- Multi-leg / connecting route search
- Loyalty points / frequent flyer programs
- Automated refund processing
- Push notifications
- Third-party SSO (Google, Facebook login)

---

## 4. Business Modules

| Module | Description |
|---|---|
| **Auth** | Registration, login, JWT issuance, profile management |
| **Infrastructure** | Airlines, airports, trains, stations, carriages |
| **Trips** | Flights and train trip scheduling and status management |
| **Seat Hold** | Real-time seat map, atomic hold, TTL expiry, WebSocket sync |
| **Booking** | Booking lifecycle from PENDING_PAYMENT → PAID / FAILED / EXPIRED |
| **Payment** | Gateway integration, idempotent callback, transaction confirm |
| **Voucher** | Discount code validation, application at checkout |
| **Reporting** | Admin revenue and occupancy analytics |

> Detailed specification of each module: see [05-building-blocks/03-functional-modules.md](../05-building-blocks/03-functional-modules.md).

---

## 5. Key System Characteristics

### Real-Time Seat Hold

When a user selects a seat, the backend atomically transitions it to `HOLDING` with a configurable TTL (default 15 minutes). All connected clients viewing the same trip receive a WebSocket event and update their seat map in real time. If payment is not completed within the TTL, a background cron job releases the seat back to `AVAILABLE`.

> Full algorithm specification: [06-runtime/01-seat-hold-flow.md](../06-runtime/01-seat-hold-flow.md).

### Multi-Modal Transport

The system handles two distinct transport types — **flights** (airline-based, airport-to-airport) and **train trips** (train-based, station-to-station) — under a unified booking and payment flow. The API uses a `type: FLIGHT | TRAIN` discriminator to differentiate them.

### Payment Idempotency

Payment gateway callbacks are treated as idempotent: a callback received more than once for the same `bookingId` is silently acknowledged if the booking is already in a terminal state (`PAID`, `FAILED`). This prevents duplicate ticket creation.

> Full payment flow specification: [06-runtime/02-payment-flow.md](../06-runtime/02-payment-flow.md).
