# AI_LOG

## Tool used
- Codex desktop coding agent (GPT-5 based)

## Notes
- AI assistance was used selectively during implementation.
- The prompt records below are representative, not exhaustive.
- They focus on scaffolding, debugging, testing, and implementation support.

## Representative prompt records

### 1. Backend scaffolding
- Prompt
  - `Build a dedicated backend API with NestJS, Prisma, PostgreSQL, and Docker Compose.`
- Use
  - Initial backend scaffolding and project structure.
- Outcome
  - Set up the API foundation, database integration, and containerized local development workflow.

### 2. Monorepo and frontend scaffolding
- Prompt
  - `Refactor the project into a monorepo and add the frontend and shared workspace structure.`
- Use
  - Repository organization and frontend setup.
- Outcome
  - Created the `apps/api`, `apps/web`, and `packages/shared` structure and connected the frontend to the backend contracts.

### 3. UI implementation and refinement
- Prompt
  - `Refine the frontend layout so it matches the provided mockups and improve the reliability of the page behavior.`
- Use
  - Frontend styling, layout refinement, and behavior fixes.
- Outcome
  - Updated the draft plans interface, hero browser modal, and related UI flows.

### 4. Bug fixing and environment debugging
- Prompt
  - `Fix the database, Docker, Prisma, and environment mismatches so the API, PostgreSQL, and local tools all point to the same instance.`
- Use
  - Debugging local development issues and runtime inconsistencies.
- Outcome
  - Standardized environment handling, database setup scripts, Docker port mapping, and local database access.

### 5. Testing support
- Prompt
  - `Add end-to-end tests for the frontend and backend and stabilize the selectors and test setup.`
- Use
  - Test implementation and reliability improvements.
- Outcome
  - Added Playwright coverage for frontend flows and backend E2E coverage for the API.

### 6. Backend feature support
- Prompt
  - `Add PostgreSQL-backed caching, background job handling, and soft delete behavior to the backend.`
- Use
  - Implementation support for non-trivial backend behavior.
- Outcome
  - Added PostgreSQL-only cache metadata, PostgreSQL-backed long-running job processing, and soft delete for draft plans and entries.

## Summary
- AI was used as an implementation assistant for scaffolding, debugging, testing, and selected backend/frontend refinements.
- Final code structure, configuration, and validation were reviewed and adjusted within the repository during development.
