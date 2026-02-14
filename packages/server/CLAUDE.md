# Server Package

- Entry point: `src/index.ts` (Layer composition + BunRuntime.runMain)
- Modules live in `src/modules/<name>/`
- Shared infra in `src/shared/infrastructure/`
- Gateway (WebSocket + HTTP + game loop) in `src/gateway/`
- Use `Effect.gen(function* () { ... })` for all use cases
- DB queries via Kysely fluent API (not raw SQL in application layer)
- See @docs/EXECUTION_PLAN.md for current sprint tasks
