import { Context, Effect } from "effect"
import type { Character } from "../../domain/entities/character.js"
import type { CharacterStats } from "../../domain/value-objects/stats.js"
import type { PlayerId, AccountId } from "../../../../shared/kernel/types.js"

export class CharacterRepository extends Context.Tag("CharacterRepository")<
  CharacterRepository,
  {
    readonly findById: (id: PlayerId) => Effect.Effect<Character | null>
    readonly findByName: (name: string) => Effect.Effect<Character | null>
    readonly findByAccountId: (
      accountId: AccountId,
    ) => Effect.Effect<Character | null>
    readonly save: (character: Character) => Effect.Effect<void>
    readonly update: (character: Character) => Effect.Effect<void>
    readonly saveStats: (
      characterId: PlayerId,
      stats: CharacterStats,
    ) => Effect.Effect<void>
  }
>() {}
