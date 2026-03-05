# 03 — Local Development Setup

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 7 — Deployment View

---

## Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Node.js | 20 LTS | `node -v` |
| npm | 9+ | `npm -v` |
| Git | 2.x | `git --version` |
| Docker Desktop | 24+ | `docker --version` |
| Docker Compose | V2 plugin | `docker compose version` |

---

## Option A — Docker Compose (Recommended)

> **Prerequisite:** Docker files must first be created per [07-deployment/01-infrastructure.md](./01-infrastructure.md). They do not exist in the repository yet.

Once the Docker files exist:

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd transport-booking-system

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env: set MONGO_URI, JWT_SECRET, etc.

# 3. Configure frontend environment
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local: set NEXT_PUBLIC_API_BASE_URL

# 4. Start all services
docker compose up -d

# 5. Verify services are running
docker compose ps

# 6. Seed the database
docker compose exec backend node src/scripts/seed.js

# 7. Access the application
# Frontend: http://localhost:3001
# Backend:  http://localhost:3000/api/health
```

To stop all services:
```bash
docker compose down
```

To reset the database (destroys all data):
```bash
docker compose down -v
```

---

## Option B — Manual (No Docker)

Use this option if Docker is unavailable. Requires MongoDB installed locally.

### 1. Install MongoDB locally

Follow [MongoDB Community Installation](https://www.mongodb.com/docs/manual/installation/) for your OS, then start the daemon:

```bash
# macOS (Homebrew)
brew services start mongodb-community@7.0

# Ubuntu/Debian
sudo systemctl start mongod

# Verify connection
mongosh --eval "db.adminCommand('ping')"
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

```bash
cp .env.example .env
```

Edit `backend/.env`:

```
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/transport_booking
JWT_SECRET=<generate a 48-char random string>
CORS_ORIGIN=http://localhost:3001
SEAT_HOLD_TTL_MINUTES=15
```

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 5. Configure frontend environment

```bash
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 6. Seed the database

```bash
cd ../backend
node src/scripts/seed.js
```

See [11-database/03-seed-guide.md](../11-database/03-seed-guide.md) for what the seed script creates.

### 7. Start the services

In separate terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Server listening on port 3000

# Terminal 2 — Frontend
cd frontend
npm run dev
# Next.js dev server on port 3001
```

---

## Verify the Setup

```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
# { "status": "ok", "database": "connected" }
```

---

## Known Issues

| Issue | Workaround |
|---|---|
| `search.routes.js` not mounted in `app.js` | `GET /api/flights/search` returns 404. Add `app.use('/api', require('./routes/search.routes'))` to `app.js` manually. |
| `routes/index.js` spawns a duplicate server | Do not import `routes/index.js`. It creates a port collision. |
| No Docker files in repository | Follow Option B until Docker files are created. |
