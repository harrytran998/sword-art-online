import { Effect, Layer } from "effect"
import { MonsterRepository, SpawnPointRepository, LootTableRepository } from "../../ports/outbound/monster.repository"
import { DatabaseService } from "../../../../shared/infrastructure/database/index"
import { Monster } from "../../domain/entities/monster"
import { SpawnPoint } from "../../domain/entities/spawn-point"
import { LootTable, type LootEntry } from "../../domain/entities/loot-table"
import type { ZoneId } from "../../../../shared/kernel/types"

const monsterInstances = new Map<string, Monster>()

export const PgMonsterRepositoryLive = Layer.effect(
  MonsterRepository,
  Effect.gen(function* () {
    return {
      getMonsterById: (id: string) =>
        Effect.gen(function* () {
          const monster = monsterInstances.get(id)
          return monster ?? null
        }),

      getMonstersByZone: (zoneId: ZoneId) =>
        Effect.gen(function* () {
          const monsters = Array.from(monsterInstances.values()).filter(
            (m) => m.zoneId === zoneId,
          )
          return monsters
        }),

      saveMonster: (monster: Monster) =>
        Effect.gen(function* () {
          monsterInstances.set(monster.id, monster)
        }),

      deleteMonster: (id: string) =>
        Effect.gen(function* () {
          monsterInstances.delete(id)
        }),
    }
  }),
)

export const PgSpawnPointRepositoryLive = Layer.effect(
  SpawnPointRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService

    return {
      getSpawnPointsByZone: (zoneId: ZoneId) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.monster_spawns")
              .selectAll()
              .where("zone_id", "=", zoneId)
              .where("is_active", "=", true)
              .execute(),
          ).pipe(Effect.orDie)

          return rows.map((row) =>
            SpawnPoint.create({
              id: row.id,
              monsterDefId: row.monster_def_id,
              zoneId: row.zone_id as ZoneId,
              spawnX: row.spawn_x,
              spawnY: row.spawn_y,
              spawnZ: row.spawn_z,
              spawnCount: row.spawn_count,
              spawnRadius: row.spawn_radius,
              isActive: row.is_active,
            }),
          )
        }),

      getAllActiveSpawnPoints: () =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.monster_spawns")
              .selectAll()
              .where("is_active", "=", true)
              .execute(),
          ).pipe(Effect.orDie)

          return rows.map((row) =>
            SpawnPoint.create({
              id: row.id,
              monsterDefId: row.monster_def_id,
              zoneId: row.zone_id as ZoneId,
              spawnX: row.spawn_x,
              spawnY: row.spawn_y,
              spawnZ: row.spawn_z,
              spawnCount: row.spawn_count,
              spawnRadius: row.spawn_radius,
              isActive: row.is_active,
            }),
          )
        }),
    }
  }),
)

export const PgLootTableRepositoryLive = Layer.effect(
  LootTableRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService

    return {
      getLootTableById: (id: number) =>
        Effect.gen(function* () {
          const tableRow = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.loot_tables")
              .selectAll()
              .where("id", "=", id)
              .executeTakeFirst(),
          ).pipe(Effect.orDie)

          if (!tableRow) return null

          const entryRows = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.loot_table_entries")
              .selectAll()
              .where("loot_table_id", "=", id)
              .execute(),
          ).pipe(Effect.orDie)

          const entries: LootEntry[] = entryRows.map((row) => ({
            itemName: row.item_name,
            dropChance: row.drop_chance,
            quantityMin: row.quantity_min,
            quantityMax: row.quantity_max,
          }))

          return LootTable.create({
            id: tableRow.id,
            name: tableRow.name,
            entries,
          })
        }),
    }
  }),
)
