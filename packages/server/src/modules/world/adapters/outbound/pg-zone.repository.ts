import { Effect, Layer } from "effect"
import { ZoneRepository } from "../../ports/outbound/zone.repository"
import { DatabaseService } from "../../../../shared/infrastructure/database/index"
import { Zone, type ZoneType } from "../../domain/entities/zone"
import { Floor } from "../../domain/entities/floor"
import type { ZoneId, FloorId } from "../../../../shared/kernel/types"
import { DatabaseQueryError } from "../../../../shared/kernel/errors"
import type { ZoneDefinitionTable, FloorDefinitionTable } from "../../../../shared/infrastructure/database/types"

type ZoneRow = {
  [K in keyof ZoneDefinitionTable]: ZoneDefinitionTable[K] extends import("kysely").Generated<infer T> ? T : ZoneDefinitionTable[K]
}

type FloorRow = {
  [K in keyof FloorDefinitionTable]: FloorDefinitionTable[K] extends import("kysely").Generated<infer T> ? T : FloorDefinitionTable[K]
}

const toZone = (row: ZoneRow): Zone =>
  Zone.create({
    id: row.id as ZoneId,
    floorId: row.floor_id as FloorId,
    name: row.name,
    type: row.zone_type as ZoneType,
    bounds: {
      minX: row.min_x,
      minY: -100,
      minZ: row.min_z,
      maxX: row.max_x,
      maxY: 100,
      maxZ: row.max_z,
    },
    spawnPoint: {
      x: row.spawn_x,
      y: row.spawn_y,
      z: row.spawn_z,
    },
    pvpEnabled: !row.is_safe_zone,
    safeZone: row.is_safe_zone,
    maxPlayers: row.max_players,
  })

const toFloor = (row: FloorRow): Floor =>
  Floor.create({
    id: row.id as FloorId,
    name: row.name,
    recommendedLevel: row.level_requirement,
    isUnlocked: row.is_unlocked,
  })

export const PgZoneRepositoryLive = Layer.effect(
  ZoneRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService

    return {
      getZoneById: (zoneId: ZoneId) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.zone_definitions")
            .selectAll()
            .where("id", "=", zoneId)
            .executeTakeFirst(),
        ).pipe(
          Effect.map((row) => (row ? toZone(row) : null)),
          Effect.mapError((cause) => new DatabaseQueryError({ operation: "getZoneById", cause })),
        ),

      getZonesByFloor: (floorId: FloorId) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.zone_definitions")
            .selectAll()
            .where("floor_id", "=", floorId)
            .execute(),
        ).pipe(
          Effect.map((rows) => rows.map(toZone)),
          Effect.mapError((cause) => new DatabaseQueryError({ operation: "getZonesByFloor", cause })),
        ),

      getFloorById: (floorId: FloorId) =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.floor_definitions")
            .selectAll()
            .where("id", "=", floorId)
            .executeTakeFirst(),
        ).pipe(
          Effect.map((row) => (row ? toFloor(row) : null)),
          Effect.mapError((cause) => new DatabaseQueryError({ operation: "getFloorById", cause })),
        ),

      getAllZones: () =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.zone_definitions")
            .selectAll()
            .execute(),
        ).pipe(
          Effect.map((rows) => rows.map(toZone)),
          Effect.mapError((cause) => new DatabaseQueryError({ operation: "getAllZones", cause })),
        ),

      getAllFloors: () =>
        Effect.tryPromise(() =>
          db.kysely
            .selectFrom("sao.floor_definitions")
            .selectAll()
            .orderBy("id", "asc")
            .execute(),
        ).pipe(
          Effect.map((rows) => rows.map(toFloor)),
          Effect.mapError((cause) => new DatabaseQueryError({ operation: "getAllFloors", cause })),
        ),
    }
  }),
)
