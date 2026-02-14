---
paths:
  - "packages/server/**/*.ts"
  - "packages/shared/**/*.ts"
---

# Effect-TS Conventions

## Services
- Define services with `Context.Tag`: `class MyService extends Context.Tag("MyService")<MyService, { ... }>() {}`
- Implement with `Layer.effect(MyService, Effect.gen(function* () { ... }))`
- Compose modules with `Layer.mergeAll()` and `Layer.provide()`

## Use Cases
- Always use `Effect.gen(function* () { ... })`
- Yield dependencies: `const db = yield* DatabaseService`
- Return typed errors: `Effect.Effect<Result, MyError, MyDependency>`
- Use `Effect.tryPromise` for external calls (Kysely, Redis)

## Error Handling
- Define domain errors as tagged classes: `class NotFoundError extends Data.TaggedError("NotFoundError")<{ id: string }>()`
- Use `Effect.catchTag` for specific error recovery
- Let unrecoverable errors propagate to the gateway layer

## Testing
- Test use cases by providing mock Layers
- Test domain logic as pure functions (no Effect needed)
