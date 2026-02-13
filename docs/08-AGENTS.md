# Sword Art Online: Aincrad Online
## Claude Code Agents & Automation Guide

**Version:** 1.0.0
**Date:** February 2026
**Status:** Ready for Team Adoption

---

## Table of Contents

1. [Overview](#1-overview)
2. [Directory Structure](#2-directory-structure)
3. [CLAUDE.md — Project Memory](#3-claudemd--project-memory)
4. [Modular Rules](#4-modular-rules)
5. [Settings & Permissions](#5-settings--permissions)
6. [Hooks — Workflow Automation](#6-hooks--workflow-automation)
7. [Custom Skills (Slash Commands)](#7-custom-skills-slash-commands)
8. [Custom Subagents](#8-custom-subagents)
9. [MCP Servers — External Integrations](#9-mcp-servers--external-integrations)
10. [Team Workflow Recipes](#10-team-workflow-recipes)

---

## 1. Overview

Claude Code is the primary AI-assisted development tool for Aincrad Online. This document defines how every team configures their `.claude/` folders so that Claude understands our architecture, follows our conventions, and automates repetitive work.

**Why this matters:**
- Claude loads `.claude/` configuration at session start — bad config = bad output
- Hooks prevent mistakes before they hit CI
- Custom skills eliminate copy-paste prompts across the team
- Subagents parallelize research, reviews, and testing
- Consistent setup means every developer gets the same Claude experience

---

## 2. Directory Structure

```
project-root/
├── .claude/
│   ├── settings.json              # Shared team settings (checked into git)
│   ├── settings.local.json        # Personal overrides (gitignored)
│   ├── rules/                     # Modular context rules
│   │   ├── architecture.md        # Clean Architecture + module conventions
│   │   ├── effect-ts.md           # Effect-TS patterns (Layer, Effect.gen, etc.)
│   │   ├── database.md            # Kysely + go-migrate conventions
│   │   ├── testing.md             # Test conventions and structure
│   │   ├── security.md            # Anti-cheat, validation, trust boundaries
│   │   └── frontend.md            # React + PixiJS + client Clean Architecture
│   ├── skills/                    # Custom slash commands
│   │   ├── create-module/         # /create-module — scaffold a new module
│   │   ├── create-migration/      # /create-migration — create go-migrate files
│   │   ├── review-module/         # /review-module — audit module boundaries
│   │   ├── review-pr/             # /review-pr — full PR code review
│   │   └── test-module/           # /test-module — run tests for one module
│   ├── agents/                    # Custom subagents
│   │   ├── module-reviewer.md     # Reviews module boundary compliance
│   │   ├── security-auditor.md    # Scans for OWASP/anti-cheat issues
│   │   ├── effect-ts-helper.md    # Helps write Effect-TS code
│   │   └── db-migration-writer.md # Writes Kysely types + migration SQL
│   ├── hooks/                     # Hook scripts
│   │   ├── validate-imports.sh    # Block cross-module imports
│   │   ├── format-on-save.sh      # Run oxfmt after file edits
│   │   └── protect-files.sh       # Block edits to protected files
│   └── agent-memory/              # Persistent agent memory (checked in)
│       └── <agent-name>/
├── .mcp.json                      # MCP server configuration
├── CLAUDE.md                      # Root project memory
└── packages/
    ├── server/CLAUDE.md           # Server-specific context
    ├── client/CLAUDE.md           # Client-specific context
    └── shared/CLAUDE.md           # Shared package context
```

---

## 3. CLAUDE.md — Project Memory

CLAUDE.md files are loaded automatically at session start and give Claude persistent context about the project.

### 3.1 File Hierarchy (Precedence: top to bottom)

| File | Scope | Checked In | When Loaded |
|------|-------|------------|-------------|
| `CLAUDE.md` (project root) | All team members | Yes | Always at session start |
| `.claude/CLAUDE.md` | Alternative root location | Yes | Always at session start |
| `packages/server/CLAUDE.md` | Server developers | Yes | When Claude reads files in `packages/server/` |
| `packages/client/CLAUDE.md` | Client developers | Yes | When Claude reads files in `packages/client/` |
| `CLAUDE.local.md` (root) | Personal preferences | No (gitignored) | Always at session start |
| `~/.claude/CLAUDE.md` | All your projects | No | Always |

### 3.2 Root CLAUDE.md

```markdown
# Aincrad Online — Project Context

## Architecture
- Modular Clean Architecture: domain → ports → application → adapters
- 10 bounded-context modules: identity, player, combat, monster, inventory, economy, social, world, quest, analytics
- Modules NEVER import from each other — EventBus only
- See @docs/02-ARCHITECTURE.md for full details

## Tech Stack
- Runtime: Bun | Backend: Effect-TS | DB: PostgreSQL 18 + Kysely + go-migrate
- Frontend: React + PixiJS + Zustand | Monorepo: moonrepo
- Linting: oxlint | Formatting: oxfmt

## Commands
- `moon run :dev` — start all packages
- `moon run server:dev` — start server only
- `moon run client:dev` — start client only
- `moon run :test` — run all tests
- `moon run :lint` — lint all packages
- `moon run :format` — format all packages

## Conventions
- Use `Effect.gen` for all use cases, never raw Promise chains
- Use `Context.Tag` for dependency injection
- Use `Layer.effect` for adapter implementations
- Use branded types from `shared/kernel/types.ts` (PlayerId, ZoneId, etc.)
- Migrations: plain SQL in `migrations/` via go-migrate
- Tests: colocated `__tests__/` folders within each module

## Important
- Server-authoritative: NEVER trust client input
- All domain entities are pure TypeScript — no framework dependencies
- Each module's `index.ts` exports ONLY: Layer, published events, port interfaces
```

### 3.3 Package-Level CLAUDE.md

**`packages/server/CLAUDE.md`:**
```markdown
# Server Package

- Entry point: `src/index.ts` (Layer composition + BunRuntime.runMain)
- Modules live in `src/modules/<name>/`
- Shared infra in `src/shared/infrastructure/`
- Gateway (WebSocket + HTTP + game loop) in `src/gateway/`
- Use `Effect.gen(function* () { ... })` for all use cases
- DB queries via Kysely fluent API (not raw SQL in application layer)
- See @docs/EXECUTION_PLAN.md for current sprint tasks
```

**`packages/client/CLAUDE.md`:**
```markdown
# Client Package

- Clean Architecture: domain → ports → application → adapters
- Domain: `src/domain/` — pure TS entities, value objects
- Ports: `src/ports/` — NetworkPort, RendererPort, AudioPort interfaces
- Application: `src/application/` — use cases + Zustand stores
- Adapters: `src/adapters/` — WebSocket, PixiJS, React components
- React components are adapters — they consume Zustand stores, never domain logic
- PixiJS rendering goes through RendererPort, never direct PIXI calls in use cases
```

### 3.4 Imports with `@` Syntax

CLAUDE.md files can reference other files. Claude loads them on demand:

```markdown
See @docs/02-ARCHITECTURE.md for module structure.
See @docs/03-DATABASE_DESIGN.md for schema details.
See @docs/04-API_NETWORK_PROTOCOL.md for WebSocket message format.
```

---

## 4. Modular Rules

Rules in `.claude/rules/` are loaded contextually based on which files Claude is working with. Use YAML frontmatter `paths:` to scope rules to specific file patterns.

### 4.1 Architecture Rules

**`.claude/rules/architecture.md`:**
```markdown
---
paths:
  - "packages/server/src/modules/**/*.ts"
  - "packages/server/src/shared/**/*.ts"
  - "packages/server/src/gateway/**/*.ts"
---

# Module Architecture Rules

## Strict Boundaries
- Modules NEVER import from `../other-module/`. Only from `../../shared/kernel/`.
- All inter-module communication goes through EventBus.
- A module's `index.ts` exports ONLY: its Effect Layer, published events, port interfaces.

## Clean Architecture Layers (inner to outer)
1. `domain/` — Entities, value objects, domain errors. Pure TS, zero dependencies.
2. `ports/` — Interfaces only. Inbound = use cases, Outbound = repositories.
3. `application/` — Use case implementations using `Effect.gen`. Depend on ports.
4. `adapters/` — Concrete implementations (Kysely, Redis, WebSocket handlers).

## Dependency Rule
- Domain depends on nothing
- Ports depend on domain
- Application depends on ports + domain
- Adapters depend on application + ports + domain
- NEVER the reverse
```

### 4.2 Effect-TS Rules

**`.claude/rules/effect-ts.md`:**
```markdown
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
```

### 4.3 Database Rules

**`.claude/rules/database.md`:**
```markdown
---
paths:
  - "packages/server/src/modules/*/adapters/outbound/**/*.ts"
  - "migrations/**/*.sql"
---

# Database Conventions

## Kysely
- Use fluent API: `.selectFrom()`, `.insertInto()`, `.updateTable()`, `.deleteFrom()`
- Always wrap in `Effect.tryPromise()`
- Type database interface in `packages/server/src/shared/infrastructure/database/types.ts`
- NEVER write raw SQL in adapter files — use Kysely's query builder

## Migrations (go-migrate)
- File naming: `{version}_{description}.up.sql` / `{version}_{description}.down.sql`
- Version is sequential integer: `000001`, `000002`, etc.
- Every `.up.sql` MUST have a matching `.down.sql`
- Use PostgreSQL 18 features: `gen_random_uuid()` for UUIDv4, `uuidv7()` for UUIDv7
- Always include `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ DEFAULT now()`
```

### 4.4 Security Rules

**`.claude/rules/security.md`:**
```markdown
---
paths:
  - "packages/server/src/**/*.ts"
  - "packages/client/src/**/*.ts"
---

# Security Rules — MANDATORY

## Server-Authoritative Design
- NEVER trust client input. Validate everything server-side.
- Movement: server validates position, speed, collision. Client is display-only.
- Combat: server calculates damage, range, cooldowns. Client sends intent only.
- Economy: server processes all Col transfers. Client cannot modify balances.

## Input Validation
- Validate all WebSocket message schemas at the gateway layer
- Rate limit per connection (configurable per message type)
- Reject messages that exceed maximum payload size

## Authentication
- JWT with short expiration (15 minutes access, 7 days refresh)
- Validate JWT on every WebSocket message (cached validation)
- Session binding: JWT is tied to WebSocket connection ID

## Anti-Cheat
- Speed hack detection: reject movement exceeding max velocity
- Teleport detection: reject position changes exceeding threshold
- Duplicate action detection: reject actions faster than cooldown
```

---

## 5. Settings & Permissions

### 5.1 Shared Team Settings

**`.claude/settings.json`** (checked into git):
```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(moon run *)",
      "Bash(bun test *)",
      "Bash(bun tsc --noEmit *)",
      "Bash(oxlint *)",
      "Bash(oxfmt *)",
      "Bash(go-migrate *)",
      "Bash(docker compose *)",
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(gh pr *)",
      "Bash(gh issue *)"
    ],
    "ask": [
      "Edit",
      "Write",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git checkout *)",
      "Bash(docker *)"
    ],
    "deny": [
      "Bash(sudo *)",
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)",
      "Read(.env)",
      "Read(.env.*)",
      "Read(**/secrets/**)"
    ]
  },
  "hooks": {}
}
```

### 5.2 Personal Overrides

**`.claude/settings.local.json`** (gitignored, per-developer):
```json
{
  "permissions": {
    "allow": [
      "Edit",
      "Write",
      "Bash(git add *)",
      "Bash(git commit *)"
    ]
  }
}
```

### 5.3 Settings Precedence

1. **Deny rules** — always evaluated first, cannot be overridden
2. **Local project** (`.claude/settings.local.json`) — personal overrides
3. **Project** (`.claude/settings.json`) — team defaults
4. **User** (`~/.claude/settings.json`) — global personal defaults

---

## 6. Hooks — Workflow Automation

Hooks are shell commands that run at specific lifecycle events. They can block actions, inject context, or automate tasks.

### 6.1 Hook Events Reference

| Event | When | Can Block? | Use Case |
|-------|------|------------|----------|
| `PreToolUse` | Before a tool executes | Yes (exit 2) | Validate edits, block dangerous commands |
| `PostToolUse` | After a tool succeeds | No | Auto-format, run linter |
| `Notification` | Claude needs attention | No | Desktop notification |
| `Stop` | Claude finishes responding | No | Run tests after code changes |
| `SessionStart` | Session begins | No | Inject reminders |

### 6.2 Validate Module Imports

Prevents Claude from creating cross-module imports — the single most important architectural guard.

**`.claude/hooks/validate-imports.sh`:**
```bash
#!/bin/bash
# Block cross-module imports in server code
# Runs on: PreToolUse (Edit, Write)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // empty')

# Only check server module files
if [[ "$FILE_PATH" != *"packages/server/src/modules/"* ]]; then
  exit 0
fi

# Extract current module name
CURRENT_MODULE=$(echo "$FILE_PATH" | sed -n 's|.*modules/\([^/]*\)/.*|\1|p')

# Check for imports from other modules
if echo "$NEW_CONTENT" | grep -qE "from ['\"].*modules/(?!${CURRENT_MODULE}/)" 2>/dev/null; then
  echo "BLOCKED: Cross-module import detected in $FILE_PATH." >&2
  echo "Modules communicate ONLY through EventBus. Import from 'shared/kernel/' for shared types." >&2
  exit 2
fi

exit 0
```

### 6.3 Auto-Format on Save

**`.claude/hooks/format-on-save.sh`:**
```bash
#!/bin/bash
# Run oxfmt after Claude edits/writes a file
# Runs on: PostToolUse (Edit, Write)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only format TypeScript files
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
  oxfmt "$FILE_PATH" 2>/dev/null
fi

exit 0
```

### 6.4 Protect Critical Files

**`.claude/hooks/protect-files.sh`:**
```bash
#!/bin/bash
# Prevent edits to files that should only change through specific processes
# Runs on: PreToolUse (Edit, Write)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

PROTECTED=(
  ".env"
  ".env.local"
  "package-lock.json"
  "bun.lockb"
  ".moon/toolchain.yml"
)

for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: $FILE_PATH is a protected file. Modify it manually." >&2
    exit 2
  fi
done

exit 0
```

### 6.5 Hook Configuration in Settings

Add hooks to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/validate-imports.sh"
          },
          {
            "type": "command",
            "command": ".claude/hooks/protect-files.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/format-on-save.sh"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude needs your attention\" with title \"Aincrad Online\"'"
          }
        ]
      }
    ]
  }
}
```

---

## 7. Custom Skills (Slash Commands)

Skills are custom commands invoked with `/skill-name`. Each skill is a `SKILL.md` file inside `.claude/skills/<name>/`.

### 7.1 `/create-module` — Scaffold a New Module

**`.claude/skills/create-module/SKILL.md`:**
```yaml
---
name: create-module
description: Scaffold a new bounded-context module with Clean Architecture structure
argument-hint: <module-name>
user-invocable: true
allowed-tools: Write, Bash, Read, Glob
---
```
```markdown
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
```

### 7.2 `/create-migration` — Create Database Migration

**`.claude/skills/create-migration/SKILL.md`:**
```yaml
---
name: create-migration
description: Create a new go-migrate SQL migration pair
argument-hint: <description>
user-invocable: true
allowed-tools: Write, Read, Glob, Bash
---
```
```markdown
Create a new go-migrate migration pair for: $ARGUMENTS

1. Find the latest migration version number in `migrations/`
2. Increment the version: if latest is `000005`, next is `000006`
3. Create `migrations/{version}_{description}.up.sql`
4. Create `migrations/{version}_{description}.down.sql`

Rules:
- Use PostgreSQL 18 syntax
- Use `uuidv7()` for primary keys (not `gen_random_uuid()`)
- Include `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ DEFAULT now()`
- The `.down.sql` must fully reverse the `.up.sql`
- Follow the schema conventions in @docs/03-DATABASE_DESIGN.md
```

### 7.3 `/review-module` — Audit Module Boundaries

**`.claude/skills/review-module/SKILL.md`:**
```yaml
---
name: review-module
description: Audit a module for Clean Architecture and boundary compliance
argument-hint: <module-name>
user-invocable: true
allowed-tools: Read, Glob, Grep
context: fork
agent: Explore
---
```
```markdown
Audit the module at `packages/server/src/modules/$ARGUMENTS[0]/` for compliance with
our architecture rules (see @docs/02-ARCHITECTURE.md Section 4):

## Check List

1. **No cross-module imports** — scan all .ts files for imports from `../other-module/`
2. **Domain purity** — domain/ files must not import Effect, Kysely, Redis, or any framework
3. **Port interfaces only** — ports/ files must contain only interfaces/types, no implementations
4. **Adapter dependencies** — adapters/ can import from ports/ and domain/, never reverse
5. **index.ts exports** — module's index.ts only exports Layer, events, and port interfaces
6. **EventBus usage** — inter-module communication uses EventBus, not direct function calls
7. **Branded types** — uses PlayerId, ZoneId etc. from shared/kernel/, not raw strings

Report each violation with file path and line number. End with a compliance score.
```

### 7.4 `/review-pr` — Full PR Code Review

**`.claude/skills/review-pr/SKILL.md`:**
```yaml
---
name: review-pr
description: Perform a comprehensive code review on a pull request
argument-hint: [pr-number]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
```
```markdown
Review pull request $ARGUMENTS for the Aincrad Online project.

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
```

### 7.5 `/test-module` — Run Module Tests

**`.claude/skills/test-module/SKILL.md`:**
```yaml
---
name: test-module
description: Run tests for a specific module and report results
argument-hint: <module-name>
user-invocable: true
allowed-tools: Bash, Read, Glob
---
```
```markdown
Run tests for the `$ARGUMENTS[0]` module:

1. Find test files: `packages/server/src/modules/$0/**/__tests__/**/*.test.ts`
2. Run: `moon run server:test -- --filter $0`
3. If tests fail, read the failing test files and the source they test
4. Report: total tests, passed, failed, with failure details
```

---

## 8. Custom Subagents

Subagents are specialized AI agents that Claude can delegate to. They run in isolated contexts with their own tool access and instructions.

### 8.1 Module Reviewer Agent

**`.claude/agents/module-reviewer.md`:**
```yaml
---
name: module-reviewer
description: Reviews module code for Clean Architecture compliance and boundary violations
tools: Read, Glob, Grep
model: sonnet
maxTurns: 30
---
```
```markdown
You are a code architecture reviewer for the Aincrad Online project.

Your job is to verify that modules in `packages/server/src/modules/` follow these rules:

1. **Module Boundary Rule**: No module imports from another module. Only `shared/kernel/` types.
2. **Domain Purity**: `domain/` has zero external dependencies (no Effect, no Kysely, no Redis).
3. **Port Abstraction**: `ports/` contains only interfaces using `Context.Tag`, never implementations.
4. **Dependency Direction**: adapters → application → ports → domain (never reverse).
5. **Public API**: `index.ts` exports only the module Layer, published events, and port interfaces.
6. **EventBus Communication**: All cross-module interaction uses EventBus publish/subscribe.

When invoked, scan the specified module (or all modules) and report violations with exact file paths and line numbers. Provide a compliance score out of 100.
```

### 8.2 Security Auditor Agent

**`.claude/agents/security-auditor.md`:**
```yaml
---
name: security-auditor
description: Scans code for security vulnerabilities, anti-cheat bypasses, and OWASP issues
tools: Read, Glob, Grep
model: sonnet
maxTurns: 40
---
```
```markdown
You are a security auditor for the Aincrad Online MMORPG.

Focus areas:
- **Server-authoritative violations**: Any code that trusts client input for game state
- **Anti-cheat gaps**: Missing movement validation, combat range checks, cooldown enforcement
- **OWASP Top 10**: SQL injection (raw queries), XSS, insecure auth, broken access control
- **WebSocket security**: Missing rate limiting, origin validation, message size limits
- **Economy exploits**: Col duplication, trade race conditions, auction manipulation
- **Secret exposure**: Hardcoded keys, credentials in source, .env files in git

Report each finding with: severity (critical/high/medium/low), file path, line number, description, and recommended fix.
```

### 8.3 Effect-TS Helper Agent

**`.claude/agents/effect-ts-helper.md`:**
```yaml
---
name: effect-ts-helper
description: Helps write and debug Effect-TS code with correct patterns for this project
tools: Read, Glob, Grep
model: sonnet
maxTurns: 20
skills:
  - create-module
---
```
```markdown
You are an Effect-TS expert for the Aincrad Online project.

You help developers:
- Write use cases with `Effect.gen(function* () { ... })`
- Define services with `Context.Tag`
- Implement adapters with `Layer.effect`
- Compose module Layers with `Layer.mergeAll` and `Layer.provide`
- Handle errors with tagged errors (`Data.TaggedError`) and `Effect.catchTag`
- Write tests with mock Layers

Always follow the patterns in this project:
- Domain entities are pure TypeScript classes (no Effect dependency)
- Ports use `Context.Tag` for DI
- Application use cases return `Effect.Effect<Result, DomainError, Dependencies>`
- Adapters wrap external calls in `Effect.tryPromise`

Reference existing modules in `packages/server/src/modules/` for examples.
```

### 8.4 DB Migration Writer Agent

**`.claude/agents/db-migration-writer.md`:**
```yaml
---
name: db-migration-writer
description: Creates go-migrate SQL migrations and matching Kysely type definitions
tools: Read, Glob, Grep
model: sonnet
maxTurns: 20
---
```
```markdown
You are a database migration specialist for Aincrad Online.

When asked to create a migration:
1. Read `migrations/` to find the latest version number
2. Generate `.up.sql` and `.down.sql` following go-migrate conventions
3. Update the Kysely `Database` interface in `packages/server/src/shared/infrastructure/database/types.ts`

PostgreSQL 18 conventions:
- Primary keys: `id UUID DEFAULT uuidv7() PRIMARY KEY`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`
- Use `uuid_extract_timestamp(id)` instead of separate `created_at` where appropriate
- Use GIN indexes for full-text search columns
- Reference @docs/03-DATABASE_DESIGN.md for schema patterns
```

---

## 9. MCP Servers — External Integrations

MCP (Model Context Protocol) servers extend Claude with access to external tools and data sources.

### 9.1 Project MCP Configuration

**`.mcp.json`** (checked into git):
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "${DATABASE_URL}"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/aincrad}"
      }
    }
  }
}
```

### 9.2 Recommended MCP Servers

| Server | Purpose | Install Command |
|--------|---------|-----------------|
| **PostgreSQL** | Query game database directly | `claude mcp add --transport stdio postgres -- npx -y @bytebase/dbhub --dsn "$DATABASE_URL"` |
| **GitHub** | PR reviews, issue management | `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` |
| **Sentry** | Error monitoring, crash analysis | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` |

