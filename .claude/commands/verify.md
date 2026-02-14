---
description: Run full verification pipeline (types + lint + tests)
allowed-tools: Bash, Read, Glob
---

Run the full verification pipeline and report results.

## Pipeline

Execute each stage sequentially. Stop and report if any stage fails.

### Stage 1: TypeScript Type Check
```
bun tsc --noEmit
```

### Stage 2: Lint
```
oxlint .
```

### Stage 3: Tests
```
bun test
```

## Output Format

Report a summary table:

| Stage | Status | Details |
|-------|--------|---------|
| Types | PASS/FAIL | Error count or clean |
| Lint  | PASS/FAIL | Warning/error count |
| Tests | PASS/FAIL | X passed, Y failed |

If any stage fails, show the first 5 errors with file paths and line numbers.
