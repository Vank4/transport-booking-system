# 02 — Roles & Permissions

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 3 — Context & Scope  
**Source:** Original `01-roles-permissions.md` (reformatted)

---

## 1. Access Control Model

The system uses **Role-Based Access Control (RBAC)** with two active roles:

| Role | Description |
|---|---|
| `USER` | Registered passenger; can book tickets and manage their own data |
| `ADMIN` | Platform administrator; has full read/write access to all system data |

Future roles (not in MVP scope): `SUPER_ADMIN`, `STAFF`, `SUPPORT`.

---

## 2. Authentication Rules

- All unauthenticated requests may only access **public** routes.
- Every protected request must include `Authorization: Bearer <token>`.
- Tokens are verified by `authMiddleware.js` using `JWT_SECRET`.
- A `USER` must never access `/api/admin/*` endpoints — the middleware returns `403 FORBIDDEN`.
- A `USER` must never access another user's bookings — controllers must filter by `req.user.userId`.

---

## 3. USER Permissions

### 3.1 Authentication

| Action | Access |
|---|---|
| Register | Public |
| Login | Public |
| Logout (token discard) | `USER` |
| View own profile | `USER` |
| Update own profile | `USER` |
| Change password | `USER` |

### 3.2 Search & Trips

| Action | Access |
|---|---|
| Search flights / train trips | Public |
| View search results | Public |
| View trip detail | Public |
| View seat map | Public |

### 3.3 Seat Operations

| Action | Access | Notes |
|---|---|---|
| Hold a seat | `USER` | Max hold duration: `SEAT_HOLD_TTL_MINUTES` |
| Release a seat | `USER` | Only the holder (matched by `userId` or `sessionId`) |
| View real-time seat status | Public | Via WebSocket or `GET /api/trips/{type}/{tripId}/seats` |

### 3.4 Booking & Payment

| Action | Access |
|---|---|
| Create booking | `USER` |
| Apply voucher | `USER` |
| Proceed to payment | `USER` |
| View payment result | `USER` |
| Receive e-ticket | `USER` |

### 3.5 Booking Management

| Action | Access | Notes |
|---|---|---|
| View own bookings list | `USER` | Filtered to `req.user.userId` only |
| View own booking detail | `USER` | |
| Request booking cancellation | `USER` | MVP: only when `PENDING_PAYMENT` |

### 3.6 Account State

| State | Effect |
|---|---|
| `ACTIVE` | Full access to all `USER` routes |
| `BLOCKED` | Login returns `403 ACCOUNT_BLOCKED`; cannot create bookings |

---

## 4. ADMIN Permissions

Admins have full read/write access to all system data via `/api/admin/*` endpoints.

### 4.1 User Management

| Action |
|---|
| List all users (with search and pagination) |
| Block / unblock a user account |
| Change a user's role |

### 4.2 Infrastructure Management

| Entity | Operations |
|---|---|
| Airlines | CRUD |
| Airports | CRUD |
| Trains | CRUD |
| Train Stations | CRUD |
| Train Carriages | CRUD |

### 4.3 Trip Management

| Entity | Operations |
|---|---|
| Flights | CRUD, status update (SCHEDULED / DELAYED / CANCELLED) |
| Train Trips | CRUD, status update |

### 4.4 Seat & Pricing

| Action |
|---|
| Configure seat map layout |
| Set seat class and pricing |
| Update seat status (admin override) |

### 4.5 Voucher Management

| Action |
|---|
| Create, update, delete vouchers |
| Set discount type (PERCENT / FIXED), value, max usage, expiry |

### 4.6 Booking Management

| Action |
|---|
| View all bookings across the platform |
| Cancel a booking |
| Manually process refund (if in scope) |
| Update payment status |

### 4.7 Reporting

| Action |
|---|
| View revenue by day / month |
| View seat occupancy rate |
| View booking statistics by route |

---

## 5. Backend Enforcement

```javascript
// Route definition pattern — DO NOT deviate from this
router.post('/admin/flights', authenticate, authorize('ADMIN'), createFlight);
router.get('/bookings/me',    authenticate,                     getMyBookings);
```

`authenticate` — verifies JWT, attaches `req.user = { userId, role }`.  
`authorize(role)` — checks `req.user.role === role`, returns `403` if not.

> ⚠ `authorize` middleware does not yet exist in the codebase. It must be implemented in `backend/src/middleware/`.

---

## 6. Frontend Route Protection

| Route Pattern | Guard |
|---|---|
| `/admin/*` | Redirect to `/auth/login` if not `ADMIN` |
| `/user/*` | Redirect to `/auth/login` if not authenticated |
| `/auth/*` | Redirect to `/` if already authenticated |
