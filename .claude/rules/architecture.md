---
paths:
  - "packages/server/src/modules/**/*.ts"
  - "packages/server/src/shared/**/*.ts"
  - "packages/server/src/gateway/**/*.ts"
---

# Module Architecture Rules

## Strict Boundaries
- Modules NEVER import from `../other-module/`. Only from `../../shared/kernel/`.
- All inter-module communication goes through EventBus.
- A module's `index.ts` exports ONLY: its Effect Layer, published events, port interfaces.

## Clean Architecture Layers (inner to outer)
1. `domain/` — Entities, value objects, domain errors. Pure TS, zero dependencies.
2. `ports/` — Interfaces only. Inbound = use cases, Outbound = repositories.
3. `application/` — Use case implementations using `Effect.gen`. Depend on ports.
4. `adapters/` — Concrete implementations (Kysely, Redis, WebSocket handlers).

## Dependency Rule
- Domain depends on nothing
- Ports depend on domain
- Application depends on ports + domain
- Adapters depend on application + ports + domain
- NEVER the reverse
