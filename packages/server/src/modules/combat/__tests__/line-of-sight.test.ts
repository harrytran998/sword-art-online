import { describe, it, expect } from "bun:test"
import { checkLineOfSight } from "../domain/value-objects/line-of-sight"
import type { Obstacle } from "../domain/value-objects/line-of-sight"

describe("Line of Sight", () => {
  describe("checkLineOfSight", () => {
    it("should return true when no obstacles exist", () => {
      const result = checkLineOfSight({ x: 0, z: 0 }, { x: 10, z: 10 }, [])
      expect(result).toBe(true)
    })

    it("should return true when obstacle does not block line", () => {
      const obstacle: Obstacle = { minX: 20, minZ: 20, maxX: 30, maxZ: 30 }
      const result = checkLineOfSight({ x: 0, z: 0 }, { x: 10, z: 10 }, [obstacle])
      expect(result).toBe(true)
    })

    it("should return false when obstacle blocks the line", () => {
      // Obstacle at (4,4)-(6,6), line from (0,0) to (10,10) — should intersect
      const obstacle: Obstacle = { minX: 4, minZ: 4, maxX: 6, maxZ: 6 }
      const result = checkLineOfSight({ x: 0, z: 0 }, { x: 10, z: 10 }, [obstacle])
      expect(result).toBe(false)
    })

    it("should return true when line passes beside obstacle", () => {
      const obstacle: Obstacle = { minX: 5, minZ: 5, maxX: 10, maxZ: 10 }
      const result = checkLineOfSight({ x: 0, z: 0 }, { x: 4, z: 0 }, [obstacle])
      expect(result).toBe(true)
    })

    it("should handle parallel rays (vertical line, obstacle beside)", () => {
      const obstacle: Obstacle = { minX: 5, minZ: 0, maxX: 10, maxZ: 10 }
      // Vertical line at x=2 from z=0 to z=10 — should not hit obstacle at x=[5,10]
      const result = checkLineOfSight({ x: 2, z: 0 }, { x: 2, z: 10 }, [obstacle])
      expect(result).toBe(true)
    })

    it("should handle multiple obstacles, blocking if any one blocks", () => {
      const obstacles: Obstacle[] = [
        { minX: 20, minZ: 20, maxX: 25, maxZ: 25 }, // not blocking
        { minX: 4, minZ: 4, maxX: 6, maxZ: 6 }, // blocking
      ]
      const result = checkLineOfSight({ x: 0, z: 0 }, { x: 10, z: 10 }, obstacles)
      expect(result).toBe(false)
    })
  })
})
