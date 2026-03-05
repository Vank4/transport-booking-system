# 02 — Payment Flow

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 6 — Runtime View

---

## 1. Payment Flow Overview

The system uses an **external payment provider** (e.g., Stripe, VNPay) via a redirect + webhook pattern. The backend never handles raw card data — it only creates a payment session and receives a signed webhook callback.

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant BE as Backend API
    participant DB as MongoDB
    participant Pay as Payment Provider

    User->>FE: Confirm checkout
    FE->>BE: POST /api/bookings\n{ seatIds, passengers, voucherId? }

    BE->>DB: Validate seat holds\n(held_by === userId)
    BE->>DB: Validate & deduct voucher\n(if provided)
    BE->>DB: Create Booking (status: PENDING)\nCreate Tickets\nCreate Payment (status: PENDING)
    BE->>DB: Update seats → BOOKED
    BE->>Pay: Create payment session\n(amount, currency, redirectUrl, metadata.bookingId)
    Pay-->>BE: { paymentUrl, sessionId }
    BE-->>FE: 201 { bookingId, paymentUrl }

    FE->>Pay: Redirect user to paymentUrl
    User->>Pay: Complete payment (card / e-wallet)

    alt Payment successful
        Pay->>BE: POST /api/payments/callback\n(signed webhook, event: payment.success)
        BE->>BE: Verify webhook signature\n(HMAC-SHA256)
        BE->>DB: Payment → COMPLETED\nBooking → CONFIRMED
        BE->>DB: Generate + store ticket QR tokens
        BE-->>Pay: 200 (acknowledge)
        Pay->>FE: Redirect to /user/booking/result?bookingId=xxx
        FE->>BE: GET /api/bookings/:id
        BE-->>FE: Booking + tickets
        FE->>User: Show confirmation page
    else Payment failed / cancelled
        Pay->>BE: POST /api/payments/callback\n(event: payment.failed)
        BE->>DB: Payment → FAILED\nBooking → CANCELLED
        BE->>DB: Seats → AVAILABLE
        BE-->>Pay: 200 (acknowledge)
        Pay->>FE: Redirect to /user/booking/result?status=failed
    end
```

---

## 2. Booking Creation — Detailed Steps

```mermaid
flowchart TD
    A[POST /api/bookings] --> B{All seatIds held\nby req.user.userId?}
    B -- No --> E1[409 SEAT_NOT_HELD]
    B -- Yes --> C{Voucher provided?}
    C -- Yes --> D{Voucher valid?\nNot expired, not exhausted}
    D -- No --> E2[400 INVALID_VOUCHER]
    D -- Yes --> F[Calculate discount]
    C -- No --> G[No discount]
    F --> H[Create Booking: status=PENDING]
    G --> H
    H --> I[Create Ticket per passenger/seat]
    I --> J[Create Payment: status=PENDING]
    J --> K[Update seats: status=BOOKED]
    K --> L[Create payment session\nat provider]
    L --> M[Return 201 bookingId + paymentUrl]
```

---

## 3. Webhook Security

All incoming webhook requests to `POST /api/payments/callback` must be verified before processing.

```javascript
// Pattern to implement in payment callback handler
const crypto = require('crypto');
const { paymentWebhookSecret } = require('../config/env');

function verifyWebhookSignature(req) {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', paymentWebhookSecret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}
```

**Rules:**
- If signature verification fails, return `400` immediately — do not process.
- The callback must be **idempotent**: re-delivery of the same event must not create duplicate bookings.
- The callback must respond with `200` within 5 seconds or the provider will retry.

---

## 4. Refund & Cancellation Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant BE as Backend API
    participant DB as MongoDB
    participant Pay as Payment Provider

    User->>FE: Cancel booking
    FE->>BE: DELETE /api/bookings/:id

    BE->>DB: Find Booking\n(must belong to req.user.userId)
    BE->>BE: Check cancellation policy\n(e.g., >2h before departure)
    BE->>Pay: Issue refund\n(refundAmount, paymentId)
    Pay-->>BE: { refundId, status: "PENDING" }

    BE->>DB: Booking → REFUNDED\nPayment → REFUNDED\nSeats → AVAILABLE
    BE-->>FE: 200 { booking, refundId }
```

**Cancellation rules (to be configured in `config/env.js`):**
- Full refund if cancelled >24h before departure.
- Partial refund (50%) if cancelled 2–24h before departure.
- No refund if cancelled <2h before departure.

---

## 5. Payment States

```mermaid
stateDiagram-v2
    [*] --> PENDING: POST /api/bookings

    PENDING --> COMPLETED: Webhook payment.success
    PENDING --> FAILED: Webhook payment.failed\nor timeout

    COMPLETED --> REFUNDED: DELETE /api/bookings/:id\n+ provider refund

    FAILED --> [*]
    REFUNDED --> [*]
```

---

## 6. Known Gaps

| Gap | Priority | Notes |
|---|---|---|
| `POST /api/payments/callback` route does not exist | Critical | Backend has no payment webhook endpoint |
| `paymentWebhookSecret` not in `env.js` | Critical | Must be added before any payment work |
| No cancellation policy enforcement | High | Hard-coded rules or config-driven |
| No ticket PDF / QR generation | Medium | Planned for v2 |
| No retry handling for failed provider calls | Medium | Should use exponential back-off |
