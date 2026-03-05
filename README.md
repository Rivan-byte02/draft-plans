# draft-plans

Monorepo foundation for a Dota 2 Draft Plans app with a React frontend and a dedicated NestJS API backed by Prisma, PostgreSQL, and Docker Compose.

## Workspace structure
- `apps/web`: React + Vite frontend.
- `apps/api`: NestJS + Prisma backend.
- `packages/shared`: shared contracts used by frontend and backend.

## Local setup
1. Copy `.env.example` to `.env`.
2. Run `npm run install:all`.
3. Run `docker compose up --build`.
4. Run `npm run db:setup` (single command to migrate + seed for local DB initialization).
5. Open `http://localhost:5173` and verify API health at `http://localhost:3000/health`.

## Notes
- Database initialization and seeding run automatically in the API container entrypoint.
- Local Prisma and seed commands read the root `.env`, so the API app and Prisma CLI target the same database configuration.
- If `DATABASE_URL` is omitted, the API and Prisma scripts derive it from `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `DATABASE_SCHEMA`.
- Docker PostgreSQL is exposed on host port `5433` by default to avoid collisions with local PostgreSQL services on `5432`.
- The backend persists draft plans in PostgreSQL and stores hero references by OpenDota hero ID.
- Draft plan deletes and draft plan entry deletes use soft delete via `deleted_at`, not hard delete.
- The frontend consumes the backend through typed contracts from `packages/shared`.
- Dependencies are installed per app, so `apps/api/node_modules` and `apps/web/node_modules` are both expected after local install or Docker build.
- Required submission docs are included: `DESIGN.md`, `schema.dml` (Dbdiagram DBML), and `AI_LOG.md`.
- Hero metadata uses PostgreSQL-backed server-side caching with TTL metadata in `hero_cache_states`.
- Long-running hero refresh jobs use a PostgreSQL-backed queue in `background_jobs`, processed by the API worker without Redis or other queue infrastructure.
- Authentication is enabled with bearer tokens. Protected API routes require `Authorization: Bearer <accessToken>`.
- Seeded local users:
  - `demo@draftplans.dev` / `demo12345`
  - `rival@draftplans.dev` / `rival12345`
- Draft plan records are user-scoped through `draft_plans.owner_id`, so users can only access their own plans.

## End-to-end testing
- The E2E suite uses Playwright from `apps/web/e2e`.
- Start the full stack first with `docker compose up --build`.
- Install the browser once with `npm run test:e2e:install`.
- Run the suite with `npm run test:e2e`.
- Override the frontend target with `PLAYWRIGHT_BASE_URL` if needed.

## Backend end-to-end testing
- The backend E2E suite lives in `apps/api/test/e2e`.
- Start PostgreSQL first, for example with `docker compose up postgres`.
- Set `TEST_DATABASE_URL` if you do not want to use the default `e2e` schema.
- Run `npm run test:e2e:api`.
- The suite applies Prisma migrations to the test schema, resets tables between tests, and seeds deterministic fixtures.

## Database maintenance
- Run `npm run db:status` to verify the current database has all Prisma migrations applied.
- Run `npm run db:setup` to apply all migrations and reseed the local development database.
- Run `npm run db:setup:e2e` to apply migrations and seed the dedicated `e2e` schema.
- Run `npm run db:repair` to sync both `public` and `e2e` in one step.
- If your Docker PostgreSQL volume still contains an outdated schema, recreate it once with `docker compose down -v` followed by `docker compose up --build`.
- The application reads from the `public` schema. The `e2e` schema is reserved for backend end-to-end tests and can be reset by the test suite at any time.
- If you inspect data with DBeaver, connect to `localhost:5433`, database `draft_plans`, schema `public` for app data and `e2e` for backend test data.

## Hero cache and background jobs
- `GET /heroes` serves cached hero records from PostgreSQL and enqueues a background refresh only when the cache is stale.
- `GET /heroes/cache` exposes cache freshness, last sync time, and the active job id.
- `POST /heroes/sync` performs an immediate sync.
- `POST /heroes/sync-jobs` enqueues an asynchronous hero sync job.
- `GET /heroes/sync-jobs/:jobId` returns job progress and completion state stored in PostgreSQL.

## Authentication
- `POST /auth/login` returns an access token and the authenticated user profile.
- Health check (`GET /health`) and login (`POST /auth/login`) are public endpoints.
- All other API routes require a bearer token.
