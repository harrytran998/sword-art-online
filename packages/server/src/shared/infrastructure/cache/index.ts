import { Context, Effect, Layer } from "effect"
import Redis from "ioredis"

export class CacheService extends Context.Tag("CacheService")<
  CacheService,
  {
    readonly get: (key: string) => Effect.Effect<string | null>
    readonly set: (key: string, value: string, ttlSeconds?: number) => Effect.Effect<void>
    readonly del: (key: string) => Effect.Effect<void>
    readonly increment: (key: string) => Effect.Effect<number>
  }
>() {}

export const CacheServiceLive = Layer.effect(
  CacheService,
  Effect.gen(function* () {
    const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379")

    return {
      get: (key) => Effect.tryPromise(() => redis.get(key)),
      set: (key, value, ttlSeconds) =>
        Effect.tryPromise(() =>
          ttlSeconds ? redis.setex(key, ttlSeconds, value) : redis.set(key, value),
        ).pipe(Effect.asVoid),
      del: (key) => Effect.tryPromise(() => redis.del(key)).pipe(Effect.asVoid),
      increment: (key) => Effect.tryPromise(() => redis.incr(key)),
    }
  }),
)
