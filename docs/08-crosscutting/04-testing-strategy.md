# 04 — Testing Strategy

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 8 — Crosscutting Concepts

---

## Testing Pyramid

```
        ╔══════════╗
        ║  E2E     ║  Few — critical user journeys
        ╠══════════╣
        ║Integration║  Moderate — API endpoints + DB
        ╠══════════╣
        ║  Unit    ║  Many — services, utils, controllers
        ╚══════════╝
```

| Layer | Scope | Tool | Directory |
|---|---|---|---|
| Unit | Functions, utilities, controller logic | Jest | `backend/tests/unit/` |
| Integration | API routes + MongoDB (in-memory) | Jest + Supertest + `mongodb-memory-server` | `backend/tests/integration/` |
| E2E | Full browser user journeys | Playwright | `frontend/tests/e2e/` |

---

## Backend Unit Tests

Test individual functions in isolation. Use `jest.mock()` to stub Mongoose model calls.

**What to unit test:**
- `config/env.js` — validates required env vars are present
- Controller functions — mock the model, assert response shape
- Service functions (once services/ is implemented)
- Utility functions (date helpers, price calculators, TTL logic)

**Example test structure:**

```javascript
// backend/tests/unit/seat.controller.test.js
const { holdSeats } = require('../../src/controllers/seat.controller');

jest.mock('../../src/models/seats.model');
const Seat = require('../../src/models/seats.model');

describe('holdSeats', () => {
  it('should return 409 when seat is not available', async () => {
    Seat.findOneAndUpdate.mockResolvedValue(null);
    const req = { body: { seatIds: ['abc'], tripId: 'trip1' }, user: { userId: 'u1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await holdSeats(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'SEAT_NOT_AVAILABLE' })
    );
  });
});
```

---

## Backend Integration Tests

Test full HTTP request/response cycles using an in-memory MongoDB instance. No mocking of Mongoose — tests run against real data.

**Setup:**

```bash
npm install --save-dev supertest mongodb-memory-server
```

**What to integration test:**
- `POST /api/auth/register` — creates user, returns JWT
- `POST /api/auth/login` — valid and invalid credentials
- `POST /api/seats/hold` — concurrent hold race condition
- `POST /api/bookings` — full create flow
- `GET /api/bookings/me` — returns only requesting user's bookings
- `DELETE /api/bookings/:id` — cancels and releases seats

**Example:**

```javascript
// backend/tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/auth/register', () => {
  it('should register a new user and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Password1!', fullName: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('token');
  });
});
```

---

## Frontend E2E Tests (Planned)

E2E tests simulate real user journeys in a browser against a running application.

**Recommended tool:** Playwright

**Priority journeys to test:**
1. Guest searches for a flight and views results
2. User registers, logs in, holds seats, and completes checkout
3. User views booking history and opens ticket detail
4. Admin logs in and views all bookings

---

## CI Test Pipeline (Recommended)

```yaml
# .github/workflows/test.yml (to be created)
on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd backend && npm ci
      - run: cd backend && npm test -- --coverage

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run type-check
      - run: cd frontend && npm run lint
```

---

## Coverage Targets

| Layer | Minimum Coverage |
|---|---|
| Unit (backend) | 80% line coverage |
| Integration (backend) | All critical paths covered |
| E2E (frontend) | Top 3 user journeys automated |

---

## Current Testing State

- **`backend/tests/`** directory exists but contains no test files.
- No test runner is configured in `backend/package.json` (no `jest` dependency, no `test` script).
- No E2E tests exist for the frontend.

**Immediate next steps:**
1. `npm install --save-dev jest supertest mongodb-memory-server` in `backend/`
2. Add `"test": "jest"` to `backend/package.json` scripts
3. Write integration tests for `auth` and `booking` endpoints
