---
description: Auto-fix TypeScript build errors in an iterative loop
allowed-tools: Bash, Read, Glob, Grep, Edit
---

Fix all TypeScript build errors iteratively.

## Process

Repeat this loop (max 5 iterations):

1. Run `bun tsc --noEmit 2>&1` and capture output
2. If clean (exit 0), report success and stop
3. Parse the errors — group by file
4. Fix each error:
   - Read the file to understand context
   - Apply the minimal fix (don't refactor unrelated code)
   - Prefer fixing type errors over adding `any` or `as` casts
5. Go back to step 1

## Rules

- Maximum 5 iterations — if errors persist after 5 rounds, report remaining errors and stop
- Do NOT refactor surrounding code — only fix the specific type error
- Do NOT add `// @ts-ignore` or `// @ts-expect-error` unless absolutely necessary
- If a fix requires changing a module's public API, flag it for review
- After completion, run `oxlint .` to ensure no lint regressions
