import { Context, Effect, Layer } from "effect"
import { SUSPICION_THRESHOLD } from "@sao/shared"
import { CacheService } from "../../shared/infrastructure/cache/index.js"
import { logSecurityEvent, SecurityEventType } from "./security-logger.js"

const SUSPICION_TTL_S = 300 // 5 minutes

export class SuspicionTracker extends Context.Tag("SuspicionTracker")<
  SuspicionTracker,
  {
    readonly addSuspicion: (playerId: string, points: number) => Effect.Effect<number>
    readonly getSuspicion: (playerId: string) => Effect.Effect<number>
  }
>() {}

export const SuspicionTrackerLive = Layer.effect(
  SuspicionTracker,
  Effect.gen(function* () {
    const cache = yield* CacheService

    const suspicionKey = (playerId: string) => `suspicion:${playerId}`

    return {
      addSuspicion: (playerId, points) =>
        Effect.gen(function* () {
          const key = suspicionKey(playerId)
          const current = yield* cache.get(key)
          const newScore = (current ? Number.parseInt(current, 10) : 0) + points
          yield* cache.set(key, String(newScore), SUSPICION_TTL_S)

          if (newScore >= SUSPICION_THRESHOLD) {
            yield* logSecurityEvent({
              type: SecurityEventType.SUSPICION_THRESHOLD,
              playerId,
              severity: "critical",
              data: { score: newScore, threshold: SUSPICION_THRESHOLD },
            })
          }

          return newScore
        }),

      getSuspicion: (playerId) =>
        Effect.gen(function* () {
          const value = yield* cache.get(suspicionKey(playerId))
          return value ? Number.parseInt(value, 10) : 0
        }),
    }
  }),
)
