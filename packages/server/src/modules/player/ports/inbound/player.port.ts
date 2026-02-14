import { Context, Effect } from "effect"
import type { Character } from "../../domain/entities/character.js"
import type { PlayerId, AccountId } from "../../../../shared/kernel/types.js"
import type {
  PlayerNotFoundError,
  CharacterNameTakenError,
  InvalidCharacterNameError,
  InvalidClassIdError,
  InvalidStatsError,
} from "../../domain/errors.js"

export interface CreateCharacterParams {
  readonly accountId: AccountId
  readonly name: string
  readonly classId: number
}

export interface StatAllocation {
  readonly str: number
  readonly agi: number
  readonly vit: number
  readonly dex: number
  readonly int: number
  readonly lck: number
}

export class PlayerPort extends Context.Tag("PlayerPort")<
  PlayerPort,
  {
    readonly createCharacter: (
      params: CreateCharacterParams,
    ) => Effect.Effect<Character, CharacterNameTakenError | InvalidCharacterNameError | InvalidClassIdError>
    readonly getPlayer: (
      id: PlayerId,
    ) => Effect.Effect<Character, PlayerNotFoundError>
    readonly getPlayerByAccountId: (
      accountId: AccountId,
    ) => Effect.Effect<Character | null>
    readonly allocateStats: (
      id: PlayerId,
      stats: StatAllocation,
    ) => Effect.Effect<void, PlayerNotFoundError | InvalidStatsError>
  }
>() {}
