# Transport Booking System

A full-stack web application for searching and booking **flights** and **train trips**, featuring real-time seat selection, secure checkout, and an admin management dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20 LTS, Express.js 4, JavaScript (CommonJS) |
| Database | MongoDB 7, Mongoose ODM 8 |
| Auth | JWT (jsonwebtoken 9), bcrypt 6 |
| Realtime | Socket.IO *(planned)* |
| Frontend | React 18, TypeScript, Next.js (App Router) |
| State | Zustand *(planned)* |

---

## Project Structure

```
transport-booking-system/
├── backend/          # Node.js REST API + Socket.IO server
├── frontend/         # Next.js frontend application
└── docs/             # Full documentation (arc42 framework)
```

---

## Quick Start

### Prerequisites

- Node.js 20 LTS
- MongoDB 7 running locally (or Docker)

### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set MONGO_URI and JWT_SECRET at minimum
```

Required variables in `backend/.env`:

| Variable | Example |
|---|---|
| `MONGO_URI` | `mongodb://localhost:27017/transport_booking` |
| `JWT_SECRET` | *(48-char random string)* |
| `PORT` | `3000` |
| `CORS_ORIGIN` | `http://localhost:3001` |

Generate a secure `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Seed the database

```bash
cd backend && npm run seed
```

This creates airlines, airports, trains, stations, sample flights + trips, seats, and two test users:

| Email | Password | Role |
|---|---|---|
| `user@test.com` | `password123` | USER |
| `admin@test.com` | `admin123` | ADMIN |

### 4. Start the servers

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:3001)
cd frontend && npm run dev
```

### 5. Verify

```bash
curl http://localhost:3000/api/health
# Expected: { "status": "ok", "database": "connected" }
```

---

## Available Scripts

### Backend (`cd backend`)

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot-reload) |
| `npm start` | Start in production mode |
| `npm run seed` | Seed the database with test data |

### Frontend (`cd frontend`)

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Start production build |

---

## API Overview

Base URL: `http://localhost:3000/api`

| Route group | Prefix | Auth |
|---|---|---|
| Authentication | `/api/auth` | Partial |
| Search | `/api/flights/search`, `/api/train-trips/search` | No |
| Seats | `/api/seats` | Yes |
| Bookings | `/api/bookings` | Yes |
| Vouchers | `/api/vouchers` | Yes |
| Admin | `/api/admin` | ADMIN role |

Full API reference: [`docs/10-api-reference/`](./docs/10-api-reference/README.md)

---

## Known Issues

> These bugs must be fixed before deploying to production.

| # | Issue | File |
|---|---|---|
| 1 | `search.routes.js` not mounted — `/api/flights/search` returns 404 | `backend/src/app.js` |
| 2 | `routes/index.js` calls `app.listen(3000)` — causes port collision | `backend/src/routes/index.js` |
| 3 | `hold_expired_at` stored as a Number instead of a `Date` | `backend/src/controllers/seat.controller.js` |
| 4 | `GET /api/bookings` returns all users' bookings (no auth filter) | `backend/src/controllers/booking.controller.js` |
| 5 | `authMiddleware` reads `process.env.JWT_SECRET` directly | `backend/src/middleware/authMiddleware.js` |
| 6 | No seat hold TTL expiry job — holds never auto-release | `backend/src/jobs/` *(empty)* |

---

## Documentation

Full documentation follows the **arc42** framework and lives in the [`docs/`](./docs/README.md) directory.

| Section | Description |
|---|---|
| [Architecture overview](./docs/01-introduction/01-system-overview.md) | System goals and tech stack |
| [Seat hold flow](./docs/06-runtime/01-seat-hold-flow.md) | Real-time seat reservation design |
| [Payment flow](./docs/06-runtime/02-payment-flow.md) | Checkout and webhook handling |
| [Local setup guide](./docs/07-deployment/03-local-setup.md) | Step-by-step setup instructions |
| [Environment variables](./docs/07-deployment/02-environment-variables.md) | All required `.env` variables |
| [API conventions](./docs/08-crosscutting/01-api-conventions.md) | Request/response format, error codes |
| [Database model](./docs/11-database/01-data-model.md) | MongoDB collections reference |
| [ADR-0001: Tech stack](./docs/09-decisions/ADR-0001-tech-stack.md) | Why Node.js + MongoDB |

---