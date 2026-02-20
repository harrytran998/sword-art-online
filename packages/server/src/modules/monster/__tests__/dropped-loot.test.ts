import { describe, it, expect } from "bun:test"
import { DroppedLoot } from "../domain/entities/dropped-loot"
import { ZoneId, PlayerId } from "../../../shared/kernel/types"

describe("DroppedLoot", () => {
  const createTestLoot = (overrides: Partial<Parameters<typeof DroppedLoot.create>[0]> = {}) =>
    DroppedLoot.create({
      id: "loot_1",
      itemName: "Boar Hide",
      quantity: 2,
      positionX: 10,
      positionY: 0,
      positionZ: 10,
      zoneId: ZoneId("zone_1"),
      killerId: PlayerId("player_1"),
      droppedAt: new Date(),
      protectionExpiresAt: new Date(Date.now() + 30000),
      ...overrides,
    })

  describe("drop", () => {
    it("should create loot with protection timer", () => {
      const loot = DroppedLoot.drop(
        "loot_1",
        "Boar Hide",
        2,
        10,
        0,
        10,
        ZoneId("zone_1"),
        PlayerId("player_1"),
      )
      expect(loot.itemName).toBe("Boar Hide")
      expect(loot.quantity).toBe(2)
      expect(loot.protectionExpiresAt.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe("isProtected", () => {
    it("should return true for non-killer during protection", () => {
      const loot = createTestLoot({
        killerId: PlayerId("player_1"),
        protectionExpiresAt: new Date(Date.now() + 30000),
      })
      expect(loot.isProtected(PlayerId("player_2"))).toBe(true)
    })

    it("should return false for killer during protection", () => {
      const loot = createTestLoot({
        killerId: PlayerId("player_1"),
        protectionExpiresAt: new Date(Date.now() + 30000),
      })
      expect(loot.isProtected(PlayerId("player_1"))).toBe(false)
    })

    it("should return false after protection expires", () => {
      const loot = createTestLoot({
        killerId: PlayerId("player_1"),
        protectionExpiresAt: new Date(Date.now() - 1000),
      })
      expect(loot.isProtected(PlayerId("player_2"))).toBe(false)
    })
  })

  describe("canPickup", () => {
    it("should return true for killer during protection", () => {
      const loot = createTestLoot({
        killerId: PlayerId("player_1"),
        protectionExpiresAt: new Date(Date.now() + 30000),
      })
      expect(loot.canPickup(PlayerId("player_1"))).toBe(true)
    })

    it("should return false for non-killer during protection", () => {
      const loot = createTestLoot({
        killerId: PlayerId("player_1"),
        protectionExpiresAt: new Date(Date.now() + 30000),
      })
      expect(loot.canPickup(PlayerId("player_2"))).toBe(false)
    })
  })

  describe("isInRange", () => {
    it("should return true when within range", () => {
      const loot = createTestLoot({ positionX: 10, positionZ: 10 })
      expect(loot.isInRange(11, 10, 2.0)).toBe(true)
    })

    it("should return false when outside range", () => {
      const loot = createTestLoot({ positionX: 10, positionZ: 10 })
      expect(loot.isInRange(20, 20, 2.0)).toBe(false)
    })
  })
})
