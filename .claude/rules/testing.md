---
paths:
  - "packages/**/__tests__/**/*.ts"
  - "packages/**/*.test.ts"
  - "packages/**/*.spec.ts"
---

# Testing Conventions

## Structure
- Tests are colocated in `__tests__/` folders within each module
- File naming: `<use-case-name>.test.ts` or `<entity-name>.test.ts`
- Use `bun:test` as the test runner

## Domain Layer Tests
- Test domain entities and value objects as pure functions — no Effect needed
- Validate invariants, factory methods, equality checks

## Application Layer Tests
- Test use cases by providing mock Layers for outbound ports
- Use `Layer.succeed(MyPort, { ... })` to create test doubles
- Run with `Effect.runPromise(pipe(useCase, Effect.provide(TestLayer)))`

## Integration Tests
- Place in `__tests__/integration/`
- Use real database (docker-compose test containers)
- Clean up data after each test

## Naming
- Describe behavior, not implementation: "creates a character with valid stats"
- Group by use case or entity: `describe("LoginUseCase", () => { ... })`
