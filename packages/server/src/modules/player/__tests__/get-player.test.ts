import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { getPlayer } from "../application/get-player.use-case"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { CacheService } from "../../../shared/infrastructure/cache/index"
import { Character } from "../domain/entities/character"
import type { PlayerId, AccountId } from "../../../shared/kernel/types"

const makeTestCharacter = (): Character =>
  Character.create({
    id: "player-1" as PlayerId,
    accountId: "acc-1" as AccountId,
    name: "Kirito",
    level: 10,
    experience: 5000,
    currentHp: 280,
    maxHp: 280,
    currentFloor: 1,
    col: 1000,
    isAlive: true,
    stats: {
      str: 10,
      agi: 5,
      vit: 8,
      dex: 5,
      int: 3,
      lck: 3,
      unallocatedPoints: 0,
    },
  })

const makeMockRepo = (character: Character | null) =>
  Layer.succeed(CharacterRepository, {
    findById: () => Effect.succeed(character),
    findByName: () => Effect.succeed(null),
    findByAccountId: () => Effect.succeed(null),
    save: () => Effect.void,
    update: () => Effect.void,
    saveStats: () => Effect.void,
  })

const makeMockCache = () => {
  const store = new Map<string, string>()

  return Layer.succeed(CacheService, {
    get: (key: string) => Effect.succeed(store.get(key) ?? null),
    set: (key: string, value: string) =>
      Effect.sync(() => {
        store.set(key, value)
      }),
    del: (key: string) =>
      Effect.sync(() => {
        store.delete(key)
      }),
    increment: () => Effect.succeed(1),
    exists: (key: string) => Effect.succeed(store.has(key)),
    acquireLock: () => Effect.succeed(true),
    releaseLock: () => Effect.void,
    expire: () => Effect.void,
    getOrSet: (key: string, factory: () => Effect.Effect<string>) =>
      Effect.gen(function* () {
        const v = store.get(key)
        if (v) return v
        const result = yield* factory()
        store.set(key, result)
        return result
      }),
    sadd: () => Effect.succeed(1),
    srem: () => Effect.succeed(1),
    smembers: () => Effect.succeed([]),
    scard: () => Effect.succeed(0),
    hset: () => Effect.void,
    hgetall: () => Effect.succeed({}),
    hmset: () => Effect.void,
    hdel: () => Effect.void,
  })
}

describe("getPlayer", () => {
  it("should return existing player", async () => {
    const testLayer = Layer.mergeAll(
      makeMockRepo(makeTestCharacter()),
      makeMockCache(),
    )

    const character = await Effect.runPromise(
      Effect.provide(getPlayer("player-1" as PlayerId), testLayer),
    )

    expect(character.name).toBe("Kirito")
    expect(character.level).toBe(10)
  })

  it("should fail with PlayerNotFoundError for non-existent player", async () => {
    const testLayer = Layer.mergeAll(
      makeMockRepo(null),
      makeMockCache(),
    )

    const result = await Effect.runPromiseExit(
      Effect.provide(getPlayer("nonexistent" as PlayerId), testLayer),
    )

    expect(result._tag).toBe("Failure")
  })
})
