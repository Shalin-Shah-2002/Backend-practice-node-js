# Backend Practice

This repository is a backend practice playground for building random APIs, testing ideas quickly, and improving implementation logic over time.

It is not a finished product and it does not have a fixed feature set yet. That is intentional. The whole point of this repo is to stay flexible enough that I can experiment with route design, data handling, authentication, database access, API documentation, and small LLM-assisted workflows while I learn.

## Why This Project Is Important

Backend development is where a lot of real application complexity lives. Frontend screens are visible, but the backend is usually where the important decisions happen: how data moves, how requests are validated, how access is controlled, how errors are handled, and how the system stays understandable as it grows.

This project matters because it creates a space to practice those fundamentals without pressure to ship a full product. By building many small APIs and revisiting them over time, I get repeated practice with the exact things that make backend work strong:

- designing routes and response shapes
- validating input before it reaches the database
- wiring authentication and authorization correctly
- separating controllers, middleware, and routes
- documenting endpoints so the API is readable later
- learning how to make code easier to extend instead of harder

That repetition is valuable. Small backend exercises build durable instincts. The more often I solve the same kinds of problems in slightly different ways, the faster I get at spotting bad structure, simplifying logic, and choosing patterns that are easier to maintain.

This repo is also important because it gives me a practical place to experiment with small LLMs. The goal is not to replace understanding. The goal is to use tools that can help with brainstorming, checking logic, and speeding up experimentation while I still stay responsible for the actual code and decisions.

## What This Repository Is For

- Practicing backend development from scratch
- Building multiple APIs without needing a finished product first
- Improving logic, structure, and problem solving
- Exploring authentication, request handling, and database integration
- Keeping API docs close to the code
- Testing small LLM-assisted workflows in a real codebase

## Current Status

There is no stable product direction yet. This repository is intentionally open-ended and may change often as I keep learning. Endpoints, structure, and implementation details can be rewritten whenever a better approach appears.

## Current Stack

- Express.js for routing and HTTP handling
- body-parser for parsing incoming requests
- dotenv for environment variables
- jsonwebtoken for token-based authentication
- bcrypt for password hashing
- mongoose and pg / pg-hstore for database experimentation
- Prisma tooling for schema and client workflows
- Swagger documentation for API exploration

## What The App Currently Does

- Serves a root page from `views/`
- Exposes Swagger UI at `/api-docs`
- Serves the OpenAPI spec at `/swagger.json`
- Mounts auth routes under `/auth`
- Mounts user routes under `/api/users`

## Project Structure

- `controllers/` - request handlers and business logic
- `models/` - Prisma-backed data access layer
- `routes/` - API route definitions
- `middleware/` - auth and request middleware
- `docs/` - Swagger and API documentation files
- `public/swagger/` - Swagger UI assets
- `views/` - simple static files and the landing page
- `prisma/` - Prisma schema and client setup
- `generated/` - generated Prisma client output

## Why Swagger Is Here

Swagger helps keep the API understandable while it is still changing. For a practice project, that matters because documentation forces me to think clearly about request bodies, response shapes, edge cases, and the way different endpoints fit together.

Even if the API is still evolving, having a visible spec makes it easier to test ideas, compare versions, and avoid turning the codebase into a collection of undocumented experiments.

## Learning Goals

This project is mainly about building skill in the areas that matter most in backend work:

- route design
- controller separation
- authentication flow
- request validation
- error handling
- database integration
- documentation discipline
- iterative refactoring
- practical use of small LLMs while still understanding the code

## How To Run Locally

1. Install dependencies.
2. Create and configure a `.env` file with the values your setup needs.
3. Start the server with `node index.js`.

The server uses `PORT` if it is set, otherwise it defaults to `3000`.

## Notes For Future Work

- This repository is meant to evolve as a practice space.
- The API surface may change often.
- Documentation may lag behind implementation during experiments.
- Keep changes small, understandable, and easy to revise.
- Treat this repo as a training ground for better backend reasoning, not just a place to add features.