### 9.3 Adding MCP Servers

```bash
# Add HTTP-based server
claude mcp add --transport http <name> <url>

# Add local stdio server
claude mcp add --transport stdio <name> -- <command> <args>

# List all configured servers
claude mcp list

# Authenticate (for OAuth-based servers)
# Run inside Claude Code:
/mcp
```

---

## 10. Team Workflow Recipes

### 10.1 New Module Development

```
# 1. Scaffold the module
/create-module <name>

# 2. Create the database migration
/create-migration create_<name>_tables

# 3. Implement domain entities and use cases
# (Claude follows architecture rules from .claude/rules/)

# 4. Review compliance
/review-module <name>
```

### 10.2 Pull Request Review

```
# Full automated code review
/review-pr 42

# Or review current changes
/review-pr
```

### 10.3 Sprint Kickoff

Each sprint, team leads should:

1. Update `CLAUDE.md` with current sprint goals:
   ```markdown
   ## Current Sprint
   - Sprint 5: Combat system (modules/combat/)
   - Focus: Sword Skills, damage calculation, hit detection
   - See @docs/EXECUTION_PLAN.md Sprint 5
   ```

2. Update `.claude/rules/` if new conventions are established
3. Run `/review-module` on modules touched in the previous sprint

### 10.4 Onboarding a New Developer

