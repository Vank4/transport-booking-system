# 01 — API Conventions

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 8 — Crosscutting Concepts

---

## Base URL

| Environment | Base URL |
|---|---|
| Local | `http://localhost:3000/api` |
| Production | `https://api.yourdomain.com/api` |

All API endpoints are prefixed with `/api`.

---

## Request Format

- `Content-Type: application/json` is required for all `POST`, `PUT`, and `PATCH` requests.
- Request bodies must be valid JSON.
- Date fields must be ISO 8601 strings (e.g., `"2026-04-15T10:00:00.000Z"`).

---

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The JWT is obtained from `POST /api/auth/login`. It expires after `JWT_EXPIRES_IN` (default `1h`).

If the token is absent, expired, or invalid, the server responds with `401 Unauthorized`.

---

## Response Format

All responses are JSON. The standard envelope format:

### Success

```json
{
  "status": "success",
  "data": { ... }
}
```

For collections:

```json
{
  "status": "success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Error

```json
{
  "status": "error",
  "code": "SEAT_NOT_AVAILABLE",
  "message": "Seat 64a1b2c3d4e5f6a7b8c9d0e1 is no longer available."
}
```

---

## HTTP Status Code Usage

| Code | Meaning | When Used |
|---|---|---|
| `200 OK` | Success | GET, PUT/PATCH updates, DELETE |
| `201 Created` | Resource created | POST that creates a new resource |
| `400 Bad Request` | Validation error | Missing / invalid fields |
| `401 Unauthorized` | Auth required | Missing or invalid JWT |
| `403 Forbidden` | Insufficient role | Valid JWT but role check failed |
| `404 Not Found` | Resource not found | ID does not exist |
| `409 Conflict` | State conflict | Seat already held, booking already confirmed |
| `422 Unprocessable Entity` | Business rule violation | Voucher expired, seat limit exceeded |
| `500 Internal Server Error` | Unhandled exception | Never intentionally returned |

---

## Pagination

Endpoints that return lists support cursor-based or offset pagination:

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (1-based) |
| `limit` | integer | `20` | Items per page (max: `100`) |

**Example:** `GET /api/bookings/me?page=2&limit=10`

---

## Filtering & Sorting

Endpoints that support filtering accept query parameters matching field names. Sorting:

| Parameter | Format | Example |
|---|---|---|
| `sort` | `field:asc` or `field:desc` | `?sort=departure_time:asc` |

---

## ID Format

All resource IDs are MongoDB ObjectIds represented as 24-character hex strings:

```
64a1b2c3d4e5f6a7b8c9d0e1
```

---

## Versioning

The API is currently not versioned (no `/v1/` prefix). Versioning must be added before any breaking changes to existing endpoints. Recommended format: `/api/v1/...`.

---

## Error Codes

See [08-crosscutting/02-error-catalogue.md](./02-error-catalogue.md) for a full list of application-level error codes.
