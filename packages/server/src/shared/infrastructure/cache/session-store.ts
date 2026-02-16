import { Effect } from "effect"
import { CacheService } from "./index"

const SESSION_PREFIX = "session:"

export const setSession = (
  token: string,
  data: Record<string, unknown>,
  ttlSeconds: number,
): Effect.Effect<void, never, CacheService> =>
  Effect.gen(function* () {
    const cache = yield* CacheService
    yield* cache.set(`${SESSION_PREFIX}${token}`, JSON.stringify(data), ttlSeconds)
  })

export const getSession = (
  token: string,
): Effect.Effect<Record<string, unknown> | null, never, CacheService> =>
  Effect.gen(function* () {
    const cache = yield* CacheService
    const raw = yield* cache.get(`${SESSION_PREFIX}${token}`)
    if (!raw) return null
    return JSON.parse(raw) as Record<string, unknown>
  })

export const deleteSession = (
  token: string,
): Effect.Effect<void, never, CacheService> =>
  Effect.gen(function* () {
    const cache = yield* CacheService
    yield* cache.del(`${SESSION_PREFIX}${token}`)
  })
