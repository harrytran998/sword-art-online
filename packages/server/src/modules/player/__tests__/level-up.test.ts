import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { levelUp, xpNeededForLevel } from "../application/level-up.use-case"
import { grantExperience } from "../application/grant-experience.use-case"
import { applyDeathPenalty } from "../application/death-penalty.use-case"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { Character } from "../domain/entities/character"
import type { PlayerId, AccountId } from "../../../shared/kernel/types"

const makeCharacter = (overrides: Partial<{
  level: number
  experience: number
  unallocatedPoints: number
}> = {}): Character =>
  Character.create({
    id: "player-1" as PlayerId,
    accountId: "acc-1" as AccountId,
    name: "Kirito",
    level: overrides.level ?? 1,
    experience: overrides.experience ?? 0,
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
      unallocatedPoints: overrides.unallocatedPoints ?? 0,
    },
  })

const makeMockRepo = (initial: Character) => {
  let stored = initial

  return Layer.succeed(CharacterRepository, {
    findById: () => Effect.succeed(stored),
    findByName: () => Effect.succeed(null),
    findByAccountId: () => Effect.succeed(null),
    save: () => Effect.void,
    update: () => Effect.void,
    saveStats: () => Effect.void,
    updateExperienceAndLevel: (_id, experience, level, unallocatedPoints, maxHp) =>
      Effect.sync(() => {
        stored = Character.create({
          id: stored.id,
          accountId: stored.accountId,
          name: stored.name,
          level,
          experience,
          currentHp: stored.currentHp,
          maxHp,
          currentFloor: stored.currentFloor,
          col: stored.col,
          isAlive: stored.isAlive,
          stats: {
            ...stored.stats,
            unallocatedPoints,
          },
        })
      }),
  })
}

const makeMockEventBus = () => {
  const published: Array<{ _tag: string }> = []
  return {
    layer: Layer.succeed(EventBus, {
      publish: (event) =>
        Effect.sync(() => {
          published.push(event)
        }),
      subscribe: () => Effect.void,
    }),
    published,
  }
}

describe("xpNeededForLevel", () => {
  it("should compute XP needed as 100 * level^2", () => {
    expect(xpNeededForLevel(1)).toBe(100)
    expect(xpNeededForLevel(2)).toBe(400)
    expect(xpNeededForLevel(5)).toBe(2500)
    expect(xpNeededForLevel(10)).toBe(10000)
  })
})

describe("levelUp", () => {
  it("should level up character with enough XP", async () => {
    const character = makeCharacter({ level: 1, experience: 150 })
    const eventBus = makeMockEventBus()
    const testLayer = Layer.mergeAll(makeMockRepo(character), eventBus.layer)

    const result = await Effect.runPromise(
      Effect.provide(levelUp("player-1" as PlayerId), testLayer),
    )

    expect(result.level).toBe(2)
    expect(result.stats.unallocatedPoints).toBe(5)
    expect(eventBus.published).toHaveLength(1)
    expect(eventBus.published[0]!._tag).toBe("PlayerLeveledUp")
  })

  it("should not level up without enough XP", async () => {
    const character = makeCharacter({ level: 1, experience: 50 })
    const eventBus = makeMockEventBus()
    const testLayer = Layer.mergeAll(makeMockRepo(character), eventBus.layer)

    const result = await Effect.runPromise(
      Effect.provide(levelUp("player-1" as PlayerId), testLayer),
    )

    expect(result.level).toBe(1)
    expect(eventBus.published).toHaveLength(0)
  })

  it("should handle multi-level catch-up", async () => {
    // Level 1 needs 100 XP, level 2 needs 400 XP
    // 600 total XP should result in level 3 with 100 remaining
    const character = makeCharacter({ level: 1, experience: 600 })
    const eventBus = makeMockEventBus()
    const testLayer = Layer.mergeAll(makeMockRepo(character), eventBus.layer)

    const result = await Effect.runPromise(
      Effect.provide(levelUp("player-1" as PlayerId), testLayer),
    )

    expect(result.level).toBe(3)
    expect(result.stats.unallocatedPoints).toBe(10) // 5 per level * 2 levels
    expect(result.experience).toBe(100) // 600 - 100 - 400
  })
})

describe("grantExperience", () => {
  it("should add XP and trigger level-up", async () => {
    const character = makeCharacter({ level: 1, experience: 50 })
    const eventBus = makeMockEventBus()
    const testLayer = Layer.mergeAll(makeMockRepo(character), eventBus.layer)

    const result = await Effect.runPromise(
      Effect.provide(grantExperience("player-1" as PlayerId, 100), testLayer),
    )

    expect(result.level).toBe(2)
    expect(eventBus.published.some((e) => e._tag === "PlayerLeveledUp")).toBe(true)
  })

  it("should add XP without level-up when insufficient", async () => {
    const character = makeCharacter({ level: 1, experience: 0 })
    const eventBus = makeMockEventBus()
    const testLayer = Layer.mergeAll(makeMockRepo(character), eventBus.layer)

    const result = await Effect.runPromise(
      Effect.provide(grantExperience("player-1" as PlayerId, 50), testLayer),
    )

    expect(result.level).toBe(1)
    expect(result.experience).toBe(50)
    expect(eventBus.published).toHaveLength(0)
  })

  it("should ignore zero or negative amounts", async () => {
    const character = makeCharacter({ level: 1, experience: 50 })
    const eventBus = makeMockEventBus()
    const testLayer = Layer.mergeAll(makeMockRepo(character), eventBus.layer)

    const result = await Effect.runPromise(
      Effect.provide(grantExperience("player-1" as PlayerId, 0), testLayer),
    )

    expect(result.experience).toBe(50)
  })
})

describe("applyDeathPenalty", () => {
  it("should remove 10% of current XP", async () => {
    const character = makeCharacter({ level: 5, experience: 1000 })
    const eventBus = makeMockEventBus()
    const testLayer = Layer.mergeAll(makeMockRepo(character), eventBus.layer)

    await Effect.runPromise(
      Effect.provide(applyDeathPenalty("player-1" as PlayerId), testLayer),
    )

    // After penalty, we refetch. The mock updates in-place.
    const result = await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const repo = yield* CharacterRepository
          return yield* repo.findById("player-1" as PlayerId)
        }),
        testLayer,
      ),
    )

    expect(result!.experience).toBe(900) // 1000 - 10%
  })

  it("should never reduce XP below 0", async () => {
    const character = makeCharacter({ level: 2, experience: 5 })
    const eventBus = makeMockEventBus()
    const testLayer = Layer.mergeAll(makeMockRepo(character), eventBus.layer)

    await Effect.runPromise(
      Effect.provide(applyDeathPenalty("player-1" as PlayerId), testLayer),
    )

    const result = await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const repo = yield* CharacterRepository
          return yield* repo.findById("player-1" as PlayerId)
        }),
        testLayer,
      ),
    )

    expect(result!.experience).toBeGreaterThanOrEqual(0)
  })
})
