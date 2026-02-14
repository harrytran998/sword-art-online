import { Effect } from "effect"
import { CacheService } from "./index.js"

export const checkRateLimit = (
  key: string,
  maxTokens: number,
  windowSeconds: number,
): Effect.Effect<boolean, never, CacheService> =>
  Effect.gen(function* () {
    const cache = yield* CacheService
    const count = yield* cache.increment(`rl:${key}`)
    if (count === 1) {
      yield* cache.expire(`rl:${key}`, windowSeconds)
    }
    return count <= maxTokens
  })
