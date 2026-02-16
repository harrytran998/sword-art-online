import { describe, expect, it } from "bun:test"
import { Effect, Ref } from "effect"
import { EventBus, InMemoryEventBusLive } from "../index"
import type { DomainEvent } from "../../../kernel/events"

const runWithEventBus = <A, E>(
  effect: Effect.Effect<A, E, EventBus>,
): Promise<A> => Effect.runPromise(Effect.provide(effect, InMemoryEventBusLive))

interface TestEvent extends DomainEvent {
  readonly _tag: "TestEvent"
}

interface EventA extends DomainEvent {
  readonly _tag: "EventA"
}

interface EventB extends DomainEvent {
  readonly _tag: "EventB"
}

describe("InMemoryEventBus", () => {
  it("should deliver event to subscriber", async () => {
    const result = await runWithEventBus(
      Effect.gen(function* () {
        const bus = yield* EventBus
        const received = yield* Ref.make<TestEvent[]>([])

        yield* bus.subscribe<TestEvent>("TestEvent", (event) =>
          Ref.update(received, (events) => [...events, event]),
        )

        yield* bus.publish<TestEvent>({
          _tag: "TestEvent",
          timestamp: new Date(),
          aggregateId: "123",
        })

        return yield* Ref.get(received)
      }),
    )

    expect(result).toHaveLength(1)
    expect(result[0]?._tag).toBe("TestEvent")
    expect(result[0]?.aggregateId).toBe("123")
  })

  it("should deliver event to multiple subscribers", async () => {
    const result = await runWithEventBus(
      Effect.gen(function* () {
        const bus = yield* EventBus
        const countA = yield* Ref.make(0)
        const countB = yield* Ref.make(0)

        yield* bus.subscribe<TestEvent>("TestEvent", () =>
          Ref.update(countA, (n) => n + 1),
        )
        yield* bus.subscribe<TestEvent>("TestEvent", () =>
          Ref.update(countB, (n) => n + 1),
        )

        yield* bus.publish<TestEvent>({
          _tag: "TestEvent",
          timestamp: new Date(),
          aggregateId: "456",
        })

        const a = yield* Ref.get(countA)
        const b = yield* Ref.get(countB)
        return { a, b }
      }),
    )

    expect(result.a).toBe(1)
    expect(result.b).toBe(1)
  })

  it("should not trigger handler for unrelated events", async () => {
    const result = await runWithEventBus(
      Effect.gen(function* () {
        const bus = yield* EventBus
        const count = yield* Ref.make(0)

        yield* bus.subscribe<EventA>("EventA", () =>
          Ref.update(count, (n) => n + 1),
        )

        yield* bus.publish<EventB>({
          _tag: "EventB",
          timestamp: new Date(),
          aggregateId: "789",
        })

        return yield* Ref.get(count)
      }),
    )

    expect(result).toBe(0)
  })
})
