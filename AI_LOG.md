# AI_LOG

## AI tool(s) used
- Codex desktop coding agent (GPT-5 based)

## Usage scope
- AI was used as a supporting tool for scaffolding suggestions, debugging assistance, and test guidance.
- Final implementation decisions, code integration, and validation were done manually in the repository.

## First prompt
- `Review the take-home PDF and summarize required features, deliverables, and a practical boilerplate + tech stack plan.`

## Prompt records
1. Prompt
   - `Set up a dedicated backend API with NestJS, Prisma, PostgreSQL, and Docker Compose (no Supabase).`
   - Use
   - Initial project scaffolding and local containerized environment setup.
2. Prompt
   - `Refactor the project into a monorepo with frontend, backend, and shared contracts using clean naming conventions.`
   - Use
   - Repository structure alignment and codebase organization.
3. Prompt
   - `Help diagnose environment and dependency issues between API, Prisma, Docker, and local development.`
   - Use
   - Runtime debugging and setup consistency fixes.
4. Prompt
   - `Add and stabilize end-to-end tests using best-practice selectors and test structure.`
   - Use
   - Test planning and implementation support for frontend and backend E2E.
5. Prompt
   - `Design PostgreSQL-only caching and a PostgreSQL-backed long-running task flow without Redis or external queue services.`
   - Use
   - Architecture guidance and feature implementation support.
6. Prompt
   - `Add authentication and enforce user-level ownership so users can access only their own records.`
   - Use
   - Security and access-control implementation checklist.

## Iterations to accepted result
- 6 major implementation iterations (scaffolding, monorepo setup, environment fixes, testing, caching/jobs, authentication/ownership), followed by small refinements.

## Final accepted output
- Monorepo fullstack solution with:
  - React + Vite frontend (`apps/web`)
  - NestJS + Prisma backend (`apps/api`)
  - PostgreSQL persistence + migrations + seed + Docker Compose
  - Draft plan CRUD flows (ban list and preferred picks)
  - OpenDota hero integration
  - PostgreSQL-only hero cache and background sync jobs
  - Authentication and per-user record ownership
  - Frontend and backend E2E test suites

## What AI prompts were used for
- Scaffolding support
- Debugging support
- Test planning and stabilization
- Targeted feature support (caching, background jobs, authentication, ownership)

## Custom AI instructions / agent files
- No repository-local `agents.md` or `skills.md` file was used as a persistent instruction source during implementation.
- Session-level runtime instructions were used in the coding assistant environment.
