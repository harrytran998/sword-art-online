import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test"
import Redis from "ioredis"

const REDIS_URL = "redis://localhost:6379"
const PREFIX = `test:cache:${Date.now()}:`
const isCI = !!process.env.CI

let redis: Redis

const keys: string[] = []
const key = (name: string) => {
  const k = `${PREFIX}${name}`
  keys.push(k)
  return k
}

beforeAll(() => {
  if (isCI) return
  redis = new Redis(REDIS_URL)
})

afterEach(async () => {
  if (isCI || keys.length === 0) return
  await redis.del(...keys)
  keys.length = 0
})

afterAll(() => {
  if (isCI) return
  redis.disconnect()
})

describe.skipIf(isCI)("Cache integration", () => {
  it("should set and get a value", async () => {
    const k = key("set-get")
    await redis.set(k, "hello")
    const value = await redis.get(k)
    expect(value).toBe("hello")
  })

  it("should return null for missing key", async () => {
    const value = await redis.get(key("nonexistent"))
    expect(value).toBeNull()
  })

  it("should check key existence", async () => {
    const k = key("exists")
    await redis.set(k, "value")

    const exists = await redis.exists(k)
    expect(exists).toBe(1)

    const missing = await redis.exists(key("missing"))
    expect(missing).toBe(0)
  })

  it("should expire a key with TTL", async () => {
    const k = key("expire")
    await redis.set(k, "temporary")
    await redis.expire(k, 1)

    const before = await redis.get(k)
    expect(before).toBe("temporary")

    await Bun.sleep(1100)

    const after = await redis.get(k)
    expect(after).toBeNull()
  })

  it("should delete a key", async () => {
    const k = key("del")
    await redis.set(k, "to-delete")

    const deleted = await redis.del(k)
    expect(deleted).toBe(1)

    const value = await redis.get(k)
    expect(value).toBeNull()
  })

  it("should set with TTL using setex", async () => {
    const k = key("setex")
    await redis.setex(k, 1, "with-ttl")

    const value = await redis.get(k)
    expect(value).toBe("with-ttl")

    const ttl = await redis.ttl(k)
    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(1)
  })
})
