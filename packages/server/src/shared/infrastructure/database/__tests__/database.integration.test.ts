import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { Kysely, PostgresDialect } from "kysely"
import pg from "pg"
import type { Database } from "../types"

const CONNECTION_STRING =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sao"

let db: Kysely<Database>
let pool: pg.Pool

beforeAll(() => {
  pool = new pg.Pool({ connectionString: CONNECTION_STRING, max: 2 })
  db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })
})

afterAll(async () => {
  await db.destroy()
})

describe("Database integration", () => {
  const testEmail = `test-${Date.now()}@integration.test`
  const testUsername = `testuser-${Date.now()}`

  afterAll(async () => {
    await db
      .deleteFrom("sao.accounts")
      .where("email", "=", testEmail)
      .execute()
  })

  it("should insert and query an account", async () => {
    await db
      .insertInto("sao.accounts")
      .values({
        email: testEmail,
        username: testUsername,
        password_hash: "hashed-password",
        status: "active",
      })
      .execute()

    const account = await db
      .selectFrom("sao.accounts")
      .selectAll()
      .where("email", "=", testEmail)
      .executeTakeFirst()

    expect(account).toBeDefined()
    expect(account?.email).toBe(testEmail)
    expect(account?.username).toBe(testUsername)
    expect(account?.status).toBe("active")
    expect(account?.id).toBeDefined()
    expect(account?.created_at).toBeInstanceOf(Date)
    expect(account?.updated_at).toBeInstanceOf(Date)
  })
})
