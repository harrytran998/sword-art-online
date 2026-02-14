import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { createCharacter } from "../application/create-character.use-case.js"
import { CharacterRepository } from "../ports/outbound/character.repository.js"
import { EventBus } from "../../../shared/infrastructure/event-bus/index.js"
import { Character } from "../domain/entities/character.js"
import type { CharacterStats } from "../domain/value-objects/stats.js"
import type { PlayerId, AccountId } from "../../../shared/kernel/types.js"
import type { DomainEvent } from "../../../shared/kernel/events.js"

const makeTestCharacter = (name: string): Character =>
  Character.create({
    id: "existing-id" as PlayerId,
    accountId: "acc-1" as AccountId,
    name,
    level: 1,
    experience: 0,
    currentHp: 180,
    maxHp: 180,
    currentFloor: 1,
    col: 0,
    isAlive: true,
    stats: {
      str: 5,
      agi: 5,
      vit: 5,
      dex: 5,
      int: 5,
      lck: 5,
      unallocatedPoints: 0,
    },
  })

const makeMockRepo = (existingNames: string[] = []) => {
  const saved = { characters: [] as Character[], stats: [] as Array<{ id: PlayerId; stats: CharacterStats }> }

  return {
    layer: Layer.succeed(CharacterRepository, {
      findById: () => Effect.succeed(null),
      findByName: (name: string) =>
        Effect.succeed(
          existingNames.includes(name)
            ? makeTestCharacter(name)
            : null,
        ),
      findByAccountId: () => Effect.succeed(null),
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

describe("createCharacter", () => {
  it("should create character with valid name", async () => {
    const { layer: repoLayer, saved } = makeMockRepo()
    const { layer: busLayer, events } = makeMockEventBus()
    const testLayer = Layer.mergeAll(repoLayer, busLayer)

    const character = await Effect.runPromise(
      Effect.provide(
        createCharacter({
          accountId: "acc-1" as AccountId,
          name: "Kirito",
          classId: 1,
        }),
        testLayer,
      ),
    )

    expect(character.name).toBe("Kirito")
    expect(character.level).toBe(1)
    expect(character.experience).toBe(0)
    expect(character.isAlive).toBe(true)
    expect(saved.characters).toHaveLength(1)
    expect(saved.stats).toHaveLength(1)
    expect(events).toHaveLength(1)
    expect(events[0]?._tag).toBe("PlayerCreated")
  })

  it("should fail with CharacterNameTakenError for duplicate name", async () => {
    const { layer: repoLayer } = makeMockRepo(["Kirito"])
    const { layer: busLayer } = makeMockEventBus()
    const testLayer = Layer.mergeAll(repoLayer, busLayer)

    const result = await Effect.runPromiseExit(
      Effect.provide(
        createCharacter({
          accountId: "acc-2" as AccountId,
          name: "Kirito",
          classId: 1,
        }),
        testLayer,
      ),
    )

    expect(result._tag).toBe("Failure")
  })

  it("should assign correct starting stats per class", async () => {
    const { layer: repoLayer, saved } = makeMockRepo()
    const { layer: busLayer } = makeMockEventBus()
    const testLayer = Layer.mergeAll(repoLayer, busLayer)

    await Effect.runPromise(
      Effect.provide(
        createCharacter({
          accountId: "acc-1" as AccountId,
          name: "Asuna",
          classId: 2,
        }),
        testLayer,
      ),
    )

    const stats = saved.stats[0]?.stats
    expect(stats?.str).toBe(5)
    expect(stats?.agi).toBe(10)
    expect(stats?.dex).toBe(8)
  })
})
