# API Endpoint Specification

This document enumerates all REST endpoints required for the **Backend‑Practice** SaaS prototype, indicates which ones already exist in the code base, which ones still need implementation, and explains the primary use‑case for each.

---

## Existing Endpoints (already implemented)

| Method | Path | Description | Use‑Case |
|--------|------|-------------|----------|
| `POST` | `/auth/login` | Authenticate a user and return a JWT (access + refresh tokens). | Allows a client to obtain credentials for all protected API calls. |
| `POST` | `/api/users/register` | Register a new user (sign‑up). | Enables a new account creation; open endpoint (no auth). |
| `GET` | `/api/users` | List all users (admin view). | Useful for administration or debugging; typically protected by admin role. |
| `GET` | `/api/users/:id` | Retrieve a single user’s profile. | Used by the client to display the authenticated user’s details. |
| `PUT` | `/api/users/:id` | Update a user’s information. | Allows a user (or admin) to modify profile data, e.g., email or password. |
| `DELETE` | `/api/users/:id` | Delete a user account. | Enables account removal; protected by authentication/authorization. |

---

## Required Endpoints (not yet present)

| Method | Path | Description | Use‑Case |
|--------|------|-------------|----------|
| `GET` | `/api/plans` | Return the catalog of subscription plans (Free, Pro, Enterprise). | Front‑end needs to show pricing options and plan limits before a user subscribes. |
| `GET` | `/api/plans/:id` | Return details for a single plan (limits, price, description). | Allows the UI to display plan‑specific information when a user selects a plan. |
| `POST` | `/api/subscriptions` | Create a subscription for the authenticated user (payload: `planId`). | Starts a billing cycle and links the user to a plan; required after sign‑up or upgrade. |
| `GET` | `/api/subscriptions` | List the current user's subscriptions (usually a single active record). | Enables a user to view their active plan and status on an account dashboard. |
| `GET` | `/api/subscriptions/:id` | Retrieve a specific subscription record (status, dates, limits). | Needed for detailed subscription management pages. |
| `PATCH` | `/api/subscriptions/:id` | Update a subscription – change plan, pause, or cancel. | Supports plan upgrades/downgrades; wrapped in a DB transaction to keep billing and subscription in sync. |
| `DELETE` | `/api/subscriptions/:id` | Cancel a subscription immediately. | Allows a user to stop recurring billing and revert to a free tier. |
| `GET` | `/api/usage` | Return the authenticated user's current usage snapshot (API calls used, storage used, remaining quota). | Shows the user how close they are to hitting their limits; used for UI warnings and rate‑limit enforcement. |
| `GET` | `/api/usage/:userId` | (Admin only) View any user's usage history. | Support staff can investigate over‑usage or disputes. |
| `GET` | `/api/rate-limit` | Expose the token‑bucket state for the caller (tokens left, reset timestamp). | Gives the client immediate feedback to throttle locally and avoid 429 errors. |
| `POST` | `/api/rate-limit/reset` | (Admin only) Reset a user's bucket manually. | Useful for support scenarios where a user’s quota was mistakenly exhausted. |
| `GET` | `/api/invoices` | List all invoices for the authenticated user. | Provides a billing history view on the account page. |
| `GET` | `/api/invoices/:id` | Retrieve a single invoice (line items, total, status, due date). | Allows a user to download or view the detailed bill for a period. |
| `POST` | `/api/payments` | Mock payment endpoint – marks a given invoice as `paid`. Payload typically includes `invoiceId` and mock payment data. | Simulates a checkout flow; in a real system this would integrate with Stripe/PayPal. |
| `GET` | `/health` | Simple health‑check returning `200 OK` if the app and DB are reachable. | Used by load‑balancers, Kubernetes probes, and monitoring tools. |
| `GET` | `/info` *(optional)* | Return service metadata – version, environment, feature flags. | Helpful for debugging deployments and confirming the running version. |

---

## Additional Optional Endpoints (future‑proofing)

| Method | Path | Description | Use‑Case |
|--------|------|-------------|----------|
| `POST` | `/auth/refresh` | Exchange a refresh token for a new access token. | Enables long‑living sessions without forcing the user to re‑login. |
| `POST` | `/auth/logout` | Invalidate the current refresh token (or token blacklist). | Improves security by allowing explicit logout. |
| `POST` | `/users/:id/password-reset` | Initiate a password‑reset flow (send email with token). | Standard account‑recovery functionality. |
| `POST` | `/webhooks/payments` | Receive payment‑provider webhooks (e.g., Stripe `invoice.paid`). | Keeps invoice status in sync with real payment providers when moving from mocked to real billing. |
| `GET` | `/admin/usage-report` | Aggregate usage across all users (admin dashboard). | Provides business insight for capacity planning and revenue forecasting. |
| `GET` | `/admin/health` | Extended health probe with DB, Redis, and external service checks. | For advanced ops monitoring.

---

## Why These Endpoints Cover the Design



1. **Authentication & Authorization** – `/auth/*` endpoints provide JWT handling; all `/api/*` routes are protected by `authMiddleware.authenticateToken`.
2. **User Management** – Already present; required for identity and linking subscriptions.
3. **Plan Catalog** – Enables the marketplace UI to present options and price information.
4. **Subscription Lifecycle** – CRUD endpoints allow users to start, change, or cancel a plan; they map directly to the `subscriptions` table and use transactions for data integrity.
5. **Usage & Rate‑Limiting** – `/api/usage` and `/api/rate-limit` expose the metrics that the background workers aggregate and the token‑bucket algorithm consumes.
6. **Billing** – Invoices and mock payment endpoints close the loop from usage → invoice → payment, matching the *Billing Logic (Mocked)* section of the design.
7. **Operational Health** – `/health` (and optionally `/info`) give external systems a reliable way to verify the service is up and correctly configured.
8. **Future Extensions** – The optional endpoints give a roadmap for a production‑grade service (refresh tokens, password reset, real payment webhooks, admin dashboards).


If you implement the above list, the API will fully support the **multi‑user, subscription‑based, usage‑tracked, rate‑limited, and billable** workflow described in *backend_design.md*.

---

*Note*: The current code base already contains the user and auth routes. All other routes need to be added, their controllers created, and the routes wired in `index.js` (e.g., `app.use('/api/plans', planRoutes)`).
