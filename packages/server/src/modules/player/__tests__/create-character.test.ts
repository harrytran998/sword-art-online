import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { createCharacter } from "../application/create-character.use-case"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { Character } from "../domain/entities/character"
import type { CharacterStats } from "../domain/value-objects/stats"
import type { PlayerId, AccountId } from "../../../shared/kernel/types"
import type { DomainEvent } from "../../../shared/kernel/events"

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

const runCreateCharacter = async (name: string, classId: number) => {
  const { layer: repoLayer, saved } = makeMockRepo()
  const { layer: busLayer, events } = makeMockEventBus()
  const testLayer = Layer.mergeAll(repoLayer, busLayer)

  const character = await Effect.runPromise(
    Effect.provide(
      createCharacter({
        accountId: "acc-1" as AccountId,
        name,
        classId,
      }),
      testLayer,
    ),
  )

  return { character, saved, events }
}

describe("createCharacter", () => {
  it("should create character with valid name", async () => {
    const { character, saved, events } = await runCreateCharacter("Kirito", 1)

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

  it("should assign correct stats for class 1 (Swordsman)", async () => {
    const { saved } = await runCreateCharacter("Kirito", 1)
    const stats = saved.stats[0]?.stats
    expect(stats?.str).toBe(10)
    expect(stats?.agi).toBe(5)
    expect(stats?.vit).toBe(8)
    expect(stats?.dex).toBe(5)
    expect(stats?.int).toBe(3)
    expect(stats?.lck).toBe(3)
  })

  it("should assign correct stats for class 2 (Fencer)", async () => {
    const { saved } = await runCreateCharacter("Asuna", 2)
    const stats = saved.stats[0]?.stats
    expect(stats?.str).toBe(5)
    expect(stats?.agi).toBe(10)
    expect(stats?.vit).toBe(5)
    expect(stats?.dex).toBe(8)
    expect(stats?.int).toBe(3)
    expect(stats?.lck).toBe(3)
  })

  it("should assign correct stats for class 3 (Rogue)", async () => {
    const { saved } = await runCreateCharacter("Argo", 3)
    const stats = saved.stats[0]?.stats
    expect(stats?.str).toBe(4)
    expect(stats?.agi).toBe(8)
    expect(stats?.vit).toBe(4)
    expect(stats?.dex).toBe(7)
    expect(stats?.int).toBe(3)
    expect(stats?.lck).toBe(8)
  })

  it("should assign correct stats for class 4 (Berserker)", async () => {
    const { saved } = await runCreateCharacter("Agil", 4)
    const stats = saved.stats[0]?.stats
    expect(stats?.str).toBe(12)
    expect(stats?.agi).toBe(3)
    expect(stats?.vit).toBe(10)
    expect(stats?.dex).toBe(4)
    expect(stats?.int).toBe(2)
    expect(stats?.lck).toBe(3)
  })

  it("should assign correct stats for class 5 (Lancer)", async () => {
    const { saved } = await runCreateCharacter("Diabel", 5)
    const stats = saved.stats[0]?.stats
    expect(stats?.str).toBe(8)
    expect(stats?.agi).toBe(5)
    expect(stats?.vit).toBe(7)
    expect(stats?.dex).toBe(7)
    expect(stats?.int).toBe(3)
    expect(stats?.lck).toBe(4)
  })

  it("should assign correct stats for class 6 (Archer)", async () => {
    const { saved } = await runCreateCharacter("Sinon", 6)
    const stats = saved.stats[0]?.stats
    expect(stats?.str).toBe(4)
    expect(stats?.agi).toBe(7)
    expect(stats?.vit).toBe(4)
    expect(stats?.dex).toBe(10)
    expect(stats?.int).toBe(5)
    expect(stats?.lck).toBe(4)
  })

  it("should assign correct stats for class 7 (Monk)", async () => {
    const { saved } = await runCreateCharacter("Heathcliff", 7)
    const stats = saved.stats[0]?.stats
    expect(stats?.str).toBe(7)
    expect(stats?.agi).toBe(6)
    expect(stats?.vit).toBe(6)
    expect(stats?.dex).toBe(5)
    expect(stats?.int).toBe(7)
    expect(stats?.lck).toBe(3)
  })

  it("should fail with InvalidClassIdError for classId 8", async () => {
    const { layer: repoLayer } = makeMockRepo()
    const { layer: busLayer } = makeMockEventBus()
    const testLayer = Layer.mergeAll(repoLayer, busLayer)

    const result = await Effect.runPromiseExit(
      Effect.provide(
        createCharacter({
          accountId: "acc-1" as AccountId,
          name: "Invalid",
          classId: 8,
        }),
        testLayer,
      ),
    )

    expect(result._tag).toBe("Failure")
  })

  it("should fail with InvalidClassIdError for classId 0", async () => {
    const { layer: repoLayer } = makeMockRepo()
    const { layer: busLayer } = makeMockEventBus()
    const testLayer = Layer.mergeAll(repoLayer, busLayer)

    const result = await Effect.runPromiseExit(
      Effect.provide(
        createCharacter({
          accountId: "acc-1" as AccountId,
          name: "Invalid",
          classId: 0,
        }),
        testLayer,
      ),
    )

    expect(result._tag).toBe("Failure")
  })
})
