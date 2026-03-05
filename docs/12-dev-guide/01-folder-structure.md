# 01 — Folder Structure

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 12 — Developer Guide

---

## Repository Root

```
transport-booking-system/
├── backend/                   # Node.js Express API server
├── frontend/                  # Next.js frontend application
├── docs/                      # Project documentation (arc42)
├── package.json               # Root workspace config (npm workspaces)
└── .gitignore
```

---

## Backend Structure

```
backend/
├── package.json               # Dependencies and scripts
├── .env                       # Local environment variables (gitignored)
├── .env.example               # Template for .env (committed)
│
├── prisma/                    # ⚠ LEGACY — empty schema.prisma, pending deletion
│
└── src/
    ├── server.js              # Entry point: creates HTTP server, starts listen
    ├── app.js                 # Express app: middleware stack + route mounting
    │
    ├── config/
    │   ├── db.js              # MongoDB connection via Mongoose
    │   └── env.js             # Centralized env var export with validation
    │
    ├── controllers/           # Route handler functions
    │   ├── auth.controller.js
    │   ├── booking.controller.js
    │   ├── search.controller.js
    │   └── seat.controller.js
    │
    ├── middleware/
    │   ├── authMiddleware.js  # JWT verification, attaches req.user
    │   └── errorHandler.js   # Global Express error handler
    │
    ├── models/                # Mongoose schema + model definitions
    │   ├── users.model.js
    │   ├── flights.model.js
    │   ├── seats.model.js
    │   ├── bookings.model.js
    │   ├── tickets.model.js
    │   ├── payments.model.js
    │   ├── vouchers.model.js
    │   ├── airlines.model.js
    │   ├── airports.model.js
    │   ├── trains.model.js
    │   ├── trainStations.model.js
    │   ├── trainTrips.model.js
    │   └── trainCarriages.model.js
    │
    ├── routes/
    │   ├── auth.routes.js
    │   ├── booking.routes.js
    │   ├── health.routes.js
    │   ├── search.routes.js   # ⚠ Not mounted in app.js
    │   ├── seat.routes.js
    │   └── index.js           # ⚠ BUG: spawns second server — do not import
    │
    ├── services/              # ⚠ EMPTY — business logic layer (must be implemented)
    │
    ├── jobs/                  # ⚠ EMPTY — background jobs (must be implemented)
    │   (planned)
    │   └── seatHoldExpiry.job.js
    │
    ├── utils/                 # Helper functions
    │
    └── scripts/
        └── seed.js            # Database seed script
```

### Backend File Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Controller | `[feature].controller.js` | `booking.controller.js` |
| Route | `[feature].routes.js` | `booking.routes.js` |
| Model | `[entity].model.js` | `users.model.js` |
| Middleware | `[name]Middleware.js` | `authMiddleware.js` |
| Service | `[feature].service.js` | `booking.service.js` |
| Job | `[name].job.js` | `seatHoldExpiry.job.js` |

---

## Frontend Structure

```
frontend/
├── package.json
├── .env.local                 # Local env vars (gitignored)
├── .env.example               # Template (committed)
├── tsconfig.json
├── next.config.js
│
├── public/                    # Static assets
│
└── src/
    ├── app/                   # Next.js App Router
    │   ├── layout.tsx         # Root layout
    │   ├── public/            # Unauthenticated routes
    │   │   ├── page.tsx       # Home / search
    │   │   ├── flights/
    │   │   └── trains/
    │   ├── auth/              # Login, register
    │   ├── user/              # Authenticated user pages
    │   │   ├── booking/       # Booking flow
    │   │   ├── bookings/      # History
    │   │   └── profile/
    │   └── admin/             # Admin pages
    │
    ├── components/
    │   ├── ui/                # Base atoms (Button, Input, Modal…)
    │   ├── search/
    │   ├── booking/
    │   ├── layout/
    │   └── admin/
    │
    ├── store/                 # Zustand state stores (empty — must be created)
    ├── hooks/                 # Custom React hooks (empty — must be created)
    ├── lib/                   # API client, socket client (empty — must be created)
    └── types/                 # TypeScript interfaces
```

### Frontend File Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Page | `page.tsx` | `app/user/bookings/page.tsx` |
| Layout | `layout.tsx` | `app/admin/layout.tsx` |
| Component | `PascalCase.tsx` | `SeatMap.tsx` |
| Hook | `use[Name].ts` | `useSeatMap.ts` |
| Store | `[name]Store.ts` | `bookingStore.ts` |
| Types | `[name].ts` | `seat.ts` |
