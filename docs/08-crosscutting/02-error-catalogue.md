# 02 — Error Catalogue

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 8 — Crosscutting Concepts

This is the single source of truth for all application-level error codes. Every error response body includes a `code` field matching one of the entries below.

---

## Authentication Errors

| Code | HTTP | Message | Cause |
|---|---|---|---|
| `MISSING_TOKEN` | 401 | Authentication token is required. | No `Authorization` header provided. |
| `INVALID_TOKEN` | 401 | Authentication token is invalid or expired. | JWT verification failed. |
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect. | Login failed. |
| `EMAIL_ALREADY_EXISTS` | 409 | An account with this email already exists. | Registration with duplicate email. |
| `FORBIDDEN` | 403 | You do not have permission to access this resource. | Role check failed (e.g., non-admin accessing admin route). |

---

## Validation Errors

| Code | HTTP | Message | Cause |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body is malformed or missing required fields. | Schema validation failure. Includes `errors` array. |
| `INVALID_TRIP_TYPE` | 400 | Trip type must be 'flight' or 'train'. | Invalid `tripType` query param. |
| `INVALID_DATE_FORMAT` | 400 | Date must be in ISO 8601 format. | Unparseable date string. |

---

## Seat Errors

| Code | HTTP | Message | Cause |
|---|---|---|---|
| `SEAT_NOT_FOUND` | 404 | Seat `{id}` not found. | Invalid seat ID. |
| `SEAT_NOT_AVAILABLE` | 409 | Seat `{id}` is no longer available. | Seat is HOLDING or BOOKED. |
| `SEAT_HOLD_LIMIT_EXCEEDED` | 422 | You cannot hold more than 9 seats at a time. | User attempts to hold >9 seats per trip. |
| `SEAT_NOT_HELD_BY_USER` | 403 | You do not have a hold on seat `{id}`. | Release or book attempt for seat held by another user. |
| `SEAT_HOLD_EXPIRED` | 409 | Your seat hold has expired. Please select seats again. | Hold TTL passed before booking was created. |

---

## Booking Errors

| Code | HTTP | Message | Cause |
|---|---|---|---|
| `BOOKING_NOT_FOUND` | 404 | Booking `{id}` not found. | Invalid booking ID or booking belongs to another user. |
| `BOOKING_NOT_CANCELLABLE` | 422 | This booking cannot be cancelled in its current state. | Attempting to cancel a REFUNDED or already CANCELLED booking. |
| `BOOKING_ALREADY_CONFIRMED` | 409 | This booking has already been confirmed. | Duplicate payment callback. |
| `PASSENGER_COUNT_MISMATCH` | 400 | Number of passengers must match number of selected seats. | `passengers` array length ≠ `seatIds` array length. |

---

## Voucher Errors

| Code | HTTP | Message | Cause |
|---|---|---|---|
| `VOUCHER_NOT_FOUND` | 404 | Voucher code not found. | Invalid voucher code. |
| `VOUCHER_EXPIRED` | 422 | This voucher has expired. | Current date > `expires_at`. |
| `VOUCHER_EXHAUSTED` | 422 | This voucher has reached its usage limit. | `usage_count >= usage_limit`. |
| `VOUCHER_NOT_APPLICABLE` | 422 | This voucher does not apply to the selected trip. | Trip type / route restriction not met. |
| `VOUCHER_ALREADY_APPLIED` | 409 | A voucher has already been applied to this booking. | Duplicate voucher application. |

---

## Payment Errors

| Code | HTTP | Message | Cause |
|---|---|---|---|
| `PAYMENT_NOT_FOUND` | 404 | Payment record not found. | Invalid payment ID. |
| `INVALID_WEBHOOK_SIGNATURE` | 400 | Webhook signature verification failed. | HMAC mismatch on payment callback. |
| `PAYMENT_PROVIDER_ERROR` | 502 | Payment provider returned an error. | External provider call failed. |

---

## Trip / Search Errors

| Code | HTTP | Message | Cause |
|---|---|---|---|
| `TRIP_NOT_FOUND` | 404 | Trip `{id}` not found. | Invalid flight or train trip ID. |
| `NO_TRIPS_FOUND` | 404 | No trips found matching your search criteria. | Search returned empty results. |
| `INSUFFICIENT_SEATS` | 409 | Not enough seats available for the requested passenger count. | Fewer AVAILABLE seats than required. |

---

## Server Errors

| Code | HTTP | Message | Cause |
|---|---|---|---|
| `INTERNAL_ERROR` | 500 | An unexpected error occurred. | Unhandled exception. Logged server-side; generic message to client. |
| `DATABASE_ERROR` | 500 | A database error occurred. | MongoDB operation failed. |

---

## Error Response Shape

```json
{
  "status": "error",
  "code": "SEAT_NOT_AVAILABLE",
  "message": "Seat 64a1b2c3d4e5f6a7b8c9d0e1 is no longer available."
}
```

For validation errors with field-level detail:

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Request body is malformed or missing required fields.",
  "errors": [
    { "field": "email", "message": "Must be a valid email address." },
    { "field": "password", "message": "Must be at least 8 characters." }
  ]
}
```
