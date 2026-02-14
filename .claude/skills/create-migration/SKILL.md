---
name: create-migration
description: Create a new go-migrate SQL migration pair
argument-hint: <description>
user-invocable: true
allowed-tools: Write, Read, Glob, Bash
---

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
