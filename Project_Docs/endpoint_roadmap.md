# Endpoint Roadmap

This file captures the first implementation slice for the Backend Practice API.

## Build Order

1. `GET /health`
   - Simple app health check.
   - Useful for deployment and monitoring practice.

2. `GET /api/plans`
   - Starts the SaaS direction from the design docs.
   - Returns the Free, Pro, and Enterprise plans.

3. `GET /api/plans/:id`
   - Practice route params.
   - Return `404` when the requested plan does not exist.

4. `POST /api/subscriptions`
   - Requires authentication.
   - Lets the current user choose a plan and create their first real feature after users.

5. `GET /api/subscriptions/me`
   - Returns the authenticated user's active subscription.
   - Keeps the route scoped to the current user instead of exposing arbitrary IDs.

## Implementation Notes

- Keep `GET /health` independent of the database if possible so it stays reliable.
- Protect the subscription routes with the existing JWT middleware.
- Update Swagger documentation as each endpoint is added.
- Keep responses small and predictable so the API is easy to test from Postman or Swagger UI.