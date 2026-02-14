---
name: tdd
description: Test-driven development workflow for a module feature
argument-hint: <module-name> <feature-description>
user-invocable: true
allowed-tools: Write, Edit, Read, Glob, Grep, Bash
---

Implement a feature using Test-Driven Development (RED-GREEN-REFACTOR).

**Module:** $ARGUMENTS

## TDD Workflow

### Phase 1: RED — Write Failing Tests

1. Create test file at `packages/server/src/modules/<module>/__tests__/<feature>.test.ts`
2. Write test cases that describe the expected behavior:
   - Happy path
   - Edge cases
   - Error cases (domain errors)
3. Run `bun test <test-file>` — confirm tests FAIL (this is expected)

### Phase 2: GREEN — Implement Minimum Code

1. Write the minimum code to make all tests pass
2. Follow project conventions:
   - Domain entities: pure TypeScript, no Effect
   - Use cases: `Effect.gen(function* () { ... })`
   - Ports: `Context.Tag` interfaces
   - Adapters: `Layer.effect` implementations
3. Run `bun test <test-file>` — confirm all tests PASS

### Phase 3: REFACTOR — Clean Up

1. Remove duplication
2. Improve naming
3. Ensure Clean Architecture compliance
4. Run `bun test <test-file>` — confirm tests still PASS
5. Run `bun tsc --noEmit` — confirm no type errors

## Testing Conventions

- Use `bun:test` (`describe`, `it`, `expect`)
- Test domain logic as pure functions (no Effect needed)
- Test use cases with mock Layers: `Layer.succeed(MyPort, { ... })`
- Describe behavior, not implementation: "creates a character with valid stats"
- See `.claude/rules/testing.md` for full conventions

## Output

After completing all phases, report:
- Tests written (count)
- Tests passing (count)
- Files created/modified (list)
