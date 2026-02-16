import { Context, Effect } from "effect"
import type { PlayerId, ZoneId } from "../../../../shared/kernel/types"
import type { Position } from "../../domain/value-objects/position"

export interface PlayerZoneState {
  readonly playerId: PlayerId
  readonly zoneId: ZoneId
  readonly position: Position
  readonly rotation: number
  readonly lastUpdate: number
}

export class ZoneStateRepository extends Context.Tag("ZoneStateRepository")<
  ZoneStateRepository,
  {
    readonly getPlayerState: (
      playerId: PlayerId,
    ) => Effect.Effect<PlayerZoneState | null>
    readonly setPlayerState: (
      state: PlayerZoneState,
    ) => Effect.Effect<void>
    readonly removePlayer: (
      playerId: PlayerId,
    ) => Effect.Effect<void>
    readonly getPlayersInZone: (
      zoneId: ZoneId,
    ) => Effect.Effect<PlayerZoneState[]>
    readonly getPlayerZoneId: (
      playerId: PlayerId,
    ) => Effect.Effect<ZoneId | null>
    readonly getActiveZoneIds: () => Effect.Effect<ZoneId[]>
  }
>() {}
