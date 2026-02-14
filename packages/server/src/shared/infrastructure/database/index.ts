import { Context, Effect, Layer } from "effect"
import { Kysely, PostgresDialect } from "kysely"
import pg from "pg"

import type { Database } from "./types.js"

export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  { readonly kysely: Kysely<Database> }
>() {}

export const DatabaseServiceLive = Layer.effect(
  DatabaseService,
  Effect.gen(function* () {
    const dialect = new PostgresDialect({
      pool: new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        min: Number(process.env.DATABASE_POOL_MIN ?? 2),
        max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      }),
    })

    const kysely = new Kysely<Database>({ dialect })

    return { kysely }
  }),
)
