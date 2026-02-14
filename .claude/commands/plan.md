---
description: Design an implementation plan before writing code
disable-model-invocation: true
---

Before writing any code for this task, enter plan mode and follow this process:

## Planning Workflow

1. **Restate the requirement** in your own words to confirm understanding
2. **Explore the codebase** — identify which modules, files, and patterns are relevant
   - Read `docs/02-ARCHITECTURE.md` for architectural constraints
   - Check existing modules in `packages/server/src/modules/` for patterns
   - Identify which bounded contexts are affected
3. **Assess scope** — how many files will change? Which modules are involved?
4. **Identify risks** — are there boundary violations, event ordering issues, or breaking changes?
5. **Write the plan** with:
   - Files to create/modify (with paths)
   - Key implementation decisions and trade-offs
   - Domain events that need to be published/subscribed
   - Database migrations needed (if any)
   - Testing strategy

## Rules

- Do NOT write implementation code during planning
- If multiple approaches exist, list pros/cons for each
- Flag any architectural rule violations (cross-module imports, domain impurity)
- Wait for user approval before proceeding to implementation
