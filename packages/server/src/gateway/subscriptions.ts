import { Effect } from "effect"
import { EventBus } from "../shared/infrastructure/event-bus/index.js"
import type { PlayerMoved, PlayerLeftZone, PlayerEnteredZone } from "../modules/world/events/published.js"

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

    yield* eventBus.subscribe("PlayerMoved", (event) => {
      const e = event as unknown as PlayerMoved
      return broadcaster.broadcastToZone(e.zoneId, {
        _tag: "player_moved",
        playerId: e.playerId,
        x: e.x,
        y: e.y,
        z: e.z,
        rotation: e.rotation,
        timestamp: e.timestamp.getTime(),
      })
    })

    yield* eventBus.subscribe("PlayerLeftZone", (event) => {
      const e = event as unknown as PlayerLeftZone
      return broadcaster.broadcastToZone(e.zoneId, {
        _tag: "player_left",
        playerId: e.playerId,
      })
    })

    yield* eventBus.subscribe("PlayerEnteredZone", (event) => {
      const e = event as unknown as PlayerEnteredZone
      return broadcaster.broadcastToZone(e.zoneId, {
        _tag: "player_joined",
        playerId: e.playerId,
        name: "",
        level: 1,
      })
    })

    yield* Effect.logInfo("Gateway event subscriptions registered")
  })
