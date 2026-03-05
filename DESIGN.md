# DESIGN

## Monorepo layout
- `apps/web` contains the user-facing React application.
- `apps/api` contains the NestJS API and Prisma schema.
- `packages/shared` contains shared request and response contracts so the frontend is aligned with the backend.

## Planned pages and routing
- `/login`: authenticate with email and password to receive a bearer token.
- `/draft-plans`: list all draft plans and create a new plan.
- `/draft-plans/:planId`: show plan details with separate Ban List and Preferred Picks sections.
- `HeroBrowserModal`: opened from the detail page to browse OpenDota heroes and insert them into either section.

## State management approach
- Frontend implementation: React with React Router for navigation and TanStack Query for server state.
- Backend state is authoritative. The UI should avoid local persistence because the requirement explicitly asks for PostgreSQL persistence.
- Local component state is used only for form inputs and modal visibility.

## Data flow
- UI sends `POST /auth/login` and stores the access token in browser storage.
- API client attaches `Authorization: Bearer <token>` for protected routes.
- UI requests `GET /draft-plans` and `GET /draft-plans/:id` to render list and detail screens.
- UI sends mutations to the NestJS API for creating plans and editing hero entries.
- NestJS validates input with DTOs, executes domain logic in services, and persists through Prisma to PostgreSQL.
- Every draft plan write/read query is scoped by authenticated `user.id`, so users can only see and mutate their own records.
- Hero metadata comes from OpenDota, is normalized by the API, and is cached into the local `heroes` table so draft plans always reference a stable `heroId`.
- A PostgreSQL-backed cache metadata row in `hero_cache_states` stores freshness, last sync timestamps, and stale TTL state so repeated `GET /heroes` requests do not repeatedly call OpenDota.
- When the hero cache becomes stale, the API returns the stored PostgreSQL data immediately and enqueues a background refresh job in `background_jobs`.
- A lightweight worker inside the API process polls PostgreSQL with row locking, claims a queued job, updates progress in PostgreSQL, and completes or fails the job without Redis, RabbitMQ, or any external queue.

## Error handling
- Validation errors are rejected by NestJS `ValidationPipe`.
- Missing or invalid bearer tokens return `401`.
- Missing plans, entries, or heroes return `404`.
- Duplicate hero assignments within the same plan section return `409`.
- Upstream OpenDota failures return `503`, keeping the failure boundary at the API layer.
- Background sync job failures are persisted to PostgreSQL in `background_jobs.error_message` and exposed through the job status endpoint.

## What is intentionally not built
- Registration, password reset, social login, and rotating refresh tokens are out of scope.

## API shape
- `GET /health`
- `POST /auth/login`
- `GET /heroes`
- `GET /heroes/cache`
- `POST /heroes/sync`
- `POST /heroes/sync-jobs`
- `GET /heroes/sync-jobs/:jobId`
- `GET /draft-plans`
- `POST /draft-plans`
- `GET /draft-plans/:id`
- `POST /draft-plans/:id/bans`
- `PATCH /draft-plans/:planId/bans/:entryId`
- `DELETE /draft-plans/:planId/bans/:entryId`
- `POST /draft-plans/:id/preferred-picks`
- `PATCH /draft-plans/:planId/preferred-picks/:entryId`
- `DELETE /draft-plans/:planId/preferred-picks/:entryId`
