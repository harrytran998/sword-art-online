import { describe, it, expect } from "bun:test"
import { getSlotType } from "../application/assign-skill-slot.use-case"

describe("Skill Slot Types", () => {
  describe("getSlotType", () => {
    it("should return 'weapon' for slots 1-5", () => {
      expect(getSlotType(1)).toBe("weapon")
      expect(getSlotType(3)).toBe("weapon")
      expect(getSlotType(5)).toBe("weapon")
    })

    it("should return 'support' for slots 6-10", () => {
      expect(getSlotType(6)).toBe("support")
      expect(getSlotType(8)).toBe("support")
      expect(getSlotType(10)).toBe("support")
    })

    it("should return 'passive' for slots 11-13", () => {
      expect(getSlotType(11)).toBe("passive")
      expect(getSlotType(12)).toBe("passive")
      expect(getSlotType(13)).toBe("passive")
    })

    it("should return null for out-of-range slots", () => {
      expect(getSlotType(0)).toBeNull()
      expect(getSlotType(-1)).toBeNull()
      expect(getSlotType(14)).toBeNull()
      expect(getSlotType(100)).toBeNull()
    })
  })
})
