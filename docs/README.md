# Transport Booking System - Documentation

**Last Updated:** 2026-03-05
**Framework:** arc42 (v8)
**Stack:** Node.js 20 + Express 4 + MongoDB 7 | React 18 + Next.js (App Router)

> This directory is the **single source of truth** for the entire system.

---

## Quick Navigation

| Section | Description |
|---|---|
| [01 Introduction](./01-introduction/01-system-overview.md) | System overview, quality goals, stakeholders |
| [02 Constraints](./02-constraints/01-technical-constraints.md) | Technical constraints |
| [03 Context](./03-context/01-system-context.md) | System boundaries, roles, external dependencies |
| [04 Solution Strategy](./04-solution-strategy/01-architecture-decisions.md) | Architecture principles |
| [05 Building Blocks](./05-building-blocks/01-backend-components.md) | Backend + frontend components, modules |
| [06 Runtime](./06-runtime/01-seat-hold-flow.md) | Seat hold + payment flows (Mermaid diagrams) |
| [07 Deployment](./07-deployment/03-local-setup.md) | Infrastructure, env vars, local setup, production |
| [08 Crosscutting](./08-crosscutting/01-api-conventions.md) | API conventions, errors, security, testing |
| [09 Decisions](./09-decisions/ADR-0001-tech-stack.md) | Architecture Decision Records |
| [10 API Reference](./10-api-reference/README.md) | Full endpoint documentation |
| [11 Database](./11-database/01-data-model.md) | Data model, ERD, seed guide |
| [12 Dev Guide](./12-dev-guide/01-folder-structure.md) | Folder structure, conventions, git workflow |

---

## File Index

### 01 Introduction
- [01-system-overview.md](./01-introduction/01-system-overview.md)
- [02-quality-goals.md](./01-introduction/02-quality-goals.md)
- [03-stakeholders.md](./01-introduction/03-stakeholders.md)

### 02 Constraints
- [01-technical-constraints.md](./02-constraints/01-technical-constraints.md)

### 03 Context
- [01-system-context.md](./03-context/01-system-context.md)
- [02-roles-permissions.md](./03-context/02-roles-permissions.md)

### 04 Solution Strategy
- [01-architecture-decisions.md](./04-solution-strategy/01-architecture-decisions.md)

### 05 Building Blocks
- [01-backend-components.md](./05-building-blocks/01-backend-components.md)
- [02-frontend-components.md](./05-building-blocks/02-frontend-components.md)
- [03-functional-modules.md](./05-building-blocks/03-functional-modules.md)

### 06 Runtime
- [01-seat-hold-flow.md](./06-runtime/01-seat-hold-flow.md)
- [02-payment-flow.md](./06-runtime/02-payment-flow.md)

### 07 Deployment
- [01-infrastructure.md](./07-deployment/01-infrastructure.md)
- [02-environment-variables.md](./07-deployment/02-environment-variables.md)
- [03-local-setup.md](./07-deployment/03-local-setup.md)
- [04-production-deployment.md](./07-deployment/04-production-deployment.md)

### 08 Crosscutting Concepts
- [01-api-conventions.md](./08-crosscutting/01-api-conventions.md)
- [02-error-catalogue.md](./08-crosscutting/02-error-catalogue.md)
- [03-security.md](./08-crosscutting/03-security.md)
- [04-testing-strategy.md](./08-crosscutting/04-testing-strategy.md)

### 09 Architecture Decisions
- [ADR-0001-tech-stack.md](./09-decisions/ADR-0001-tech-stack.md) - Node.js + MongoDB (Accepted)
- [ADR-0002-db-modeling.md](./09-decisions/ADR-0002-db-modeling.md) - Hybrid modeling (Accepted)
- [ADR-0003-seat-hold-rules.md](./09-decisions/ADR-0003-seat-hold-rules.md) - Atomic hold, TTL job (Accepted)

### 10 API Reference
- [README.md](./10-api-reference/README.md) - Implementation status
- [01-auth.md](./10-api-reference/01-auth.md)
- [02-search.md](./10-api-reference/02-search.md)
- [03-seats.md](./10-api-reference/03-seats.md)
- [04-bookings.md](./10-api-reference/04-bookings.md)
- [05-vouchers.md](./10-api-reference/05-vouchers.md)
- [06-admin.md](./10-api-reference/06-admin.md)

### 11 Database
- [01-data-model.md](./11-database/01-data-model.md)
- [02-erd.md](./11-database/02-erd.md)
- [03-seed-guide.md](./11-database/03-seed-guide.md)

### 12 Developer Guide
- [01-folder-structure.md](./12-dev-guide/01-folder-structure.md)
- [02-coding-conventions.md](./12-dev-guide/02-coding-conventions.md)
- [03-git-workflow.md](./12-dev-guide/03-git-workflow.md)
- [04-ui-pages.md](./12-dev-guide/04-ui-pages.md)

---

## Known Issues (Critical)

| # | Issue | File | Priority |
|---|---|---|---|
| 1 | search.routes.js not mounted - search returns 404 | src/app.js | Critical |
| 2 | routes/index.js calls app.listen(3000) - duplicate server | src/routes/index.js | Critical |
| 3 | hold_expired_at stored as Number not Date | src/controllers/seat.controller.js | High |
| 4 | getAllBookings returns all users data | src/controllers/booking.controller.js | High |
| 5 | authMiddleware reads process.env.JWT_SECRET directly | src/middleware/authMiddleware.js | Medium |
| 6 | No TTL expiry job - seat holds never auto-release | src/jobs/ (empty) | High |
