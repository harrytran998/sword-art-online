import { Effect, Layer } from "effect"
import { CooldownRepository } from "../../ports/outbound/cooldown.repository"
import { CacheService } from "../../../../shared/infrastructure/cache/index"
import type { PlayerId } from "../../../../shared/kernel/types"

const COOLDOWN_PREFIX = "skill_cd"

const cooldownKey = (playerId: PlayerId, skillId: number): string =>
  `${COOLDOWN_PREFIX}:${playerId}:${skillId}`

export const RedisCooldownRepositoryLive = Layer.effect(
  CooldownRepository,
  Effect.gen(function* () {
    const cache = yield* CacheService

    return {
      setCooldown: (playerId: PlayerId, skillId: number, durationMs: number) =>
        cache.set(
          cooldownKey(playerId, skillId),
          String(Date.now() + durationMs),
          Math.ceil(durationMs / 1000),
        ),

      getCooldownRemaining: (playerId: PlayerId, skillId: number) =>
        cache.get(cooldownKey(playerId, skillId)).pipe(
          Effect.map((val) => {
            if (!val) return 0
            const expiresAt = Number(val)
            return Math.max(0, expiresAt - Date.now())
          }),
        ),

      isOnCooldown: (playerId: PlayerId, skillId: number) =>
        cache.exists(cooldownKey(playerId, skillId)),
    }
  }),
)
