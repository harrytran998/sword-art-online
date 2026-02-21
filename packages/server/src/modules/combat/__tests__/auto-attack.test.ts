import { describe, it, expect } from "bun:test"
import { calculateAutoAttackDamage } from "../application/auto-attack.use-case"

describe("Auto-Attack", () => {
  describe("calculateAutoAttackDamage", () => {
    it("should deal reduced damage based on target defense", () => {
      const result = calculateAutoAttackDamage(100, 50, 0, 0)
      // Formula: 100 * (1 - 50/(50+100)) = 100 * (1 - 1/3) = 100 * 2/3 ≈ 66
      expect(result.baseDamage).toBe(100)
      expect(result.finalDamage).toBe(66)
      expect(result.isCritical).toBe(false)
    })

    it("should deal at least 1 damage even with high defense", () => {
      const result = calculateAutoAttackDamage(10, 9999, 0, 0)
      // 10 * (1 - 9999/10099) ≈ 10 * 0.0099 ≈ 0 → clamped to 1
      expect(result.finalDamage).toBeGreaterThanOrEqual(1)
    })

    it("should deal full damage when target has 0 defense", () => {
      const result = calculateAutoAttackDamage(100, 0, 0, 0)
      // 100 * (1 - 0/100) = 100
      expect(result.finalDamage).toBe(100)
    })

    it("should use correct damage formula for various ATK/DEF combos", () => {
      // ATK=200, DEF=100: 200 * (1 - 100/200) = 200 * 0.5 = 100
      const result = calculateAutoAttackDamage(200, 100, 0, 0)
      expect(result.finalDamage).toBe(100)
    })
  })
})
