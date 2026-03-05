# 03 — Stakeholders

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 1 — Introduction & Goals

---

## 1. External Actors

| Actor | Role | Primary Concerns |
|---|---|---|
| **End User (Passenger)** | Searches for and books flight / train tickets | Seat availability accuracy, booking confirmation speed, ticket delivery |
| **Admin Staff** | Manages the platform catalog, trips, bookings, and reports | Data correctness, easy CRUD tools, accurate analytics |
| **Payment Gateway** | Processes payments on behalf of users; sends signed callbacks to the backend | Correct signature verification, idempotent callback handling, accurate refund support |

---

## 2. Internal Stakeholders (Development Team)

| Role | Concern |
|---|---|
| **Backend Developer** | Clear API contract, defined layer boundaries (Routes → Controllers → Services → Models), MongoDB schema consistency |
| **Frontend Developer** | Stable API response shapes, WebSocket event contract, error code catalogue |
| **Team Lead** | Architectural decisions are documented (ADRs), migrations do not conflict, PR review is predictable |
| **DevOps / Infrastructure** | Docker Compose setup reproduces the environment correctly; `.env.example` files are up to date |

---

## 3. System Interfaces

| Interface | Direction | Protocol | Notes |
|---|---|---|---|
| Browser → Frontend | Inbound | HTTPS | Next.js App Router, served via nginx in production |
| Frontend → Backend API | Outbound | HTTP REST + JWT | Base URL: `VITE_API_BASE_URL` |
| Frontend → Backend WebSocket | Outbound | WebSocket (Socket.IO) | URL: `VITE_SOCKET_URL` |
| Backend → MongoDB | Outbound | MongoDB Wire Protocol (Mongoose) | Internal Docker network only |
| Backend → Payment Gateway | Outbound | HTTPS redirect | Redirects user browser to gateway |
| Payment Gateway → Backend | Inbound | HTTPS POST (webhook/callback) | Must verify `signature`; must be idempotent |
