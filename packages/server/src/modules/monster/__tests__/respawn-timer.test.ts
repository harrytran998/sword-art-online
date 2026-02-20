import { describe, it, expect } from "bun:test"
import { RespawnTimer } from "../domain/value-objects/respawn-timer"

describe("RespawnTimer", () => {
  describe("create", () => {
    it("should create a timer with future spawn time", () => {
      const timer = RespawnTimer.create(1, 5000)
      expect(timer.spawnPointId).toBe(1)
      expect(timer.remainingMs()).toBeGreaterThan(4000)
    })
  })

  describe("shouldRespawn", () => {
    it("should return false when time has not elapsed", () => {
      const timer = RespawnTimer.create(1, 5000)
      expect(timer.shouldRespawn()).toBe(false)
    })

    it("should return true when time has elapsed", () => {
      const pastDate = new Date(Date.now() - 1000)
      const timer = RespawnTimer.fromNextSpawnAt(1, pastDate)
      expect(timer.shouldRespawn()).toBe(true)
    })
  })

  describe("remainingMs", () => {
    it("should return remaining time in ms", () => {
      const timer = RespawnTimer.create(1, 5000)
      const remaining = timer.remainingMs()
      expect(remaining).toBeGreaterThan(4000)
      expect(remaining).toBeLessThanOrEqual(5000)
    })

    it("should return 0 when time has elapsed", () => {
      const pastDate = new Date(Date.now() - 1000)
      const timer = RespawnTimer.fromNextSpawnAt(1, pastDate)
      expect(timer.remainingMs()).toBe(0)
    })
  })
})
