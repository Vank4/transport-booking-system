# 01 — Infrastructure

**Last Updated:** 2026-03-05  
**Status:** Designed — Not Yet Implemented  
**Section:** arc42 Chapter 7 — Deployment View

> **Note:** No `Dockerfile` or `docker-compose.yml` files exist in the repository yet. This document specifies the intended target infrastructure. All Docker content below is a specification to be implemented.

---

## 1. Target Deployment Architecture

```mermaid
graph TB
    subgraph Production["Production Environment"]
        subgraph DMZ["DMZ / Ingress"]
            NGINX[NGINX Reverse Proxy\n:80 / :443]
        end

        subgraph App["Application Tier"]
            BE[Backend API\nNode.js 20\n:3000]
            FE[Frontend\nNext.js\n:3001]
        end

        subgraph Data["Data Tier"]
            MONGO[MongoDB 7\n:27017]
            REDIS[Redis 7\n:6379\n(future — session / rate-limit)]
        end
    end

    NGINX -->|/api/*| BE
    NGINX -->|/*| FE
    BE --> MONGO
    BE --> REDIS
```

---

## 2. Docker Compose Specification

The following `docker-compose.yml` is the target configuration (to be created at repository root):

```yaml
# docker-compose.yml  (TO BE CREATED)
version: "3.9"

services:

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tbs_backend
    env_file: ./backend/.env
    environment:
      NODE_ENV: development
    ports:
      - "3000:3000"
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - tbs_network
    volumes:
      - ./backend/src:/app/src   # hot-reload in development only
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: tbs_frontend
    env_file: ./frontend/.env.local
    ports:
      - "3001:3001"
    depends_on:
      - backend
    networks:
      - tbs_network
    restart: unless-stopped

  mongo:
    image: mongo:7.0
    container_name: tbs_mongo
    ports:
      - "27017:27017"      # Expose in dev only; remove for production
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - tbs_network
    restart: unless-stopped

networks:
  tbs_network:
    driver: bridge

volumes:
  mongo_data:
```

---

## 3. Container Specifications

| Container | Base Image | Port | Role |
|---|---|---|---|
| `tbs_backend` | `node:20-alpine` | 3000 | Express.js REST API + Socket.IO server |
| `tbs_frontend` | `node:20-alpine` (build) → `nginx:alpine` (serve) | 3001 | Next.js SSR/static frontend |
| `tbs_mongo` | `mongo:7.0` | 27017 | Primary MongoDB database |

---

## 4. Backend Dockerfile Specification

```dockerfile
# backend/Dockerfile  (TO BE CREATED)

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./
EXPOSE 3000
CMD ["node", "src/server.js"]
```

---

## 5. Frontend Dockerfile Specification

```dockerfile
# frontend/Dockerfile  (TO BE CREATED)

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3001
CMD ["node", "server.js"]
```

---

## 6. Volume Strategy

| Volume | Type | Contents | Backup Required |
|---|---|---|---|
| `mongo_data` | Named Docker volume | All MongoDB data | Yes — daily |
| `./backend/src` | Bind mount | Source code (dev only) | N/A |

---

## 7. Network Security

- `tbs_mongo` port 27017 must **not** be exposed to the host in production (remove `ports:` from `mongo` service).
- All inter-service communication uses the `tbs_network` bridge network by service name (`mongo:27017`, `backend:3000`).
- SSL/TLS is terminated at NGINX; backend and frontend communicate over plain HTTP within the Docker network.