New team members should:

1. Read this document (`docs/08-AGENTS.md`)
2. Read `docs/02-ARCHITECTURE.md` for system architecture
3. Run `claude` in the project root — CLAUDE.md loads automatically
4. Try `/review-module identity` to see how compliance checking works
5. Create a personal `CLAUDE.local.md` with their preferences:
   ```markdown
   ## Personal Preferences
   - I prefer verbose error messages in code reviews
   - I work primarily on the combat module
   - Always suggest tests for new code
   ```

### 10.5 Module-to-Team Mapping

| Module | Domain | Key Skills |
|--------|--------|------------|
| `identity` | Auth, accounts, sessions | `/create-migration`, security-auditor |
| `player` | Characters, stats, progression | effect-ts-helper |
| `combat` | Sword Skills, damage, PvE/PvP | security-auditor, effect-ts-helper |
| `monster` | Spawning, AI, loot tables | effect-ts-helper |
| `inventory` | Items, equipment, enhancement | db-migration-writer |
| `economy` | Col, trading, auction house | security-auditor, db-migration-writer |
| `social` | Party, guild, friends, chat | effect-ts-helper |
| `world` | Floors, zones, navigation | security-auditor |
| `quest` | Quests, NPC interactions | db-migration-writer |
| `analytics` | Events, metrics, leaderboards | db-migration-writer |
| `gateway` | WebSocket, game loop, HTTP | security-auditor |
| `client` | React + PixiJS frontend | `/review-pr` |

---

## Built-in Commands Quick Reference

| Command | Purpose |
|---------|---------|
| `/help` | Show all available commands |
| `/init` | Generate a starter CLAUDE.md for the project |
| `/memory` | View and edit CLAUDE.md memory files |
| `/config` | Open settings interface |
| `/hooks` | Manage hooks interactively |
| `/agents` | Create and manage custom subagents |
| `/compact` | Compact conversation to save context |
| `/cost` | Show token usage for current session |
| `/model` | Switch between Opus, Sonnet, Haiku |
| `/status` | Check version, model, account info |
| `/doctor` | Diagnose installation issues |
| `/mcp` | Manage MCP servers and authentication |
| `/review` | Review a pull request |
| `/plan` | Enter plan mode for complex tasks |
| `/tasks` | List background tasks |

---

**Document Version:** 1.0.0
**Status:** Ready for Team Adoption
