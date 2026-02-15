import { Context, Effect, Layer, Ref } from "effect"
import { TICK_RATE } from "@sao/shared"
import { GameState } from "./game-state.js"
import { processTick } from "./tick-pipeline.js"

export class GameLoopService extends Context.Tag("GameLoopService")<
  GameLoopService,
  {
    readonly start: () => Effect.Effect<void>
    readonly stop: () => Effect.Effect<void>
    readonly getTick: () => Effect.Effect<number>
  }
>() {}

export const GameLoopServiceLive = Layer.effect(
  GameLoopService,
  Effect.gen(function* () {
    const gameState = yield* GameState
    const ctx = yield* Effect.context<GameState>()
    const intervalRef = yield* Ref.make<ReturnType<typeof setInterval> | null>(null)

    const tickRate = TICK_RATE
    const tickMs = Math.floor(1000 / tickRate)
    let lastTickTime = 0

    return {
      start: () =>
        Effect.gen(function* () {
          lastTickTime = Date.now()

          const intervalId = setInterval(() => {
            const now = Date.now()
            const deltaMs = now - lastTickTime
            lastTickTime = now

            void Effect.runPromise(
              Effect.gen(function* () {
                const start = performance.now()

                yield* processTick(deltaMs)
                yield* Ref.update(gameState.tickRef, (n) => n + 1)

                const elapsed = performance.now() - start
                if (elapsed > tickMs) {
                  yield* Effect.logWarning(
                    `Tick took ${elapsed.toFixed(1)}ms (budget: ${tickMs}ms)`,
                  )
                }
              }).pipe(Effect.provide(ctx)),
            )
          }, tickMs)

          yield* Ref.set(intervalRef, intervalId)
          yield* Effect.logInfo(`Game loop started at ${tickRate}Hz (${tickMs}ms per tick)`)
        }),

      stop: () =>
        Effect.gen(function* () {
          const intervalId = yield* Ref.get(intervalRef)
          if (intervalId) {
            clearInterval(intervalId)
            yield* Ref.set(intervalRef, null)
          }
          yield* Effect.logInfo("Game loop stopped")
        }),

      getTick: () => gameState.getTick(),
    }
  }),
)
