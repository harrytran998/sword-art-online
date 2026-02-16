import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { validateMovement } from "../application/validate-movement.use-case"
import { ZoneStateRepository, type PlayerZoneState } from "../ports/outbound/zone-state.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { SuspicionTracker } from "../../../shared/infrastructure/security/suspicion-tracker"
import type { PlayerId, ZoneId } from "../../../shared/kernel/types"
import type { DomainEvent } from "../../../shared/kernel/events"

const TEST_PLAYER = "player-1" as PlayerId
const TEST_ZONE = "floor_1_town" as ZoneId

const makePlayerState = (
  x: number,
  y: number,
  z: number,
  lastUpdate = Date.now(),
): PlayerZoneState => ({
  playerId: TEST_PLAYER,
  zoneId: TEST_ZONE,
  position: { x, y, z },
  rotation: 0,
  lastUpdate,
})

const makeMockRepo = (initialState: PlayerZoneState | null = null) => {
  const stateRef = { current: initialState }

  return {
    layer: Layer.succeed(ZoneStateRepository, {
      getPlayerState: (id: PlayerId) =>
        Effect.succeed(id === TEST_PLAYER ? stateRef.current : null),
      setPlayerState: (state: PlayerZoneState) =>
        Effect.sync(() => {
          stateRef.current = state
        }),
      removePlayer: () => Effect.void,
      getPlayersInZone: () => Effect.succeed([]),
      getPlayerZoneId: () => Effect.succeed(null),
      getActiveZoneIds: () => Effect.succeed([]),
    }),
    stateRef,
  }
}

const makeMockEventBus = () => {
  const events: DomainEvent[] = []
  return {
    layer: Layer.succeed(EventBus, {
      publish: (event: DomainEvent) =>
        Effect.sync(() => {
          events.push(event)
        }),
      subscribe: () => Effect.void,
    }),
    events,
  }
}

const makeMockSuspicion = () => {
  const scores: Record<string, number> = {}
  return {
    layer: Layer.succeed(SuspicionTracker, {
      addSuspicion: (playerId: string, points: number) =>
        Effect.sync(() => {
          scores[playerId] = (scores[playerId] ?? 0) + points
          return scores[playerId]!
        }),
      getSuspicion: (playerId: string) =>
        Effect.succeed(scores[playerId] ?? 0),
    }),
    scores,
  }
}

const runMovement = (
  state: PlayerZoneState | null,
  msg: { x: number; y: number; z: number; rotation: number; timestamp: number },
) => {
  const { layer: repoLayer, stateRef } = makeMockRepo(state)
  const { layer: busLayer, events } = makeMockEventBus()
  const { layer: suspicionLayer, scores } = makeMockSuspicion()
  const testLayer = Layer.mergeAll(repoLayer, busLayer, suspicionLayer)

  return {
    result: Effect.runPromiseExit(
      Effect.provide(validateMovement(TEST_PLAYER, msg), testLayer),
    ),
    stateRef,
    events,
    scores,
  }
}

describe("validateMovement", () => {
  it("should accept valid movement within speed limit", async () => {
    const now = Date.now()
    const state = makePlayerState(0, 0, 0, now - 100) // 100ms ago
    const { result, events, stateRef } = runMovement(state, {
      x: 0.5,
      y: 0,
      z: 0.5,
      rotation: 0,
      timestamp: now,
    })

    const exit = await result
    expect(exit._tag).toBe("Success")
    expect(events).toHaveLength(1)
    expect(events[0]?._tag).toBe("PlayerMoved")
    expect(stateRef.current?.position.x).toBe(0.5)
  })

  it("should reject speed hack (excessive distance)", async () => {
    const now = Date.now()
    const state = makePlayerState(0, 0, 0, now - 100)
    const { result, events, scores } = runMovement(state, {
      x: 50,
      y: 0,
      z: 50,
      rotation: 0,
      timestamp: now,
    })

    const exit = await result
    expect(exit._tag).toBe("Failure")
    expect(events).toHaveLength(0)
    expect(scores[TEST_PLAYER]).toBeGreaterThan(0)
  })

  it("should reject teleport (extreme jump)", async () => {
    const now = Date.now()
    const state = makePlayerState(0, 0, 0, now - 100)
    const { result, events, scores } = runMovement(state, {
      x: 100,
      y: 0,
      z: 100,
      rotation: 0,
      timestamp: now,
    })

    const exit = await result
    expect(exit._tag).toBe("Failure")
    expect(events).toHaveLength(0)
    expect(scores[TEST_PLAYER]).toBe(50) // SUSPICION_TELEPORT_PENALTY
  })

  it("should fail when player is not in any zone", async () => {
    const now = Date.now()
    const { result } = runMovement(null, {
      x: 1,
      y: 0,
      z: 1,
      rotation: 0,
      timestamp: now,
    })

    const exit = await result
    expect(exit._tag).toBe("Failure")
  })

  it("should accept multiple sequential valid movements", async () => {
    // Start 1 second ago so first movement has enough time budget
    const { layer: repoLayer } = makeMockRepo(
      makePlayerState(0, 0, 0, Date.now() - 1000),
    )
    const { layer: busLayer, events } = makeMockEventBus()
    const { layer: suspicionLayer } = makeMockSuspicion()
    const testLayer = Layer.mergeAll(repoLayer, busLayer, suspicionLayer)

    // First movement - small step (well within speed limit at 1s deltaTime)
    const exit1 = await Effect.runPromiseExit(
      Effect.provide(
        validateMovement(TEST_PLAYER, {
          x: 1,
          y: 0,
          z: 0,
          rotation: 0,
          timestamp: Date.now(),
        }),
        testLayer,
      ),
    )
    expect(exit1._tag).toBe("Success")

    // Wait a bit so deltaTime is meaningful
    await new Promise((r) => setTimeout(r, 50))

    // Second movement - another small step
    const exit2 = await Effect.runPromiseExit(
      Effect.provide(
        validateMovement(TEST_PLAYER, {
          x: 1.1,
          y: 0,
          z: 0,
          rotation: 0,
          timestamp: Date.now(),
        }),
        testLayer,
      ),
    )
    expect(exit2._tag).toBe("Success")
    expect(events).toHaveLength(2)
  })
})
