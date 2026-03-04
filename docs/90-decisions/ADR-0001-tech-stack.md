# ADR-0001: Tech Stack

Status: Accepted
Date: 2026-03-04
Supersedes: ADR-0001-tech-stack (PostgreSQL + Prisma)

## Context

Hệ thống đặt vé (máy bay + tàu) có các yêu cầu quan trọng:

- Realtime seat map + seat hold TTL (15 phút) và broadcast thay đổi cho nhiều client.
- Luồng booking/payment cần idempotency callback và đảm bảo không double booking.
- Team 4–5 người, cần stack dễ onboarding, tốc độ triển khai nhanh, dễ maintain.

Bản ADR cũ dùng PostgreSQL + Prisma. Tuy nhiên nhóm quyết định chuyển sang MongoDB để:

- Linh hoạt schema giai đoạn đầu (seed dữ liệu demo, thay đổi nhanh).
- Dễ triển khai local/dev bằng Docker, giảm độ phức tạp migrate trong giai đoạn MVP.
- Mongoose + Mongo transactions vẫn đáp ứng được transaction cần thiết (confirm payment).

## Decision

Chọn tech stack như sau:

### Backend

- Node.js (LTS)
- Express.js
- MongoDB (Docker)
- Mongoose (ODM)
- Socket.IO (realtime)
- JWT (authentication)
- Zod/Joi (validation)
- Logger: pino (hoặc winston — chốt 1 lib trong codebase)

### Frontend

- React + TypeScript
- Vite
- State: Zustand/Redux Toolkit (tùy team)
- Socket.IO client

### Dev/Tooling

- Docker Compose cho MongoDB + mongo-express
- Postman collection cho test API
- GitHub PR workflow + code review

## Alternatives Considered

1. PostgreSQL + Prisma:

- Ưu: ACID + FK mạnh, schema “chặt”, phù hợp hệ thống booking.
- Nhược: migrate/constraint phức tạp hơn khi MVP còn đổi nhiều.

2. NestJS:

- Ưu: structure rõ.
- Nhược: tăng độ học/boilerplate, không cần thiết cho MVP team nhỏ.

## Consequences

### Positive

- Tốc độ phát triển nhanh cho MVP.
- Schema linh hoạt, seed/demo dữ liệu dễ.
- Socket.IO tích hợp realtime thuận lợi.

### Trade-offs / Risks

- MongoDB không có FK thực sự → phải enforce integrity bằng code & indexes.
- Seat-hold/booking/payment phải tuân thủ atomic update + transaction, nếu code sai dễ double booking.
- Cần quy ước chặt chẽ cho collection naming, indexes, error codes, response format.

## Notes / Guardrails

- Mọi thay đổi trạng thái seat/booking/payment chỉ được thực hiện ở backend.
- Seat-hold bắt buộc dùng atomic update (findOneAndUpdate với condition) để chống race condition.
- Confirm payment phải chạy trong Mongo transaction (session + withTransaction).
- Đặt chuẩn response/error theo api-conventions.md.
