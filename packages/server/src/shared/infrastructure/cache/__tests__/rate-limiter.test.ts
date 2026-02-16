import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { checkRateLimit } from "../rate-limiter"
import { CacheService } from "../index"

interface CacheEntry {
  value: string
  expireAt: number | undefined
}

const makeInMemoryCache = () => {
  const store = new Map<string, CacheEntry>()

  return Layer.succeed(CacheService, {
    get: (key: string) =>
      Effect.sync(() => {
        const entry = store.get(key)
        if (!entry) return null
        if (entry.expireAt !== undefined && Date.now() > entry.expireAt) {
          store.delete(key)
          return null
        }
        return entry.value
      }),
    set: (key: string, value: string, ttlSeconds?: number) =>
      Effect.sync(() => {
        store.set(key, {
          value,
          expireAt: ttlSeconds !== undefined ? Date.now() + ttlSeconds * 1000 : undefined,
        })
      }),
    del: (key: string) =>
      Effect.sync(() => {
        store.delete(key)
      }),
    increment: (key: string) =>
      Effect.sync(() => {
        const entry = store.get(key)
        const current = entry ? Number(entry.value) : 0
        const next = current + 1
        store.set(key, { value: String(next), expireAt: entry?.expireAt ?? undefined })
        return next
      }),
    exists: (key: string) =>
      Effect.sync(() => store.has(key)),
    expire: (key: string, ttlSeconds: number) =>
      Effect.sync(() => {
        const entry = store.get(key)
        if (entry) {
          entry.expireAt = Date.now() + ttlSeconds * 1000
        }
      }),
    getOrSet: (key: string, factory: () => Effect.Effect<string>, ttlSeconds: number) =>
      Effect.gen(function* () {
        const entry = store.get(key)
        if (entry) return entry.value
        const value = yield* factory()
        store.set(key, {
          value,
          expireAt: Date.now() + ttlSeconds * 1000,
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

describe("checkRateLimit", () => {
  it("should allow requests within limit", async () => {
    const cache = makeInMemoryCache()

    const result = await Effect.runPromise(
      Effect.provide(checkRateLimit("test:user1", 5, 60), cache),
    )

    expect(result).toBe(true)
  })

  it("should reject requests exceeding limit", async () => {
    const cache = makeInMemoryCache()

    const results = await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const outcomes: boolean[] = []
          for (let i = 0; i < 7; i++) {
            outcomes.push(yield* checkRateLimit("test:user2", 5, 60))
          }
          return outcomes
        }),
        cache,
      ),
    )

    expect(results.slice(0, 5).every((r) => r === true)).toBe(true)
    expect(results[5]).toBe(false)
    expect(results[6]).toBe(false)
  })
})
