# 02 — Environment Variables

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 7 — Deployment View

---

## Backend Environment Variables

Create `backend/.env` by copying `backend/.env.example` (to be created):

```bash
# backend/.env.example

# ───────────────────────────
# Application
# ───────────────────────────
NODE_ENV=development            # development | production | test
PORT=3000

# ───────────────────────────
# Database — MongoDB
# ───────────────────────────
MONGO_URI=mongodb://localhost:27017/transport_booking
# Docker:
# MONGO_URI=mongodb://mongo:27017/transport_booking

# ───────────────────────────
# Authentication
# ───────────────────────────
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=1h

# ───────────────────────────
# CORS
# ───────────────────────────
CORS_ORIGIN=http://localhost:3001

# ───────────────────────────
# Seat Hold
# ───────────────────────────
SEAT_HOLD_TTL_MINUTES=15

# ───────────────────────────
# Payment
# ───────────────────────────
PAYMENT_PROVIDER=vnpay           # vnpay | stripe
PAYMENT_WEBHOOK_SECRET=change_me_to_a_webhook_secret

# ───────────────────────────
# Logging
# ───────────────────────────
LOG_LEVEL=info                  # error | warn | info | http | debug
```

---

## Backend Variable Reference

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `NODE_ENV` | string | No | `development` | Application environment |
| `PORT` | number | No | `3000` | HTTP server listen port |
| `MONGO_URI` | string | **Yes** | — | Full MongoDB connection URI including database name |
| `JWT_SECRET` | string | **Yes** | — | Secret key for signing and verifying JWTs. Must be ≥32 bytes random. |
| `JWT_EXPIRES_IN` | string | No | `1h` | JWT TTL in `ms` / `jsonwebtoken` format |
| `CORS_ORIGIN` | string | No | `*` | Allowed CORS origin. Never use `*` in production. |
| `SEAT_HOLD_TTL_MINUTES` | number | No | `15` | How long a seat hold lasts before the background job releases it |
| `PAYMENT_PROVIDER` | string | No | `vnpay` | Payment provider integration to activate |
| `PAYMENT_WEBHOOK_SECRET` | string | **Yes (prod)** | — | HMAC secret for verifying payment webhook signatures |
| `LOG_LEVEL` | string | No | `info` | Morgan/winston log verbosity |

---

## `config/env.js` Required State

The central `env.js` config module must export all of the above. Current state vs required state:

| Export | Current State | Required |
|---|---|---|
| `nodeEnv` | ✅ Present | — |
| `port` | ✅ Present | — |
| `mongoUri` | ✅ Present | — |
| `jwtSecret` | ✅ Present | — |
| `corsOrigin` | ✅ Present | — |
| `seatHoldTtlMinutes` | ✅ Present | — |
| `jwtExpiresIn` | ❌ Missing | Must add |
| `paymentProvider` | ❌ Missing | Must add |
| `paymentWebhookSecret` | ❌ Missing | Must add |
| `logLevel` | ❌ Missing | Must add |

---

## Frontend Environment Variables

Create `frontend/.env.local` (never commit this file):

```bash
# frontend/.env.local

NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend REST API base URL used by `lib/apiClient.ts` |
| `NEXT_PUBLIC_SOCKET_URL` | Backend Socket.IO connection URL |

> **Note:** Variables prefixed with `NEXT_PUBLIC_` are bundled into the client-side JavaScript and visible to end users. Never place secrets (JWT keys, payment secrets) in `NEXT_PUBLIC_*` variables.

---

## Security Practices

1. **Never commit** `.env` or `.env.local` files. Both are gitignored.
2. Provision a `backend/.env.example` with safe placeholder values for all required variables.
3. `JWT_SECRET` must be cryptographically random and ≥32 characters. Generate with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
4. Rotate `JWT_SECRET` and `PAYMENT_WEBHOOK_SECRET` if ever exposed.
5. In production, use a secrets manager (e.g., AWS Secrets Manager, Azure Key Vault, GitHub Secrets) rather than `.env` files on disk.
