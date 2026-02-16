import { Context, Effect } from "effect"
import type { Account } from "../../domain/entities/account"
import type { AccountId } from "../../../../shared/kernel/types"

export class AccountRepository extends Context.Tag("AccountRepository")<
  AccountRepository,
  {
    readonly findById: (id: AccountId) => Effect.Effect<Account | null>
    readonly findByEmail: (email: string) => Effect.Effect<Account | null>
    readonly findByUsername: (
      username: string,
    ) => Effect.Effect<Account | null>
  }
>() {}
