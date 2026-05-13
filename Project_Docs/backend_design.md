# Backend Design Overview

This document outlines the core components of a **real‑world startup backend** focusing on multi‑user management, subscription plans, usage tracking, rate limiting, and billing logic. It also highlights key PostgreSQL concepts (joins, aggregations, transactions) that are essential for implementing these features.

---

## 1. High‑Level Architecture

- **API Layer** – REST/GraphQL endpoints for authentication, subscription management, usage reporting, and billing.
- **Service Layer** – Business logic for rate limiting, invoicing, and plan enforcement.
- **Data Layer** – PostgreSQL database for persistent entities; optional Redis (or in‑memory) for fast rate‑limit counters.
- **Background Workers** – Periodic jobs for usage aggregation, invoice generation, and plan expiry handling.

---

## 2. Data Model (PostgreSQL)

### 2.1 Core Tables

| Table | Primary Key | Description |
|-------|-------------|-------------|
| **users** | `id` (UUID) | Account information, authentication data. |
| **plans** | `id` (UUID) | Subscription plan definitions (Free, Pro, Enterprise). |
| **subscriptions** | `id` (UUID) | Links a user to a plan, includes start/end dates, status. |
| **usage_events** | `id` (UUID) | Records each API call / storage usage event (timestamp, type, amount). |
| **invoices** | `id` (UUID) | Generated billing records (period, total amount, status). |
| **rate_limits** *(optional)* | `user_id` (UUID) | Cached counters for quick enforcement (tokens, reset timestamp). |

### 2.2 Sample DDL (simplified)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,                -- free, pro, enterprise
    monthly_price_cents INT NOT NULL,
    api_call_limit BIGINT,                    -- NULL = unlimited
    storage_gb_limit BIGINT,
    description TEXT
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL CHECK (status IN ('active','canceled','past_due')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('api_call','storage')),
    amount BIGINT NOT NULL,                -- number of calls or bytes stored
    recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount_cents INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft','paid','failed')),
    generated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Core Business Logic

### 3.1 Multi‑User System
- **Registration / Login** – Standard email/password flow, optionally OAuth.
- **Authentication** – JWTs (access + refresh) with short lifetimes.
- **Authorization** – Middleware checks `user_id` from token against resources.

### 3.2 Subscription Plans
- **Free** – Limited API calls and storage, no billing.
- **Pro** – Higher limits, monthly charge.
- **Enterprise** – Unlimited usage, custom pricing.
- **Plan Change** – Updated via `PATCH /subscriptions/:id`; changes are wrapped in a DB transaction to keep the subscription and associated billing period consistent.

### 3.3 Usage Tracking
- Each request that counts toward a quota creates a row in `usage_events`.
- Background aggregation (e.g., nightly) rolls up daily/monthly totals into a materialized view or summary table for fast reporting.

### 3.4 Rate Limiting (Per‑User)
- **Token‑Bucket** algorithm stored in Redis (or `rate_limits` table for simplicity).
- On each request: `GET` current bucket → if tokens > 0, decrement; else reject with `429 Too Many Requests`.
- Bucket refills based on the plan’s `api_call_limit` / time window.

### 3.5 Billing Logic (Mocked)
- **Invoice Generation** – At the end of each billing cycle, a job sums usage, applies the plan price, and creates a row in `invoices`.
- **Payment** – Mocked endpoint `/payments` that flips `status` to `paid`.
- **Proration** – For mid‑cycle upgrades/downgrades, calculate prorated amount using the `transactions` feature (see below).

---

## 4. PostgreSQL Concepts Demonstrated

### 4.1 Joins (users ↔ subscriptions ↔ plans)
```sql
SELECT u.id AS user_id,
       u.email,
       p.name AS plan_name,
       s.status,
       s.start_date,
       s.end_date
FROM   users u
JOIN   subscriptions s ON s.user_id = u.id
JOIN   plans p ON p.id = s.plan_id
WHERE  u.id = 'some‑uuid';
```

### 4.2 Aggregations (usage count per user per month)
```sql
SELECT user_id,
       date_trunc('month', recorded_at) AS month,
       SUM(CASE WHEN event_type = 'api_call' THEN amount ELSE 0 END) AS api_calls,
       SUM(CASE WHEN event_type = 'storage' THEN amount ELSE 0 END) AS storage_bytes
FROM   usage_events
WHERE  recorded_at >= now() - INTERVAL '1 year'
GROUP  BY user_id, date_trunc('month', recorded_at)
ORDER  BY month DESC;
```

### 4.3 Transactions (atomic subscription upgrade with invoice creation)
```sql
BEGIN;

-- 1. Update subscription to new plan
UPDATE subscriptions
SET    plan_id = 'new‑plan‑uuid',
       status = 'active',
       start_date = CURRENT_DATE,
       end_date = NULL
WHERE  id = 'sub‑uuid';

-- 2. Create a draft invoice for the prorated amount
INSERT INTO invoices (user_id, period_start, period_end, total_amount_cents, status)
VALUES (
    (SELECT user_id FROM subscriptions WHERE id = 'sub‑uuid'),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month',
    999,  -- mocked prorated cents
    'draft'
);

COMMIT;
```
> Using a transaction ensures that the subscription change and its corresponding invoice are either both persisted or both discarded, keeping data consistent.

---

## 5. Operational Considerations

- **Indexes** – Add indexes on `users.email`, `subscriptions.user_id`, `usage_events.user_id`, and `usage_events.recorded_at` for fast lookups.
- **Background Workers** – Use a job queue (e.g., Sidekiq, Bull, or a simple cron) for aggregation and invoice generation.
- **Observability** – Export metrics (API call count, rate‑limit hits, invoice generation latency) to Prometheus or similar.
- **Testing** – Unit tests for service functions, integration tests for API endpoints, and end‑to‑end tests for billing flows.

---

## 6. Next Steps

1. **Implement API endpoints** for registration, login, subscription CRUD, usage reporting, and mock payments.
2. **Add middleware** for JWT authentication and per‑user rate limiting.
3. **Create background jobs** for usage aggregation and invoice generation.
4. **Write tests** covering happy paths and edge cases (rate‑limit breach, plan downgrade, failed payment).
5. **Deploy** to a staging environment and verify PostgreSQL transaction integrity.

---

*This markdown file serves as a design blueprint to guide the implementation of a production‑grade backend for a SaaS startup.*