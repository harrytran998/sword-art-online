import { Context, Effect, Layer } from "effect"
import { CacheService } from "../../../../shared/infrastructure/cache/index"

export class InventoryLockError extends Error {
  readonly _tag = "InventoryLockError"
  constructor(public readonly characterId: string) {
    super(`Could not acquire lock for inventory of character ${characterId}`)
  }
}

export class InventoryLock extends Context.Tag("InventoryLock")<
  InventoryLock,
  {
    readonly withLock: <R, E, A>(
      characterId: string,
      effect: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | InventoryLockError, R>
  }
>() {}

export const InventoryLockLive = Layer.effect(
  InventoryLock,
  Effect.gen(function* () {
    const cache = yield* CacheService

    return {
      withLock: <R, E, A>(characterId: string, effect: Effect.Effect<A, E, R>) =>
        Effect.gen(function* () {
          const lockKey = `inventory:lock:${characterId}`
          
          // Try to acquire lock for 5 seconds
          const acquired = yield* cache.acquireLock(lockKey, 5)
          if (!acquired) {
            return yield* Effect.fail(new InventoryLockError(characterId))
          }

          try {
            return yield* effect
          } finally {
            // Ensure lock is released even if effect fails or dies
            yield* Effect.catchAllCause(
              cache.releaseLock(lockKey),
              () => Effect.void
            )
          }
        }),
    }
  }),
)
