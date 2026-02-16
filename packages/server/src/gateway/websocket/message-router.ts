import { Effect, Match, Schema } from "effect"
import type { PlayerId, ZoneId } from "../../shared/kernel/types"
import { WorldPort } from "../../modules/world/ports/inbound/world.port"
import { ClientMessageSchema, type ValidatedClientMessage } from "./schemas"

export const decodeClientMessage = (raw: unknown) =>
  Schema.decodeUnknown(ClientMessageSchema)(raw)

export const routeMessage = (
  msg: ValidatedClientMessage,
  playerId: PlayerId,
): Effect.Effect<unknown, unknown, WorldPort> =>
  Match.value(msg).pipe(
    Match.when({ _tag: "movement" }, (m) =>
      Effect.gen(function* () {
        const world = yield* WorldPort
        yield* world.handleMovement(playerId, {
          x: m.x,
          y: m.y,
          z: m.z,
          rotation: m.rotation,
          timestamp: m.timestamp,
        })
      }),
    ),
    Match.when({ _tag: "heartbeat" }, (m) =>
      Effect.succeed({
        _tag: "heartbeat_ack" as const,
        serverTime: Date.now(),
        clientTime: m.timestamp,
      }),
    ),
    Match.when({ _tag: "zone_change" }, (m) =>
      Effect.gen(function* () {
        const world = yield* WorldPort
        const result = yield* world.changeZone(
          playerId,
          m.targetZoneId as ZoneId,
        )
        return {
          _tag: "zone_state" as const,
          ...result,
        }
      }),
    ),
    Match.when({ _tag: "chat" }, () =>
      Effect.logDebug("Chat not yet implemented").pipe(Effect.as(undefined)),
    ),
    Match.when({ _tag: "skill_activate" }, () =>
      Effect.logDebug("Skill activate not yet implemented").pipe(Effect.as(undefined)),
    ),
    Match.when({ _tag: "skill_cancel" }, () =>
      Effect.logDebug("Skill cancel not yet implemented").pipe(Effect.as(undefined)),
    ),
    Match.when({ _tag: "trade_request" }, () =>
      Effect.logDebug("Trade request not yet implemented").pipe(Effect.as(undefined)),
    ),
    Match.when({ _tag: "trade_accept" }, () =>
      Effect.logDebug("Trade accept not yet implemented").pipe(Effect.as(undefined)),
    ),
    Match.when({ _tag: "item_use" }, () =>
      Effect.logDebug("Item use not yet implemented").pipe(Effect.as(undefined)),
    ),
    Match.when({ _tag: "item_equip" }, () =>
      Effect.logDebug("Item equip not yet implemented").pipe(Effect.as(undefined)),
    ),
    Match.exhaustive,
  )
