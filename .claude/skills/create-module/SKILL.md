---
name: create-module
description: Scaffold a new bounded-context module with Clean Architecture structure
argument-hint: <module-name>
user-invocable: true
allowed-tools: Write, Bash, Read, Glob
---

Create a new module at `packages/server/src/modules/$ARGUMENTS[0]/` with the full
Clean Architecture structure:

1. `domain/entities/` — empty directory with index.ts
2. `domain/value-objects/` — empty directory with index.ts
3. `domain/errors.ts` — base error class using `Data.TaggedError`
4. `domain/index.ts` — re-export all domain types
5. `ports/inbound/` — empty port interface file
6. `ports/outbound/` — empty repository interface file
7. `ports/index.ts`
8. `application/` — empty use case file with Effect.gen template
9. `adapters/inbound/` — empty handler file
10. `adapters/outbound/` — empty repository implementation
11. `adapters/index.ts`
12. `events/published.ts` — empty DomainEvent definitions
13. `events/subscriptions.ts` — empty subscription handlers
14. `events/index.ts`
15. `module.ts` — Layer composition template
16. `index.ts` — public API (exports Layer, events, ports only)

Use the identity module as a reference for file structure.
Follow all conventions in @docs/02-ARCHITECTURE.md.
Use branded types from `shared/kernel/types.ts`.
