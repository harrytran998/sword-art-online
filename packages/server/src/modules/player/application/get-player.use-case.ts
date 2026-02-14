import { Effect } from "effect"
import { CharacterRepository } from "../ports/outbound/character.repository.js"
import { PlayerNotFoundError } from "../domain/errors.js"
import { CacheService } from "../../../shared/infrastructure/cache/index.js"
import { Character } from "../domain/entities/character.js"
import type { PlayerId, AccountId } from "../../../shared/kernel/types.js"
import type { CharacterStats } from "../domain/value-objects/stats.js"

const PLAYER_CACHE_TTL = 300

export const getPlayer = (id: PlayerId) =>
  Effect.gen(function* () {
    const repo = yield* CharacterRepository
    const cache = yield* CacheService

    const cached = yield* cache.get(`player:${id}`)
    if (cached) {
      const data = JSON.parse(cached) as {
        id: string
        accountId: string
        name: string
        level: number
        experience: number
        currentHp: number
        maxHp: number
        currentFloor: number
        col: number
        isAlive: boolean
        stats: CharacterStats
      }
      return Character.create({
        ...data,
        id: data.id as PlayerId,
        accountId: data.accountId as AccountId,
      })
    }

    const character = yield* repo.findById(id)
    if (!character) {
      return yield* Effect.fail(new PlayerNotFoundError({ id }))
    }

    yield* cache.set(
      `player:${id}`,
      JSON.stringify({
        id: character.id,
        accountId: character.accountId,
        name: character.name,
        level: character.level,
        experience: character.experience,
        currentHp: character.currentHp,
        maxHp: character.maxHp,
        currentFloor: character.currentFloor,
        col: character.col,
        isAlive: character.isAlive,
        stats: character.stats,
      }),
      PLAYER_CACHE_TTL,
    )

    return character
  })

export const getPlayerByAccountId = (accountId: AccountId) =>
  Effect.gen(function* () {
    const repo = yield* CharacterRepository
    return yield* repo.findByAccountId(accountId)
  })
