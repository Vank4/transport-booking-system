# 03 — Seed Guide

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 11 — Database

---

## Overview

The seed script at `backend/src/scripts/seed.js` populates the database with realistic test data for local development. It is safe to run multiple times — it drops existing data for seeded collections before re-inserting.

---

## Running the Seed Script

### With Docker Compose

```bash
docker compose exec backend node src/scripts/seed.js
```

### Without Docker (manual)

```bash
cd backend
node src/scripts/seed.js
```

**Prerequisites:**
- MongoDB must be running and reachable at `MONGO_URI` (from `backend/.env`).
- `npm install` must have been run first.

---

## What Gets Seeded

| Collection | Records Created | Notes |
|---|---|---|
| `airlines` | 3 | Vietnam Airlines (VN), VietJet Air (VJ), Bamboo Airways (QH) |
| `airports` | 5 | HAN (Hanoi), SGN (HCMC), DAD (Da Nang), CXR (Nha Trang), PQC (Phu Quoc) |
| `trains` | 2 | SE1, SE3 (Reunification Express variants) |
| `train_stations` | 4 | Ha Noi, Hue, Da Nang, Sai Gon |
| `train_carriages` | 4 | 2 per train (hard sleeper + soft sleeper) |
| `flights` | 3 | HAN→SGN, SGN→HAN, DAD→SGN |
| `seats` | ~450 | ~150 per flight (economy + business) |
| `train_trips` | 2 | SE1: HAN→SGN, SE3: SGN→HAN |
| `train seats` | ~200 | Mixed sleeper classes |
| `users` | 2 | Test user + admin user |
| `vouchers` | 2 | TESTDISCOUNT10 (10%), FLAT50K (50,000 VND fixed) |

---

## Seeded User Credentials

| Email | Password | Role |
|---|---|---|
| `user@test.com` | `password123` | `USER` |
| `admin@test.com` | `admin123` | `ADMIN` |

> **Never use these credentials in production.** The seed script is for development only.

---

## Seed Script Architecture

The seed script follows this structure:

```javascript
// backend/src/scripts/seed.js (simplified)
async function seed() {
  await connectDB();

  // 1. Clear existing seeded data
  await Promise.all([
    Airline.deleteMany({}),
    Airport.deleteMany({}),
    // ...
  ]);

  // 2. Insert reference data
  const airlines = await Airline.insertMany([...]);
  const airports = await Airport.insertMany([...]);

  // 3. Insert trip data with references
  const flights = await Flight.insertMany([
    {
      flight_number: 'VN123',
      airline_id: airlines[0]._id,
      origin_airport_id: airports[0]._id,       // HAN
      destination_airport_id: airports[1]._id,  // SGN
      ...
    }
  ]);

  // 4. Generate seats per flight
  for (const flight of flights) {
    const seats = generateSeats(flight._id, 'flight');
    await Seat.insertMany(seats);
  }

  // 5. Insert users (hashed passwords)
  await User.insertMany([...]);
}
```

---

## Resetting the Database

To drop all data and re-seed from scratch:

```bash
# With Docker
docker compose down -v          # destroys mongo_data volume
docker compose up -d            # starts fresh MongoDB
docker compose exec backend node src/scripts/seed.js

# Without Docker
mongosh transport_booking --eval "db.dropDatabase()"
node src/scripts/seed.js
```

---

## Extending the Seed

To add new seed data, edit `backend/src/scripts/seed.js`. Follow these conventions:
1. Add `deleteMany({})` for any new collection at the top.
2. Use `insertMany([...])` for bulk inserts.
3. Maintain referential integrity manually (store ObjectIds in variables).
4. Use `bcrypt.hashSync('password', 10)` for any seeded user passwords.
