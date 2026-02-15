import { Effect } from "effect"
import {
  RATE_LIMIT_MOVEMENT_MAX,
  RATE_LIMIT_MOVEMENT_WINDOW_S,
  RATE_LIMIT_CHAT_MAX,
  RATE_LIMIT_CHAT_WINDOW_S,
  RATE_LIMIT_SKILL_MAX,
  RATE_LIMIT_SKILL_WINDOW_S,
  RATE_LIMIT_GLOBAL_MAX,
  RATE_LIMIT_GLOBAL_WINDOW_S,
} from "@sao/shared"
import { checkRateLimit } from "../../shared/infrastructure/cache/rate-limiter.js"
import type { CacheService } from "../../shared/infrastructure/cache/index.js"

interface RateLimitConfig {
  readonly max: number
  readonly windowS: number
}

const TAG_LIMITS: Record<string, RateLimitConfig> = {
  movement: { max: RATE_LIMIT_MOVEMENT_MAX, windowS: RATE_LIMIT_MOVEMENT_WINDOW_S },
  chat: { max: RATE_LIMIT_CHAT_MAX, windowS: RATE_LIMIT_CHAT_WINDOW_S },
  skill_activate: { max: RATE_LIMIT_SKILL_MAX, windowS: RATE_LIMIT_SKILL_WINDOW_S },
  skill_cancel: { max: RATE_LIMIT_SKILL_MAX, windowS: RATE_LIMIT_SKILL_WINDOW_S },
}

const DEFAULT_LIMIT: RateLimitConfig = { max: 30, windowS: 1 }

export const checkMessageRateLimit = (
  playerId: string,
  tag: string,
): Effect.Effect<boolean, never, CacheService> =>
  Effect.gen(function* () {
    const config = TAG_LIMITS[tag] ?? DEFAULT_LIMIT

    const tagAllowed = yield* checkRateLimit(
      `${playerId}:${tag}`,
      config.max,
      config.windowS,
    )

    if (!tagAllowed) return false

    const globalAllowed = yield* checkRateLimit(
      `${playerId}:global`,
      RATE_LIMIT_GLOBAL_MAX,
      RATE_LIMIT_GLOBAL_WINDOW_S,
    )

    return globalAllowed
  })
