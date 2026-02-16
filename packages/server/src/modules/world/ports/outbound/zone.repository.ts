import { Context, Effect } from "effect"
import type { ZoneId, FloorId } from "../../../../shared/kernel/types"
import type { Zone } from "../../domain/entities/zone"
import type { Floor } from "../../domain/entities/floor"
import type { DatabaseQueryError } from "../../../../shared/kernel/errors"

export class ZoneRepository extends Context.Tag("ZoneRepository")<
  ZoneRepository,
  {
    readonly getZoneById: (
      zoneId: ZoneId,
    ) => Effect.Effect<Zone | null, DatabaseQueryError>
    readonly getZonesByFloor: (
      floorId: FloorId,
    ) => Effect.Effect<Zone[], DatabaseQueryError>
    readonly getFloorById: (
      floorId: FloorId,
    ) => Effect.Effect<Floor | null, DatabaseQueryError>
    readonly getAllZones: () => Effect.Effect<Zone[], DatabaseQueryError>
    readonly getAllFloors: () => Effect.Effect<Floor[], DatabaseQueryError>
  }
>() {}
