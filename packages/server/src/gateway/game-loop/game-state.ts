import { Context, Effect, Layer, Ref } from "effect"

export class GameState extends Context.Tag("GameState")<
  GameState,
  {
    readonly tickRef: Ref.Ref<number>
    readonly getTick: () => Effect.Effect<number>
  }
>() {}

export const GameStateLive = Layer.effect(
  GameState,
  Effect.gen(function* () {
    const tickRef = yield* Ref.make(0)

    return {
      tickRef,
      getTick: () => Ref.get(tickRef),
    }
  }),
)
