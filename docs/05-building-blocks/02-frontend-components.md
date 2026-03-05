# 02 — Frontend Components

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 5 — Building Blocks

---

## 1. Technology Stack

| Component | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Build tool | Vite (dev) / Next.js build (prod) |
| Styling | TBD (Tailwind CSS recommended) |
| State management | Zustand *(store/ is currently empty — must be implemented)* |
| API client | Fetch / Axios wrapper *(lib/ is currently empty — must be implemented)* |
| Realtime | socket.io-client *(hooks/ is currently empty — must be implemented)* |
| Form validation | Zod / React Hook Form (recommended) |

---

## 2. Directory Structure

```
frontend/src/
│
├── app/                       # Next.js App Router — page files
│   ├── public/                # Unauthenticated pages
│   │   ├── page.tsx           # Home — search form
│   │   ├── flights/           # Flight search results + detail
│   │   └── trains/            # Train search results + detail
│   │
│   ├── auth/                  # Login, Register pages
│   │
│   ├── user/                  # Authenticated user flows
│   │   ├── booking/           # Full booking flow (seat map → passenger → voucher → checkout)
│   │   ├── bookings/          # My bookings list + detail
│   │   └── profile/           # Account settings
│   │
│   └── admin/                 # Admin-only pages (role guard required)
│
├── components/                # Reusable UI components
│   ├── ui/                    # Base design system (Button, Input, Modal, Badge…)
│   ├── search/                # SearchForm, TripCard, FilterPanel, SortBar
│   ├── booking/               # SeatMap, SeatCell, PassengerForm, VoucherInput, CheckoutSummary
│   ├── layout/                # Header, Footer, Sidebar, AuthLayout, AdminLayout
│   └── admin/                 # AdminDataTable, StatsCard, RevenueChart
│
├── store/                     # ⚠ EMPTY — Zustand stores must be created
│   (planned)
│   ├── authStore.ts           # currentUser, token, login(), logout()
│   ├── bookingStore.ts        # selectedTrip, selectedSeats, passengers, voucher
│   └── seatStore.ts           # seats[], socket connection state
│
├── hooks/                     # ⚠ EMPTY — custom hooks must be created
│   (planned)
│   ├── useAuth.ts             # reads authStore, provides isAuthenticated, user
│   ├── useSocket.ts           # manages Socket.IO connection lifecycle
│   ├── useSeatMap.ts          # fetches seat map + subscribes to socket room
│   └── useCountdown.ts        # countdown timer for hold TTL display
│
├── lib/                       # ⚠ EMPTY — utilities must be created
│   (planned)
│   ├── apiClient.ts           # Axios/fetch wrapper with base URL + auth header injection
│   └── socketClient.ts        # Socket.IO client singleton
│
└── types/                     # TypeScript interfaces (shared across app)
    (planned)
    ├── seat.ts                # SeatStatus, Seat, BulkHoldResult
    ├── booking.ts             # BookingStatus, Booking, Ticket
    ├── trip.ts                # TripType, Flight, TrainTrip, SeatClass
    ├── user.ts                # UserRole, User, UserStatus
    └── voucher.ts             # DiscountType, Voucher, ApplyVoucherResult
```

---

## 3. Page & Route Map

| URL Pattern | Page | Auth Guard | Key API Calls |
|---|---|---|---|
| `/` | Home / Search | None | `GET /api/public/airports`, `GET /api/public/train-stations` |
| `/flights/search` | Flight search results | None | `GET /api/flights/search` |
| `/flights/[id]` | Flight detail + seat map | None | `GET /api/flights/:id`, `GET /api/trips/flight/:id/seats` |
| `/trains/search` | Train search results | None | `GET /api/train-trips/search` |
| `/trains/[id]` | Train detail + seat map | None | `GET /api/train-trips/:id`, `GET /api/trips/train/:id/seats` |
| `/auth/login` | Login | Redirect if authed | `POST /api/auth/login` |
| `/auth/register` | Register | Redirect if authed | `POST /api/auth/register` |
| `/user/booking/passengers` | Passenger info | `USER` | In-memory from booking store |
| `/user/booking/checkout` | Checkout + voucher | `USER` | `POST /api/vouchers/apply`, `POST /api/bookings` |
| `/user/booking/result` | Payment result | `USER` | `GET /api/bookings/:id` |
| `/user/bookings` | My bookings | `USER` | `GET /api/bookings/me` |
| `/user/bookings/[id]` | Booking detail | `USER` | `GET /api/bookings/:id`, `GET /api/bookings/:id/ticket` |
| `/user/profile` | Profile settings | `USER` | `GET /api/auth/me`, `PATCH /api/auth/profile` |
| `/admin/*` | Admin dashboard & management | `ADMIN` | `/api/admin/*` |

---

## 4. WebSocket Integration

The frontend connects to the backend Socket.IO server at `VITE_SOCKET_URL`. The connection lifecycle must be managed in `hooks/useSocket.ts`.

```
// Connection lifecycle
onMount:   socket.connect()
           socket.emit('JOIN_TRIP_ROOM', { tripId })
onUnmount: socket.emit('LEAVE_TRIP_ROOM', { tripId })
           socket.disconnect()
onReconnect: re-emit JOIN_TRIP_ROOM
             call GET /api/trips/{type}/{tripId}/seats to resync

// Events the frontend listens for
SEATS_SYNC   → replace full seats array in seatStore
SEAT_HELD    → update single seat in seatStore: status=HOLDING, holdUntil
SEAT_RELEASED → update single seat: status=AVAILABLE
SEAT_BOOKED  → update single seat: status=BOOKED
```

**Critical rule:** The frontend must **never** infer seat state changes. It only updates state when a server event or API response explicitly says so.

---

## 5. API Client (`lib/apiClient.ts`)

All HTTP calls must go through a single client wrapper — never `fetch()` or `axios()` directly in a component.

```typescript
// Pattern to implement in lib/apiClient.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Inject JWT on every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
```

---

## 6. Current Implementation Status

| Directory | Status | What's Missing |
|---|---|---|
| `app/public/` | Skeleton pages exist | API calls, search form logic |
| `app/auth/` | `.gitkeep` only | Login and register page components |
| `app/user/` | Skeleton exists | All booking flow pages need implementation |
| `app/admin/` | Skeleton exists | All admin pages need implementation |
| `components/` | Directories exist | Most components are empty |
| `store/` | `.gitkeep` only | All Zustand stores |
| `hooks/` | `.gitkeep` only | All custom hooks |
| `lib/` | `.gitkeep` only | `apiClient.ts`, `socketClient.ts` |
| `types/` | Presumably empty | All TypeScript interfaces |
