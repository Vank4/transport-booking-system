# 02 — Entity Relationship Diagram

**Last Updated:** 2026-03-05  
**Status:** Active  
**Section:** arc42 Chapter 11 — Database

> MongoDB does not enforce foreign keys. The relationships below are maintained at the application layer via Mongoose populate queries.

---

## Core Domain ERD

```mermaid
erDiagram
    users {
        ObjectId _id PK
        string email UK
        string password
        string fullName
        string role
        string status
    }

    flights {
        ObjectId _id PK
        string flight_number
        ObjectId airline_id FK
        ObjectId origin_airport_id FK
        ObjectId destination_airport_id FK
        date departure_time
        date arrival_time
        object prices
        string status
    }

    train_trips {
        ObjectId _id PK
        ObjectId train_id FK
        ObjectId origin_station_id FK
        ObjectId destination_station_id FK
        date departure_time
        date arrival_time
        object prices
        string status
    }

    seats {
        ObjectId _id PK
        ObjectId trip_id FK
        string trip_type
        string seat_number
        string seat_class
        number price
        string status
        ObjectId held_by FK
        date hold_expired_at
        ObjectId carriage_id FK
    }

    bookings {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId trip_id FK
        string trip_type
        ObjectId[] seat_ids FK
        ObjectId[] ticket_ids FK
        ObjectId payment_id FK
        ObjectId voucher_id FK
        number total_amount
        string status
    }

    tickets {
        ObjectId _id PK
        ObjectId booking_id FK
        ObjectId seat_id FK
        object passenger
        string qr_token
    }

    payments {
        ObjectId _id PK
        ObjectId booking_id FK
        string provider
        number amount
        string status
    }

    vouchers {
        ObjectId _id PK
        string code UK
        string discountType
        number discountValue
        number usageCount
        date expiresAt
        string status
    }

    airlines {
        ObjectId _id PK
        string name
        string code UK
    }

    airports {
        ObjectId _id PK
        string name
        string code UK
        string city
        string country
    }

    trains {
        ObjectId _id PK
        string name
        string train_number
    }

    train_stations {
        ObjectId _id PK
        string name
        string code UK
        string city
    }

    train_carriages {
        ObjectId _id PK
        ObjectId train_id FK
        string carriage_number
        string carriage_type
        number capacity
    }

    users ||--o{ bookings : "makes"
    bookings ||--|| payments : "has"
    bookings ||--o{ tickets : "contains"
    bookings }o--|| vouchers : "applies"
    bookings }o--o{ seats : "includes"
    flights }o--|| airlines : "operated by"
    flights }o--|| airports : "departs from"
    flights }o--|| airports : "arrives at"
    seats }o--|| flights : "on (flight)"
    seats }o--|| train_trips : "on (train)"
    seats }o--o| train_carriages : "in carriage"
    seats }o--o| users : "held by"
    tickets }o--|| seats : "for"
    train_trips }o--|| trains : "uses"
    train_trips }o--|| train_stations : "departs from"
    train_trips }o--|| train_stations : "arrives at"
    train_carriages }o--|| trains : "part of"
```

---

## Booking Flow Relationships

```mermaid
graph LR
    U[User] -->|creates| B[Booking]
    B -->|has| P[Payment]
    B -->|contains| T[Ticket]
    T -->|for| S[Seat]
    S -->|on| F[Flight / TrainTrip]
    B -->|optionally uses| V[Voucher]
```

---

## Index Map

```mermaid
graph TD
    subgraph seats_indexes["seats collection indexes"]
        SI1["{ trip_id: 1, status: 1 }"]
        SI2["{ held_by: 1, hold_expired_at: 1 }"]
    end
    subgraph bookings_indexes["bookings collection indexes"]
        BI1["{ user_id: 1 }"]
        BI2["{ status: 1 }"]
    end
    subgraph flights_indexes["flights collection indexes"]
        FI1["{ origin_airport_id: 1, destination_airport_id: 1, departure_time: 1 }"]
    end
    subgraph users_indexes["users collection indexes"]
        UI1["{ email: 1 } UNIQUE"]
    end
    subgraph vouchers_indexes["vouchers collection indexes"]
        VI1["{ code: 1 } UNIQUE"]
    end
```
