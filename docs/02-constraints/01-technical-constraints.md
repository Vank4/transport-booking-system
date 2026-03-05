# 01 — Technical Constraints

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 2 — Constraints

---

## 1. Technology Constraints

| Constraint | Detail | Source |
|---|---|---|
| **Runtime: Node.js LTS (v20)** | Backend must run on Node.js 20. No Java, Python, or other runtimes. | ADR-0001 |
| **Language: JavaScript (CommonJS)** | Backend source is `.js` files using `require()`/`module.exports`. TypeScript migration is not planned for MVP. | Live codebase |
| **Database: MongoDB 7** | MongoDB is the only persistent store. No PostgreSQL, Redis, or other databases in the MVP. | ADR-0001 |
| **ODM: Mongoose 8** | All database access must go through Mongoose models. Raw MongoDB driver calls are not permitted. | ADR-0002 |
| **HTTP Framework: Express.js 4** | The REST API is built on Express. No Fastify, Hapi, or NestJS. | ADR-0001 |
| **Frontend: React + TypeScript / Next.js** | The web application uses the Next.js App Router. No Vue.js, Angular, or other frameworks. | ADR-0001 |
| **Frontend State: Zustand** | Client-side state management will use Zustand. Redux Toolkit is an alternative if team preference shifts, but one library must be chosen consistently. | ADR-0001 |
| **Realtime: Socket.IO** | WebSocket communication uses Socket.IO on both backend and frontend. Raw WebSocket or SSE are not used. | ADR-0001 |
| **Authentication: JWT (stateless)** | Sessions are not used. JWTs are signed with `JWT_SECRET`, expire in 1 hour, and carry `{ userId }`. | Live codebase |
| **Password hashing: bcrypt** | Passwords are hashed with `bcrypt` (cost factor 10). | Live codebase |

> ⚠ **Critical note:** Several documents in the original `docs/` folder referenced **PostgreSQL + Prisma**. That decision was formally superseded by **ADR-0001** (dated 2026-03-04). All schema, migration, and ORM references in this documentation suite reflect **MongoDB + Mongoose**.

---

## 2. Organizational Constraints

| Constraint | Detail |
|---|---|
| **Team size** | 4–5 developers; no dedicated DevOps or DBA. |
| **Scope** | MVP — minimum viable feature set. Architectural choices that add significant complexity without MVP benefit must be deferred. |
| **Branch policy** | No direct pushes to `main`. All changes go through pull requests into `develop`. See [12-dev-guide/03-git-workflow.md](../12-dev-guide/03-git-workflow.md). |
| **Schema changes** | Database schema changes (Mongoose model changes) must be documented in `11-database/01-data-model.md` and reviewed before implementation. |
| **API contract changes** | Breaking changes to any endpoint documented in `10-api-reference/` require prior team agreement and documentation update. |

---

## 3. Infrastructure Constraints

| Constraint | Detail |
|---|---|
| **Local dev via Docker Compose** | The development database runs in Docker. Developers must have Docker Desktop installed. See [07-deployment/03-local-setup.md](../07-deployment/03-local-setup.md). |
| **No Prisma** | `prisma/schema.prisma` exists in the repository but is empty and unused. It should be deleted. Prisma CLI commands (`prisma migrate`, `prisma generate`) must not be used. |
| **No `.env` in version control** | `.env` files are git-ignored. `.env.example` files (with placeholder values only) must be present in both `backend/` and `frontend/`. |
| **Secret injection** | In production, secrets (`JWT_SECRET`, `PAYMENT_WEBHOOK_SECRET`) must be injected at runtime via environment variables — never committed to source control or baked into Docker images. |
