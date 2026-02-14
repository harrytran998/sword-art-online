import { Context, Effect, Layer } from "effect"

export class GameLoopService extends Context.Tag("GameLoopService")<
  GameLoopService,
  {
    readonly start: () => Effect.Effect<void>
    readonly stop: () => Effect.Effect<void>
  }
>() {}

export const GameLoopServiceLive = Layer.effect(
  GameLoopService,
  Effect.sync(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    return {
      start: () =>
        Effect.sync(() => {
          const tickRate = Number(process.env.GAME_TICK_RATE ?? 60)
          const tickMs = Math.floor(1000 / tickRate)

          intervalId = setInterval(() => {
            // TODO: Implement tick pipeline in Sprint 3
          }, tickMs)
        }),

      stop: () =>
        Effect.sync(() => {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
        }),
    }
  }),
)
