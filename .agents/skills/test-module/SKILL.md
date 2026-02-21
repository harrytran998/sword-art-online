---
name: test-module
description: Run tests for a specific module and report results
argument-hint: <module-name>
user-invocable: true
allowed-tools: Bash, Read, Glob
---

Run tests for the `$ARGUMENTS[0]` module:

1. Find test files: `packages/server/src/modules/$0/**/__tests__/**/*.test.ts`
2. Run: `moon run server:test -- --filter $0`
3. If tests fail, read the failing test files and the source they test
4. Report: total tests, passed, failed, with failure details
