import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { decodeClientMessage, routeMessage } from "../websocket/message-router.js"
import { WorldPort } from "../../modules/world/ports/inbound/world.port.js"
import type { PlayerId } from "../../shared/kernel/types.js"

const TEST_PLAYER = "player-1" as PlayerId

const makeMockWorldPort = () => {
  const movements: Array<{ playerId: string; x: number; y: number; z: number }> = []

  return {
    layer: Layer.succeed(WorldPort, {
      handleMovement: (playerId, msg) =>
        Effect.sync(() => {
          movements.push({ playerId, x: msg.x, y: msg.y, z: msg.z })
        }),
      getPlayerPosition: () => Effect.succeed(null),
      getPlayersInZone: () => Effect.succeed([]),
      setPlayerZone: () => Effect.void,
      removePlayer: () => Effect.void,
    }),
    movements,
  }
}

describe("decodeClientMessage", () => {
  it("should decode valid movement message", async () => {
    const result = await Effect.runPromise(
      decodeClientMessage({
        _tag: "movement",
        x: 1,
        y: 0,
        z: 1,
        rotation: 0,
        timestamp: Date.now(),
      }),
    )
    expect(result._tag).toBe("movement")
  })

  it("should decode valid heartbeat message", async () => {
    const result = await Effect.runPromise(
      decodeClientMessage({
        _tag: "heartbeat",
        timestamp: Date.now(),
      }),
    )
    expect(result._tag).toBe("heartbeat")
  })

  it("should reject message with unknown _tag", async () => {
    const result = await Effect.runPromiseExit(
      decodeClientMessage({
        _tag: "unknown_type",
        data: "foo",
      }),
    )
    expect(result._tag).toBe("Failure")
  })

  it("should reject malformed movement (missing fields)", async () => {
    const result = await Effect.runPromiseExit(
      decodeClientMessage({
        _tag: "movement",
        x: 1,
        // missing y, z, rotation, timestamp
      }),
    )
    expect(result._tag).toBe("Failure")
  })
})

describe("routeMessage", () => {
  it("should route movement to WorldPort", async () => {
    const { layer, movements } = makeMockWorldPort()

    await Effect.runPromise(
      Effect.provide(
        routeMessage(
          { _tag: "movement", x: 5, y: 0, z: 3, rotation: 0, timestamp: Date.now() },
          TEST_PLAYER,
        ),
        layer,
      ),
    )

    expect(movements).toHaveLength(1)
    expect(movements[0]?.x).toBe(5)
    expect(movements[0]?.z).toBe(3)
  })

  it("should return heartbeat_ack for heartbeat", async () => {
    const { layer } = makeMockWorldPort()
    const now = Date.now()

    const result = await Effect.runPromise(
      Effect.provide(
        routeMessage({ _tag: "heartbeat", timestamp: now }, TEST_PLAYER),
        layer,
      ),
    )

    expect(result).toBeDefined()
    expect((result as { _tag: string })._tag).toBe("heartbeat_ack")
    expect((result as { serverTime: number }).serverTime).toBeGreaterThan(0)
  })

  it("should handle unimplemented message types gracefully", async () => {
    const { layer } = makeMockWorldPort()

    const result = await Effect.runPromiseExit(
      Effect.provide(
        routeMessage(
          { _tag: "chat", channel: "global", message: "hello" },
          TEST_PLAYER,
        ),
        layer,
      ),
    )

    expect(result._tag).toBe("Success")
  })
})
