---
name: review-pr
description: Perform a comprehensive code review on a pull request
argument-hint: [pr-number]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

Review pull request $ARGUMENTS for the Sword Art Online project.

Get the PR diff: !`gh pr diff $0 2>/dev/null || echo "No PR number provided, reviewing staged changes" && git diff --staged`

## Review Criteria

1. **Architecture compliance** — follows Clean Architecture layers, no boundary violations
2. **Effect-TS patterns** — correct use of Effect.gen, Context.Tag, Layer, error types
3. **Security** — no client trust, server validates everything, no hardcoded secrets
4. **Database** — Kysely fluent API used correctly, migrations have matching up/down
5. **Type safety** — branded types used, no `any` or `as` casts without justification
6. **Tests** — use cases have tests, domain logic has tests
7. **Module boundaries** — no cross-module imports, EventBus for communication

Format: list issues by severity (blocker > warning > nit), with file paths and line numbers.
