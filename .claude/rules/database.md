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
