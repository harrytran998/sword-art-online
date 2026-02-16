# Sword Art Online — Project Context

## Architecture
- Modular Clean Architecture: domain → ports → application → adapters
- 10 bounded-context modules: identity, player, combat, monster, inventory, economy, social, world, quest, analytics
- Modules NEVER import from each other — EventBus only
- See @docs/02-ARCHITECTURE.md for full details

## Tech Stack
- Runtime: Bun | Backend: Effect-TS | DB: PostgreSQL 18 + Kysely + go-migrate
- Frontend: React + PixiJS + Zustand | Monorepo: moonrepo
- Linting: oxlint | Formatting: oxfmt

## Commands
- `moon run :dev` — start all packages
- `moon run server:dev` — start server only
- `moon run client:dev` — start client only
- `moon run :test` — run all tests
- `moon run :lint` — lint all packages
- `moon run :format` — format all packages

## Conventions
- Use `Effect.gen` for all use cases, never raw Promise chains
- Use `Context.Tag` for dependency injection
- Use `Layer.effect` for adapter implementations
- Use branded types from `shared/kernel/types.ts` (PlayerId, ZoneId, etc.)
- Migrations: plain SQL in `migrations/` via go-migrate
- Tests: colocated `__tests__/` folders within each module
- Use Type[] syntax instead of Array<Type> for consistency

## Important
- Server-authoritative: NEVER trust client input
- All domain entities are pure TypeScript — no framework dependencies
- Each module's `index.ts` exports ONLY: Layer, published events, port interfaces
