import { Effect, Layer } from "effect"
import { AccountRepository } from "../../ports/outbound/account.repository"
import { DatabaseService } from "../../../../shared/infrastructure/database/index"
import { Account } from "../../domain/entities/account"
import type { AccountId } from "../../../../shared/kernel/types"

export const PgAccountRepositoryLive = Layer.effect(
  AccountRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService

    const toAccount = (row: {
      id: string
      email: string
      username: string
      status: "active" | "banned" | "suspended"
      created_at: Date
    }): Account =>
      Account.create({
        id: row.id as AccountId,
        email: row.email,
        username: row.username,
        status: row.status,
        createdAt: row.created_at,
      })

    return {
      findById: (id: AccountId) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.accounts")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst(),
        ).pipe(Effect.map((row) => (row ? toAccount(row) : null)), Effect.orDie),

      findByEmail: (email: string) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.accounts")
            .selectAll()
            .where("email", "=", email)
            .executeTakeFirst(),
        ).pipe(Effect.map((row) => (row ? toAccount(row) : null)), Effect.orDie),

      findByUsername: (username: string) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.accounts")
            .selectAll()
            .where("username", "=", username)
            .executeTakeFirst(),
        ).pipe(Effect.map((row) => (row ? toAccount(row) : null)), Effect.orDie),
    }
  }),
)
