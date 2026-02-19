import { Context, Effect, Layer } from "effect"
import Redis from "ioredis"

export class CacheService extends Context.Tag("CacheService")<
  CacheService,
  {
    readonly get: (key: string) => Effect.Effect<string | null>
    readonly set: (key: string, value: string, ttlSeconds?: number) => Effect.Effect<void>
    readonly del: (key: string) => Effect.Effect<void>
    readonly increment: (key: string) => Effect.Effect<number>
    readonly exists: (key: string) => Effect.Effect<boolean>
    readonly expire: (key: string, ttlSeconds: number) => Effect.Effect<void>
    readonly getOrSet: (
      key: string,
      factory: () => Effect.Effect<string>,
      ttlSeconds: number,
    ) => Effect.Effect<string>
    // SET operations
    readonly sadd: (key: string, ...members: string[]) => Effect.Effect<number>
    readonly srem: (key: string, ...members: string[]) => Effect.Effect<number>
    readonly smembers: (key: string) => Effect.Effect<string[]>
    readonly scard: (key: string) => Effect.Effect<number>
    // HASH operations
    readonly hset: (key: string, field: string, value: string) => Effect.Effect<void>
    readonly hgetall: (key: string) => Effect.Effect<Record<string, string>>
    readonly hmset: (key: string, data: Record<string, string>) => Effect.Effect<void>
    readonly hdel: (key: string, ...fields: string[]) => Effect.Effect<void>
  }
>() {}

export const CacheServiceLive = Layer.effect(
  CacheService,
  Effect.sync(() => {
    const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379")

    return {
      get: (key) => Effect.tryPromise(() => redis.get(key)).pipe(Effect.orDie),
      set: (key, value, ttlSeconds) =>
        Effect.tryPromise(() =>
          ttlSeconds ? redis.setex(key, ttlSeconds, value) : redis.set(key, value),
        ).pipe(Effect.asVoid, Effect.orDie),
      del: (key) => Effect.tryPromise(() => redis.del(key)).pipe(Effect.asVoid, Effect.orDie),
      increment: (key) => Effect.tryPromise(() => redis.incr(key)).pipe(Effect.orDie),
      exists: (key) =>
        Effect.tryPromise(() => redis.exists(key)).pipe(Effect.map((v) => v === 1), Effect.orDie),
      expire: (key, ttlSeconds) =>
        Effect.tryPromise(() => redis.expire(key, ttlSeconds)).pipe(Effect.asVoid, Effect.orDie),
      getOrSet: (key, factory, ttlSeconds) =>
        Effect.gen(function* () {
          const cached = yield* Effect.tryPromise(() => redis.get(key)).pipe(Effect.orDie)
          if (cached !== null) return cached
          const value = yield* factory()
          yield* Effect.tryPromise(() => redis.setex(key, ttlSeconds, value)).pipe(Effect.orDie)
          return value
        }),
      // SET operations
      sadd: (key, ...members) =>
        Effect.tryPromise(() => redis.sadd(key, ...members)).pipe(Effect.orDie),
      srem: (key, ...members) =>
        Effect.tryPromise(() => redis.srem(key, ...members)).pipe(Effect.orDie),
      smembers: (key) =>
        Effect.tryPromise(() => redis.smembers(key)).pipe(Effect.orDie),
      scard: (key) =>
        Effect.tryPromise(() => redis.scard(key)).pipe(Effect.orDie),
      // HASH operations
      hset: (key, field, value) =>
        Effect.tryPromise(() => redis.hset(key, field, value)).pipe(Effect.asVoid, Effect.orDie),
      hgetall: (key) =>
        Effect.tryPromise(() => redis.hgetall(key)).pipe(Effect.orDie),
      hmset: (key, data) =>
        Effect.tryPromise(() => redis.hmset(key, data)).pipe(Effect.asVoid, Effect.orDie),
      hdel: (key, ...fields) =>
        Effect.tryPromise(() => redis.hdel(key, ...fields)).pipe(Effect.asVoid, Effect.orDie),
    }
  }),
)
