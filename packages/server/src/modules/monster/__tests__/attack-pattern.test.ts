import { describe, it, expect } from "bun:test"
import { AttackPattern } from "../domain/value-objects/attack-pattern"

describe("AttackPattern", () => {
  describe("melee", () => {
    it("should create a melee attack pattern", () => {
      const pattern = AttackPattern.melee()
      expect(pattern.type).toBe("melee")
      expect(pattern.damageMultiplier).toBe(1.0)
      expect(pattern.range).toBe(2.0)
      expect(pattern.telegraphMs).toBe(0)
    })
  })

  describe("charge", () => {
    it("should create a charge attack pattern with telegraph", () => {
      const pattern = AttackPattern.charge()
      expect(pattern.type).toBe("charge")
      expect(pattern.damageMultiplier).toBe(1.5)
      expect(pattern.range).toBe(10.0)
      expect(pattern.telegraphMs).toBe(1000)
    })
  })

  describe("aoe", () => {
    it("should create an aoe attack pattern with radius", () => {
      const pattern = AttackPattern.aoe(5.0)
      expect(pattern.type).toBe("aoe")
      expect(pattern.aoeRadius).toBe(5.0)
      expect(pattern.telegraphMs).toBe(2000)
    })
  })

  describe("isTelegraphed", () => {
    it("should return true for charge attacks", () => {
      const pattern = AttackPattern.charge()
      expect(pattern.isTelegraphed()).toBe(true)
    })

    it("should return true for aoe attacks", () => {
      const pattern = AttackPattern.aoe()
      expect(pattern.isTelegraphed()).toBe(true)
    })

    it("should return false for melee attacks", () => {
      const pattern = AttackPattern.melee()
      expect(pattern.isTelegraphed()).toBe(false)
    })
  })
})
