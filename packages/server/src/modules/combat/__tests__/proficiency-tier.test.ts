import { describe, expect, it } from "bun:test"
import {
  getTierForProficiency,
  getTierModifiers,
  getTierName,
} from "../domain/value-objects/proficiency-tier"

describe("ProficiencyTier", () => {
  describe("getTierName", () => {
    it("should return Novice for 0-99", () => {
      expect(getTierName(0)).toBe("Novice")
      expect(getTierName(50)).toBe("Novice")
      expect(getTierName(99)).toBe("Novice")
    })

    it("should return Apprentice for 100-499", () => {
      expect(getTierName(100)).toBe("Apprentice")
      expect(getTierName(499)).toBe("Apprentice")
    })

    it("should return Expert for 500-999", () => {
      expect(getTierName(500)).toBe("Expert")
      expect(getTierName(999)).toBe("Expert")
    })

    it("should return Master for 1000-4999", () => {
      expect(getTierName(1000)).toBe("Master")
      expect(getTierName(4999)).toBe("Master")
    })

    it("should return Grandmaster for 5000+", () => {
      expect(getTierName(5000)).toBe("Grandmaster")
      expect(getTierName(99999)).toBe("Grandmaster")
    })
  })

  describe("getTierModifiers", () => {
    it("should return 90% power for Novice", () => {
      const mods = getTierModifiers(0)
      expect(mods.powerMultiplier).toBe(0.9)
      expect(mods.cooldownReduction).toBe(0)
    })

    it("should return 100% power for Apprentice", () => {
      const mods = getTierModifiers(100)
      expect(mods.powerMultiplier).toBe(1)
      expect(mods.cooldownReduction).toBe(0)
    })

    it("should return 110% power for Expert", () => {
      const mods = getTierModifiers(500)
      expect(mods.powerMultiplier).toBe(1.1)
    })

    it("should return 125% power and -10% cooldown for Master", () => {
      const mods = getTierModifiers(1000)
      expect(mods.powerMultiplier).toBe(1.25)
      expect(mods.cooldownReduction).toBe(0.1)
    })

    it("should return 150% power and -20% cooldown for Grandmaster", () => {
      const mods = getTierModifiers(5000)
      expect(mods.powerMultiplier).toBe(1.5)
      expect(mods.cooldownReduction).toBe(0.2)
    })
  })

  describe("getTierForProficiency", () => {
    it("should return tier with correct boundaries", () => {
      expect(getTierForProficiency(0).name).toBe("Novice")
      expect(getTierForProficiency(100).name).toBe("Apprentice")
      expect(getTierForProficiency(500).name).toBe("Expert")
      expect(getTierForProficiency(1000).name).toBe("Master")
      expect(getTierForProficiency(5000).name).toBe("Grandmaster")
    })
  })
})
