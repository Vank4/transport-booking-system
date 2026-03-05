# 02 — Coding Conventions

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 12 — Developer Guide

---

## General Principles

1. **Clarity over cleverness.** Write code that a new contributor can understand in 30 seconds.
2. **One responsibility per function.** Controllers call services; services call models.
3. **No raw `process.env` access.** Always import from `config/env.js`.
4. **No logic in routes.** Route files only wire middleware + controller functions.
5. **All async code uses `async/await`.** No `.then()/.catch()` chains.

---

## Backend Conventions (Node.js / JavaScript)

### Module System

CommonJS only. All files use `require` and `module.exports`.

```javascript
// ✅ Correct
const { jwtSecret } = require('../config/env');
module.exports = { registerUser };

// ❌ Wrong
import env from '../config/env';
export const registerUser = ...;
```

### Controller Pattern

Controllers are thin. Business logic belongs in `services/`.

```javascript
// ✅ Controller — handles HTTP, delegates to service
const bookingService = require('../services/booking.service');

const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.user.userId, req.body);
    res.status(201).json({ status: 'success', data: booking });
  } catch (err) {
    next(err); // delegate to errorHandler middleware
  }
};

module.exports = { createBooking };
```

### Error Handling

All errors must be passed to `next(err)`. Never `res.status(500)` directly in a controller.

The global error handler (`middleware/errorHandler.js`) translates errors into the standard API error envelope.

### Environment Variables

```javascript
// ✅ Correct — always use env.js
const { jwtSecret, seatHoldTtlMinutes } = require('../config/env');

// ❌ Wrong — bypasses validation and central config
const secret = process.env.JWT_SECRET;
```

### Naming

| Type | Convention | Example |
|---|---|---|
| Variables | camelCase | `userId`, `bookingStatus` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_SEAT_HOLD = 9` |
| Functions | camelCase, verb prefix | `createBooking`, `validateVoucher` |
| Files | kebab-case or `[name].[type].js` | `booking.service.js` |
| Collections | plural, lowercase | `bookings`, `train_trips` |

---

## Frontend Conventions (TypeScript / React)

### Component Structure

```typescript
// ✅ Standard component file structure
import React from 'react';
import type { SeatProps } from '../../types/seat';

// 1. Types / interfaces local to this file
interface Props {
  seat: SeatProps;
  onSelect: (seatId: string) => void;
}

// 2. Component definition
const SeatCell: React.FC<Props> = ({ seat, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(seat._id)}
      className={`seat seat--${seat.status.toLowerCase()}`}
    >
      {seat.seat_number}
    </button>
  );
};

export default SeatCell;
```

### File naming

| Type | Pattern | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `SeatMap.tsx` |
| Pages | `page.tsx` | `app/user/bookings/page.tsx` |
| Hooks | `use[PascalCase].ts` | `useSeatMap.ts` |
| Stores | `[camelCase]Store.ts` | `bookingStore.ts` |
| Utilities | `camelCase.ts` | `formatPrice.ts` |
| Types | `camelCase.ts` | `seat.ts` |

### API Calls

Never call `fetch()` or `axios()` directly in a component or hook.

```typescript
// ✅ Correct — use the shared apiClient
import apiClient from '../../lib/apiClient';

const { data } = await apiClient.post('/seats/hold', payload);

// ❌ Wrong
const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/seats/hold`, ...);
```

### State

- Use **Zustand stores** for global client state (auth, booking flow, seat map).
- Use **React `useState`** for local UI state (form fields, modal open/close).
- Never use `localStorage` directly — abstract behind a store action.

---

## Commit Message Format

Follow Conventional Commits:

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructure, no behavior change |
| `test` | Adding or updating tests |
| `chore` | Tooling, dependencies, CI |

**Examples:**
```
feat(seat): add atomic hold with TTL via findOneAndUpdate
fix(booking): filter getAllBookings by req.user.userId
docs(api): add voucher endpoint specification
chore(deps): upgrade mongoose to 8.12.0
```
