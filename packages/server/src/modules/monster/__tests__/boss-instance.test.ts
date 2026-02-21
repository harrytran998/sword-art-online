import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { BossInstance } from "../domain/entities/boss-instance"
import { initializeBoss, damageBoss, updateBossAI, getActiveBoss, removeBoss } from "../application/boss-ai.use-case"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import type { MonsterId, PlayerId, ZoneId } from "../../../shared/kernel/types"

const BOSS_ID = "boss_illfang_1" as MonsterId
const ZONE_ID = "floor_1_boss_room" as ZoneId

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

describe("BossInstance", () => {
  it("should create Illfang with correct initial state", () => {
    const boss = BossInstance.createIllfang(BOSS_ID, ZONE_ID)

    expect(boss.name).toBe("Illfang the Kobold Lord")
    expect(boss.level).toBe(15)
    expect(boss.totalHp).toBe(15000)
    expect(boss.currentHp).toBe(15000)
    expect(boss.phase).toBe(1)
    expect(boss.isAlive()).toBe(true)
    expect(boss.isDefeated).toBe(false)
  })

  it("should transition to phase 2 when HP drops below 10000", () => {
    const boss = BossInstance.createIllfang(BOSS_ID, ZONE_ID)
    const damaged = boss.takeDamage(5001)

    expect(damaged.phase).toBe(2)
    expect(damaged.currentHp).toBe(9999)
    expect(damaged.isAlive()).toBe(true)
  })

  it("should transition to phase 3 (enrage) when HP drops below 5000", () => {
    const boss = BossInstance.createIllfang(BOSS_ID, ZONE_ID)
    const damaged = boss.takeDamage(10001)

    expect(damaged.phase).toBe(3)
    expect(damaged.isEnraged()).toBe(true)
    expect(damaged.enrageStartedAt).not.toBeNull()
  })

  it("should be defeated when HP reaches 0", () => {
    const boss = BossInstance.createIllfang(BOSS_ID, ZONE_ID)
    const defeated = boss.takeDamage(15000)

    expect(defeated.currentHp).toBe(0)
    expect(defeated.isDefeated).toBe(true)
    expect(defeated.isAlive()).toBe(false)
  })

  it("should have correct phase-specific attack multipliers", () => {
    const boss = BossInstance.createIllfang(BOSS_ID, ZONE_ID)

    expect(boss.getPhaseAttackMultiplier()).toBe(1) // Phase 1

    const phase2 = boss.takeDamage(5001)
    expect(phase2.getPhaseAttackMultiplier()).toBe(1.5) // Phase 2

    const phase3 = boss.takeDamage(10001)
    expect(phase3.getPhaseAttackMultiplier()).toBe(2) // Phase 3
  })

  it("should have increasing AoE radius per phase", () => {
    const boss = BossInstance.createIllfang(BOSS_ID, ZONE_ID)
    expect(boss.getPhaseAoeRadius()).toBe(5)

    const phase2 = boss.takeDamage(5001)
    expect(phase2.getPhaseAoeRadius()).toBe(8)

    const phase3 = boss.takeDamage(10001)
    expect(phase3.getPhaseAoeRadius()).toBe(15)
  })
})

describe("Boss AI", () => {
  it("should initialize and retrieve boss", () => {
    const boss = initializeBoss(BOSS_ID, ZONE_ID)
    expect(boss.isAlive()).toBe(true)

    const retrieved = getActiveBoss(ZONE_ID)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.id).toBe(BOSS_ID)

    removeBoss(BOSS_ID)
  })

  it("should publish BossPhaseChanged on phase transition", async () => {
    initializeBoss(BOSS_ID, ZONE_ID)
    const eventBus = makeMockEventBus()

    const result = await Effect.runPromise(
      Effect.provide(
        damageBoss(BOSS_ID, 5001, "player-1" as PlayerId),
        eventBus.layer,
      ),
    )

    expect(result.phase).toBe(2)
    expect(eventBus.published.some((e) => e._tag === "BossPhaseChanged")).toBe(true)

    removeBoss(BOSS_ID)
  })

  it("should publish BossDefeated when boss dies", async () => {
    initializeBoss(BOSS_ID, ZONE_ID)
    const eventBus = makeMockEventBus()

    await Effect.runPromise(
      Effect.provide(
        damageBoss(BOSS_ID, 15000, "player-1" as PlayerId),
        eventBus.layer,
      ),
    )

    expect(eventBus.published.some((e) => e._tag === "BossDefeated")).toBe(true)
  })

  it("should return idle action when no players", () => {
    initializeBoss(BOSS_ID, ZONE_ID)
    const action = updateBossAI(BOSS_ID, new Map())

    expect(action.type).toBe("idle")

    removeBoss(BOSS_ID)
  })

  it("should target nearest player", () => {
    initializeBoss(BOSS_ID, ZONE_ID)

    const playerPositions = new Map<PlayerId, { x: number; z: number }>()
    playerPositions.set("player-1" as PlayerId, { x: 52, z: 78 })
    playerPositions.set("player-2" as PlayerId, { x: 40, z: 70 })

    const action = updateBossAI(BOSS_ID, playerPositions)

    expect(action.targetId).not.toBeNull()
    expect(action.type).not.toBe("idle")

    removeBoss(BOSS_ID)
  })
})
