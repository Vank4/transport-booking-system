# 05 — Voucher Endpoints

**Last Updated:** 2026-03-05  
**Status:** Not Implemented  
**Section:** arc42 Chapter 10 — API Reference

> These endpoints are specified but not yet implemented in the backend.

---

## POST /api/vouchers/apply

Validate a voucher code and return the discount amount for a given order total.

**Auth required:** Yes

**Request body:**

```json
{
  "code": "SUMMER2026",
  "tripId": "64a1b2c3d4e5f6a7b8c9d0e3",
  "tripType": "flight",
  "originalAmount": 2400000
}
```

**Response 200:**

```json
{
  "status": "success",
  "data": {
    "voucherId": "64a1b2c3d4e5f6a7b8c9d0e5",
    "code": "SUMMER2026",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "discountAmount": 240000,
    "finalAmount": 2160000
  }
}
```

**Error responses:** `404 VOUCHER_NOT_FOUND`, `422 VOUCHER_EXPIRED`, `422 VOUCHER_EXHAUSTED`, `422 VOUCHER_NOT_APPLICABLE`

---

## GET /api/vouchers (Admin only)

List all vouchers.

**Auth required:** Yes, ADMIN role

**Response 200:** Array of voucher objects with usage stats.

---

## POST /api/vouchers (Admin only)

Create a new voucher.

**Auth required:** Yes, ADMIN role

**Request body:**

```json
{
  "code": "SUMMER2026",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "minOrderAmount": 500000,
  "maxUsage": 100,
  "expiresAt": "2026-09-01T00:00:00.000Z",
  "applicableTripTypes": ["flight", "train"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | string | Yes | Unique, uppercase |
| `discountType` | string | Yes | `PERCENTAGE` or `FIXED_AMOUNT` |
| `discountValue` | number | Yes | Percent (0–100) or VND amount |
| `minOrderAmount` | number | No | Min order to apply voucher |
| `maxUsage` | integer | No | Null = unlimited |
| `expiresAt` | ISO string | No | Null = no expiry |
| `applicableTripTypes` | string[] | No | Null = all types |

**Response 201:** Created voucher object.

---

## DELETE /api/vouchers/:id (Admin only)

Deactivate (soft-delete) a voucher.

**Auth required:** Yes, ADMIN role

**Response 200:** Updated voucher with `status: "INACTIVE"`.
