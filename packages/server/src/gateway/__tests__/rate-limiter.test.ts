import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { checkMessageRateLimit } from "../security/rate-limiter-config"
import { CacheService } from "../../shared/infrastructure/cache/index"

const makeInMemoryCacheLayer = () => {
  const store = new Map<string, { value: string; expiresAt: number | null }>()

  return Layer.succeed(CacheService, {
    get: (key) =>
      Effect.sync(() => {
        const entry = store.get(key)
        if (!entry) return null
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          store.delete(key)
          return null
        }
        return entry.value
      }),
    set: (key, value, ttlSeconds) =>
      Effect.sync(() => {
        store.set(key, {
          value,
          expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        })
      }),
    del: (key) =>
      Effect.sync(() => {
        store.delete(key)
      }),
    increment: (key) =>
      Effect.sync(() => {
        const entry = store.get(key)
        if (entry && entry.expiresAt && Date.now() > entry.expiresAt) {
          store.delete(key)
        }
        const current = store.get(key)
        const newVal = current ? Number.parseInt(current.value, 10) + 1 : 1
        store.set(key, {
          value: String(newVal),
          expiresAt: current?.expiresAt ?? null,
        })
        return newVal
      }),
    exists: (key) =>
      Effect.sync(() => store.has(key)),
    acquireLock: () => Effect.succeed(true),
    releaseLock: () => Effect.void,
    expire: (key, ttlSeconds) =>
      Effect.sync(() => {
        const entry = store.get(key)
        if (entry) {
          entry.expiresAt = Date.now() + ttlSeconds * 1000
        }
      }),
    getOrSet: (key, factory, ttlSeconds) =>
      Effect.gen(function* () {
        const entry = store.get(key)
        if (entry) return entry.value
        const value = yield* factory()
        store.set(key, {
          value,
          expiresAt: Date.now() + ttlSeconds * 1000,
        })
        return value
      }),
    sadd: () => Effect.succeed(1),
    srem: () => Effect.succeed(1),
    smembers: () => Effect.succeed([]),
    scard: () => Effect.succeed(0),
    hset: () => Effect.void,
    hgetall: () => Effect.succeed({}),
    hmset: () => Effect.void,
    hdel: () => Effect.void,
  })
}

describe("checkMessageRateLimit", () => {
  it("should allow messages within rate limit", async () => {
    const layer = makeInMemoryCacheLayer()
    const playerId = "player-1"

    const results = await Effect.runPromise(
      Effect.gen(function* () {
        const checks: boolean[] = []
        for (let i = 0; i < 10; i++) {
          checks.push(yield* checkMessageRateLimit(playerId, "movement"))
        }
        return checks
      }).pipe(Effect.provide(layer)),
    )

    // All 10 should pass (limit is 20/s for movement)
    expect(results.every((r) => r)).toBe(true)
  })

  it("should reject messages exceeding per-tag limit", async () => {
    const layer = makeInMemoryCacheLayer()
    const playerId = "player-2"

    const results = await Effect.runPromise(
      Effect.gen(function* () {
        const checks: boolean[] = []
        // Movement limit is 20/s
        for (let i = 0; i < 25; i++) {
          checks.push(yield* checkMessageRateLimit(playerId, "movement"))
        }
        return checks
      }).pipe(Effect.provide(layer)),
    )

    // First 20 pass, next 5 fail
    expect(results.slice(0, 20).every((r) => r)).toBe(true)
    expect(results.slice(20).every((r) => !r)).toBe(true)
  })

  it("should apply separate limits per message type", async () => {
    const layer = makeInMemoryCacheLayer()
    const playerId = "player-3"

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        // Send 15 movements (within 20/s limit)
        for (let i = 0; i < 15; i++) {
          yield* checkMessageRateLimit(playerId, "movement")
        }

        // Chat should still be allowed (separate counter)
        const chatAllowed = yield* checkMessageRateLimit(playerId, "chat")
        return chatAllowed
      }).pipe(Effect.provide(layer)),
    )

    expect(result).toBe(true)
  })

  it("should enforce global rate limit across all types", async () => {
    const layer = makeInMemoryCacheLayer()
    const playerId = "player-4"

    const results = await Effect.runPromise(
      Effect.gen(function* () {
        const checks: boolean[] = []
        // Global limit is 100/s, send 105 messages across types
        for (let i = 0; i < 105; i++) {
          // Alternate between movement types to avoid per-tag limits
          const tag = i % 5 === 0 ? "chat" : i % 3 === 0 ? "item_use" : "movement"
          checks.push(yield* checkMessageRateLimit(playerId, tag))
        }
        return checks
      }).pipe(Effect.provide(layer)),
    )

    // At some point global limit should kick in
    const passed = results.filter((r) => r).length
    expect(passed).toBeLessThanOrEqual(100)
  })
})
