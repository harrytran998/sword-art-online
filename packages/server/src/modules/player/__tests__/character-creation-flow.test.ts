import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { PlayerPort } from "../ports/inbound/player.port"
import { PlayerPortLive } from "../adapters/inbound/player-port.live"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { CacheService } from "../../../shared/infrastructure/cache/index"
import { Character } from "../domain/entities/character"
import type { CharacterStats } from "../domain/value-objects/stats"
import type { PlayerId, AccountId } from "../../../shared/kernel/types"
import type { DomainEvent } from "../../../shared/kernel/events"

const makeTestCharacter = (name: string, accountId: string): Character =>
  Character.create({
    id: "char-1" as PlayerId,
    accountId: accountId as AccountId,
    name,
    level: 1,
    experience: 0,
    currentHp: 180,
    maxHp: 180,
    currentFloor: 1,
    col: 0,
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

const makeMockRepo = (opts: { existingNames?: string[]; existingAccounts?: Map<string, Character> } = {}) => {
  const saved = { characters: [] as Character[], stats: [] as Array<{ id: PlayerId; stats: CharacterStats }> }

  return {
    layer: Layer.succeed(CharacterRepository, {
      findById: () => Effect.succeed(null),
      findByName: (name: string) =>
        Effect.succeed(
          opts.existingNames?.includes(name)
            ? makeTestCharacter(name, "acc-existing")
            : null,
        ),
      findByAccountId: (accountId: AccountId) =>
        Effect.succeed(opts.existingAccounts?.get(accountId) ?? null),
      save: (c: Character) =>
        Effect.sync(() => {
          saved.characters.push(c)
        }),
      update: () => Effect.void,
      saveStats: (id: PlayerId, stats: CharacterStats) =>
        Effect.sync(() => {
          saved.stats.push({ id, stats })
        }),
    }),
    saved,
  }
}

const makeMockEventBus = () => {
  const events: DomainEvent[] = []
  return {
    layer: Layer.succeed(EventBus, {
      publish: (event: DomainEvent) =>
        Effect.sync(() => {
          events.push(event)
        }),
      subscribe: () => Effect.void,
    }),
    events,
  }
}

const makeMockCache = () => {
  const store = new Map<string, string>()
  return {
    layer: Layer.succeed(CacheService, {
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
      expire: () => Effect.void,
      getOrSet: (key: string, factory: () => Effect.Effect<string>) =>
        Effect.gen(function* () {
          const cached = store.get(key)
          if (cached) return cached
          const value = yield* factory()
          store.set(key, value)
          return value
        }),
      sadd: () => Effect.succeed(1),
      srem: () => Effect.succeed(1),
      smembers: () => Effect.succeed([]),
      scard: () => Effect.succeed(0),
      hset: () => Effect.void,
      hgetall: () => Effect.succeed({}),
      hmset: () => Effect.void,
      hdel: () => Effect.void,
    }),
  }
}

const makePlayerPort = (opts: { existingNames?: string[]; existingAccounts?: Map<string, Character> } = {}) => {
  const { layer: repoLayer, saved } = makeMockRepo(opts)
  const { layer: busLayer, events } = makeMockEventBus()
  const { layer: cacheLayer } = makeMockCache()

  const testLayer = PlayerPortLive.pipe(
    Layer.provide(Layer.mergeAll(repoLayer, busLayer, cacheLayer)),
  )

  return { testLayer, saved, events }
}

describe("Character Creation Flow (through PlayerPort)", () => {
  it("should create a character and return character_data response shape", async () => {
    const { testLayer, saved, events } = makePlayerPort()

    const character = await Effect.runPromise(
      Effect.gen(function* () {
        const player = yield* PlayerPort
        return yield* player.createCharacter({
          accountId: "acc-1" as AccountId,
          name: "Kirito",
          classId: 1,
        })
      }).pipe(Effect.provide(testLayer)),
    )

    // Verify character data matches what server would send as character_data message
    expect(character.name).toBe("Kirito")
    expect(character.level).toBe(1)
    expect(character.experience).toBe(0)
    expect(character.isAlive).toBe(true)
    expect(character.currentFloor).toBe(1)
    expect(character.col).toBe(0)
    expect(character.stats.str).toBe(10)
    expect(saved.characters).toHaveLength(1)
    expect(events).toHaveLength(1)
    expect(events[0]?._tag).toBe("PlayerCreated")
  })

  it("should reject duplicate name with CharacterNameTakenError", async () => {
    const { testLayer } = makePlayerPort({ existingNames: ["Kirito"] })

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const player = yield* PlayerPort
        return yield* player.createCharacter({
          accountId: "acc-2" as AccountId,
          name: "Kirito",
          classId: 1,
        })
      }).pipe(Effect.provide(testLayer)),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("should return null when no character exists for account", async () => {
    const { testLayer } = makePlayerPort()

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const player = yield* PlayerPort
        return yield* player.getPlayerByAccountId("acc-new" as AccountId)
      }).pipe(Effect.provide(testLayer)),
    )

    expect(result).toBeNull()
  })

  it("should return existing character for account", async () => {
    const existing = makeTestCharacter("Kirito", "acc-1")
    const accounts = new Map<string, Character>([["acc-1", existing]])
    const { testLayer } = makePlayerPort({ existingAccounts: accounts })

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const player = yield* PlayerPort
        return yield* player.getPlayerByAccountId("acc-1" as AccountId)
      }).pipe(Effect.provide(testLayer)),
    )

    expect(result).not.toBeNull()
    expect(result?.name).toBe("Kirito")
  })
})
