import { describe, it, expect } from "bun:test"
import { Monster } from "../domain/entities/monster"
import { MonsterId, ZoneId } from "../../../shared/kernel/types"

describe("Monster", () => {
  const createTestMonster = (overrides: Partial<Parameters<typeof Monster.create>[0]> = {}) =>
    Monster.create({
      id: MonsterId("monster_1"),
      definitionId: 1,
      name: "Test Monster",
      monsterType: "beast",
      level: 5,
      maxHp: 100,
      currentHp: 100,
      attack: 15,
      defense: 10,
      zoneId: ZoneId("zone_1"),
      positionX: 10,
      positionY: 0,
      positionZ: 10,
      spawnX: 10,
      spawnY: 0,
      spawnZ: 10,
      aggroRange: 8,
      patrolRange: 15,
      attackRange: 2,
      state: "idle",
      targetId: null,
      ...overrides,
    })

  describe("create", () => {
    it("should create a monster with given properties", () => {
      const monster = createTestMonster()
      expect(monster.id).toBe("monster_1" as MonsterId)
      expect(monster.name).toBe("Test Monster")
      expect(monster.level).toBe(5)
      expect(monster.maxHp).toBe(100)
    })
  })

  describe("isAlive", () => {
    it("should return true when currentHp > 0", () => {
      const monster = createTestMonster({ currentHp: 50 })
      expect(monster.isAlive()).toBe(true)
    })

    it("should return false when currentHp is 0", () => {
      const monster = createTestMonster({ currentHp: 0 })
      expect(monster.isAlive()).toBe(false)
    })
  })

  describe("distanceTo", () => {
    it("should calculate correct distance", () => {
      const monster = createTestMonster()
      expect(monster.distanceTo(13, 14)).toBeCloseTo(5, 1)
    })
  })

  describe("isInAggroRange", () => {
    it("should return true when target is within aggro range", () => {
      const monster = createTestMonster({ aggroRange: 8 })
      expect(monster.isInAggroRange(12, 10)).toBe(true)
    })

    it("should return false when target is outside aggro range", () => {
      const monster = createTestMonster({ aggroRange: 8 })
      expect(monster.isInAggroRange(30, 30)).toBe(false)
    })
  })

  describe("isInAttackRange", () => {
    it("should return true when target is within attack range", () => {
      const monster = createTestMonster({ attackRange: 2 })
      expect(monster.isInAttackRange(11, 10)).toBe(true)
    })

    it("should return false when target is outside attack range", () => {
      const monster = createTestMonster({ attackRange: 2 })
      expect(monster.isInAttackRange(20, 20)).toBe(false)
    })
  })

  describe("takeDamage", () => {
    it("should reduce currentHp by damage amount", () => {
      const monster = createTestMonster({ currentHp: 100 })
      const damaged = monster.takeDamage(30)
      expect(damaged.currentHp).toBe(70)
    })

    it("should not go below 0", () => {
      const monster = createTestMonster({ currentHp: 50 })
      const damaged = monster.takeDamage(100)
      expect(damaged.currentHp).toBe(0)
    })
  })

  describe("withState", () => {
    it("should update monster state", () => {
      const monster = createTestMonster({ state: "idle" })
      const updated = monster.withState("aggro")
      expect(updated.state).toBe("aggro")
    })
  })

  describe("withTarget", () => {
    it("should update target", () => {
      const monster = createTestMonster({ targetId: null })
      const updated = monster.withTarget("player_1")
      expect(updated.targetId).toBe("player_1")
    })
  })
})
