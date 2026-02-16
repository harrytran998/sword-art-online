import { Effect } from "effect"
import { EventBus } from "../shared/infrastructure/event-bus/index"
import type { PlayerMoved, PlayerLeftZone, PlayerEnteredZone } from "../modules/world/events/published"

export interface GatewayBroadcaster {
  readonly broadcastToZone: (
    zoneId: string,
    message: unknown,
  ) => Effect.Effect<void>
}

export const registerGatewaySubscriptions = (
  broadcaster: GatewayBroadcaster,
): Effect.Effect<void, never, EventBus> =>
  Effect.gen(function* () {
    const eventBus = yield* EventBus

    yield* eventBus.subscribe<PlayerMoved>("PlayerMoved", (event) => {
      return broadcaster.broadcastToZone(event.zoneId, {
        _tag: "player_moved",
        playerId: event.playerId,
        x: event.x,
        y: event.y,
        z: event.z,
        rotation: event.rotation,
        timestamp: event.timestamp.getTime(),
      })
    })

    yield* eventBus.subscribe<PlayerLeftZone>("PlayerLeftZone", (event) => {
      return broadcaster.broadcastToZone(event.zoneId, {
        _tag: "player_left",
        playerId: event.playerId,
      })
    })

    yield* eventBus.subscribe<PlayerEnteredZone>("PlayerEnteredZone", (event) => {
      return broadcaster.broadcastToZone(event.zoneId, {
        _tag: "player_joined",
        playerId: event.playerId,
        name: "",
        level: 1,
      })
    })

    yield* Effect.logInfo("Gateway event subscriptions registered")
  })
