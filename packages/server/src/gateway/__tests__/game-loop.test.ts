import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { GameLoopService, GameLoopServiceLive } from "../game-loop/game-loop.js"
import { GameStateLive } from "../game-loop/game-state.js"

const TestGameLoopLayer = GameLoopServiceLive.pipe(
  Layer.provide(GameStateLive),
)

describe("GameLoopService", () => {
  it("should increment tick counter over time", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const loop = yield* GameLoopService

        yield* loop.start()

        // Wait ~500ms for ticks to accumulate
        yield* Effect.sleep("500 millis")

        const tick = yield* loop.getTick()

        yield* loop.stop()

        return tick
      }).pipe(Effect.provide(TestGameLoopLayer)),
    )

    // At 60Hz, 500ms should give ~30 ticks (allow tolerance 15-45)
    expect(result).toBeGreaterThan(15)
    expect(result).toBeLessThan(45)
  })

  it("should stop incrementing after stop", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const loop = yield* GameLoopService

        yield* loop.start()
        yield* Effect.sleep("200 millis")
        yield* loop.stop()

        const tickAtStop = yield* loop.getTick()

        yield* Effect.sleep("200 millis")
        const tickAfterWait = yield* loop.getTick()

        return { tickAtStop, tickAfterWait }
      }).pipe(Effect.provide(TestGameLoopLayer)),
    )

    // Should be the same or very close after stopping
    expect(result.tickAfterWait).toBe(result.tickAtStop)
  })
})
