import { describe, expect, it } from "bun:test"
import { Effect, Layer } from "effect"
import { decodeClientMessage, routeMessage } from "../websocket/message-router"
import { WorldPort } from "../../modules/world/ports/inbound/world.port"
import { PlayerPort } from "../../modules/player/ports/inbound/player.port"
import { Character } from "../../modules/player/domain/entities/character"
import type { PlayerId, AccountId } from "../../shared/kernel/types"

const TEST_PLAYER = "player-1" as PlayerId
const TEST_ACCOUNT = "acc-1" as AccountId

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
      changeZone: () => Effect.succeed({
        zoneId: "floor_1_town",
        zoneName: "Town of Beginnings",
        zoneType: "town",
        isSafeZone: true,
        spawnX: 100,
        spawnY: 0,
        spawnZ: 100,
        players: [],
      }),
    }),
    movements,
  }
}

const makeMockPlayerPort = () => {
  const created: Array<{ name: string; classId: number }> = []

  return {
    layer: Layer.succeed(PlayerPort, {
      createCharacter: (params) =>
        Effect.sync(() => {
          created.push({ name: params.name, classId: params.classId })
          return Character.create({
            id: "new-char-id" as PlayerId,
            accountId: params.accountId,
            name: params.name,
            level: 1,
            experience: 0,
            currentHp: 180,
            maxHp: 180,
            currentFloor: 1,
            col: 0,
            isAlive: true,
            stats: {
              str: 10,
              agi: 5,
              vit: 8,
              dex: 5,
              int: 3,
              lck: 3,
              unallocatedPoints: 0,
            },
          })
        }),
      getPlayer: () => Effect.succeed(null as never),
      getPlayerByAccountId: () => Effect.succeed(null),
      allocateStats: () => Effect.void,
      addCurrency: () => Effect.void,
      deductCurrency: () => Effect.void,
    }),
    created,
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

  it("should decode valid create_character message", async () => {
    const result = await Effect.runPromise(
      decodeClientMessage({
        _tag: "create_character",
        name: "Kirito",
        classId: 1,
      }),
    )
    expect(result._tag).toBe("create_character")
  })

  it("should reject create_character with short name", async () => {
    const result = await Effect.runPromiseExit(
      decodeClientMessage({
        _tag: "create_character",
        name: "ab",
        classId: 1,
      }),
    )
    expect(result._tag).toBe("Failure")
  })

  it("should reject create_character with invalid classId", async () => {
    const result = await Effect.runPromiseExit(
      decodeClientMessage({
        _tag: "create_character",
        name: "Kirito",
        classId: 8,
      }),
    )
    expect(result._tag).toBe("Failure")
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
    const { layer: worldLayer, movements } = makeMockWorldPort()
    const { layer: playerLayer } = makeMockPlayerPort()
    const testLayer = Layer.mergeAll(worldLayer, playerLayer)

    await Effect.runPromise(
      Effect.provide(
        routeMessage(
          { _tag: "movement", x: 5, y: 0, z: 3, rotation: 0, timestamp: Date.now() },
          TEST_PLAYER,
          TEST_ACCOUNT,
        ),
        testLayer,
      ),
    )

    expect(movements).toHaveLength(1)
    expect(movements[0]?.x).toBe(5)
    expect(movements[0]?.z).toBe(3)
  })

  it("should return heartbeat_ack for heartbeat", async () => {
    const { layer: worldLayer } = makeMockWorldPort()
    const { layer: playerLayer } = makeMockPlayerPort()
    const testLayer = Layer.mergeAll(worldLayer, playerLayer)
    const now = Date.now()

    const result = await Effect.runPromise(
      Effect.provide(
        routeMessage({ _tag: "heartbeat", timestamp: now }, TEST_PLAYER, TEST_ACCOUNT),
        testLayer,
      ),
    )

    expect(result).toBeDefined()
    expect((result as { _tag: string })._tag).toBe("heartbeat_ack")
    expect((result as { serverTime: number }).serverTime).toBeGreaterThan(0)
  })

  it("should route create_character to PlayerPort and return character_data", async () => {
    const { layer: worldLayer } = makeMockWorldPort()
    const { layer: playerLayer, created } = makeMockPlayerPort()
    const testLayer = Layer.mergeAll(worldLayer, playerLayer)

    const result = await Effect.runPromise(
      Effect.provide(
        routeMessage(
          { _tag: "create_character", name: "Kirito", classId: 1 },
          TEST_PLAYER,
          TEST_ACCOUNT,
        ),
        testLayer,
      ),
    )

    expect(created).toHaveLength(1)
    expect(created[0]?.name).toBe("Kirito")
    expect(created[0]?.classId).toBe(1)

    const charData = result as { _tag: string; characterId: string; name: string }
    expect(charData._tag).toBe("character_data")
    expect(charData.name).toBe("Kirito")
    expect(charData.characterId).toBe("new-char-id")
  })

  it("should handle unimplemented message types gracefully", async () => {
    const { layer: worldLayer } = makeMockWorldPort()
    const { layer: playerLayer } = makeMockPlayerPort()
    const testLayer = Layer.mergeAll(worldLayer, playerLayer)

    const result = await Effect.runPromiseExit(
      Effect.provide(
        routeMessage(
          { _tag: "chat", channel: "global", message: "hello" },
          TEST_PLAYER,
          TEST_ACCOUNT,
        ),
        testLayer,
      ),
    )

    expect(result._tag).toBe("Success")
  })
})
