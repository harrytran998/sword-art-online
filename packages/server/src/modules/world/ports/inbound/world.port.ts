import { Context, Effect } from "effect"
import type { PlayerId, ZoneId } from "../../../../shared/kernel/types"
import type { Position } from "../../domain/value-objects/position"
import type { InvalidPositionError, ZoneNotFoundError } from "../../domain/errors"

export class WorldPort extends Context.Tag("WorldPort")<
  WorldPort,
  {
    readonly handleMovement: (
      playerId: PlayerId,
      msg: { x: number; y: number; z: number; rotation: number; timestamp: number },
    ) => Effect.Effect<void, InvalidPositionError | ZoneNotFoundError>
    readonly getPlayerPosition: (
      playerId: PlayerId,
    ) => Effect.Effect<Position | null>
    readonly getPlayersInZone: (
      zoneId: ZoneId,
    ) => Effect.Effect<
      Array<{ playerId: PlayerId; position: Position; rotation: number }>
    >
    readonly setPlayerZone: (
      playerId: PlayerId,
      zoneId: ZoneId,
    ) => Effect.Effect<void>
    readonly removePlayer: (
      playerId: PlayerId,
    ) => Effect.Effect<void>
  }
>() {}
