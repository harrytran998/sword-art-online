import { Context, Effect, Layer, Queue, Ref } from "effect"
import type { DomainEvent } from "../../kernel/events.js"

type EventHandler = (event: DomainEvent) => Effect.Effect<void>

export class EventBus extends Context.Tag("EventBus")<
  EventBus,
  {
    readonly publish: (event: DomainEvent) => Effect.Effect<void>
    readonly subscribe: (eventTag: string, handler: EventHandler) => Effect.Effect<void>
  }
>() {}

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
          updated.set(eventTag, [...existing, handler])
          return updated
        }),
    }
  }),
)
