import { Context, Effect, Layer, Ref } from "effect"
import type { DomainEvent } from "../../kernel/events"

export class EventBus extends Context.Tag("EventBus")<
  EventBus,
  {
    readonly publish: <E extends DomainEvent>(event: E) => Effect.Effect<void>
    readonly subscribe: <E extends DomainEvent>(
      eventTag: E["_tag"],
      handler: (event: E) => Effect.Effect<void>,
    ) => Effect.Effect<void>
  }
>() {}

type EventHandler = (event: DomainEvent) => Effect.Effect<void>

export const InMemoryEventBusLive = Layer.effect(
  EventBus,
  Effect.gen(function* () {
    const handlers = yield* Ref.make<Map<string, EventHandler[]>>(new Map())

    return {
      publish: (event) =>
        Effect.gen(function* () {
          const map = yield* Ref.get(handlers)
          const eventHandlers = map.get(event._tag) ?? []
          for (const handler of eventHandlers) {
            yield* handler(event)
          }
        }),
      subscribe: (eventTag, handler) =>
        Ref.update(handlers, (map) => {
          const existing = map.get(eventTag) ?? []
          const updated = new Map(map)
          updated.set(eventTag, [...existing, handler as EventHandler])
          return updated
        }),
    }
  }),
)
