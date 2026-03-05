# 03 — Security

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 8 — Crosscutting Concepts

---

## 1. Authentication

**Mechanism:** JSON Web Tokens (JWT), issued by the backend on successful login.

| Property | Value |
|---|---|
| Library | `jsonwebtoken ^9` |
| Algorithm | HS256 |
| Payload | `{ userId }` |
| Expiry | `1h` (configurable via `JWT_EXPIRES_IN`) |
| Transport | HTTP `Authorization: Bearer <token>` header |

**Rules:**
- Tokens are stateless; the server does not maintain a session store.
- Refresh tokens are not yet implemented — users must re-login when a token expires.
- `JWT_SECRET` must be a random string of ≥48 characters, never committed to source control.

---

## 2. Authorization

Two-tier role model enforced at the route level:

| Role | Access |
|---|---|
| `USER` | Own bookings, seat hold/release, profile |
| `ADMIN` | All USER actions + any user's data, admin management routes |

**Implementation pattern:**

```javascript
// Middleware chain for a protected endpoint:
router.get(
  '/admin/bookings',
  authMiddleware,           // 1. Verify JWT → attach req.user
  requireRole('ADMIN'),     // 2. Check req.user.role === 'ADMIN'
  adminController.getAllBookings
);
```

`requireRole` middleware is not yet implemented. It must be added to `src/middleware/`.

**Current gaps:**
- `authMiddleware.js` reads `process.env.JWT_SECRET` directly instead of `require('../config/env').jwtSecret`.
- No role-check middleware exists.
- `GET /api/bookings` (all bookings) is not filtered by `userId` — any authenticated user can read all users' bookings.

---

## 3. Password Security

| Property | Value |
|---|---|
| Library | `bcrypt ^6` |
| Salt rounds | 10 (minimum) |
| Storage | Hashed digest only; plain text never stored |

**Rule:** The `password` field on the User model must be excluded from all API responses using `.select('-password')` in every query.

---

## 4. CORS

CORS is configured in `app.js` via the `cors` npm package:

```javascript
app.use(cors({ origin: env.corsOrigin }));
```

**Rules:**
- `CORS_ORIGIN` must be set to the exact frontend URL. **Never use `*` in production.**
- The `CORS_ORIGIN` wildcard is only acceptable in local development with `NODE_ENV=development`.

---

## 5. HTTP Security Headers

`helmet` is installed and applied as the first middleware in `app.js`:

```javascript
app.use(helmet());
```

`helmet` sets the following headers by default:

| Header | Effect |
|---|---|
| `Content-Security-Policy` | Restricts resource loading |
| `X-Frame-Options` | Prevents clickjacking |
| `X-Content-Type-Options` | Prevents MIME sniffing |
| `Strict-Transport-Security` | Enforces HTTPS |
| `Referrer-Policy` | Controls referrer information |

---

## 6. Input Validation

All request bodies must be validated before reaching controller logic. Recommended approach: `express-validator` or `zod`.

**Currently:** No input validation library is installed. Controllers process raw `req.body` without validation, creating injection risk.

---

## 7. Webhook Security

Payment webhook callbacks at `POST /api/payments/callback` must verify the HMAC-SHA256 signature sent by the payment provider. See [06-runtime/02-payment-flow.md](../06-runtime/02-payment-flow.md#3-webhook-security) for the implementation pattern.

**Critical:** Without signature verification, any party can forge a `payment.success` event and confirm bookings without paying.

---

## 8. Rate Limiting

Rate limiting is **not currently implemented**. Before production deployment, add `express-rate-limit`:

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 login attempts per window
  message: { status: 'error', code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

## 9. Secret Management

| Secret | Storage Method |
|---|---|
| `JWT_SECRET` | `.env` file locally; secrets manager in production |
| `PAYMENT_WEBHOOK_SECRET` | `.env` file locally; secrets manager in production |
| `MONGO_URI` (with credentials) | `.env` file locally; secrets manager in production |
| Frontend env vars (`NEXT_PUBLIC_*`) | `.env.local` locally; CI/CD environment variables in production |

**Rule:** `.env` files are gitignored. A `.env.example` file with safe placeholders is the only env-related file committed to the repository.
