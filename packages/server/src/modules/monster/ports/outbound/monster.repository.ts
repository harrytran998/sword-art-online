import { Context, Effect } from "effect"
import type { ZoneId } from "../../../../shared/kernel/types"
import type { Monster } from "../../domain/entities/monster"
import type { SpawnPoint } from "../../domain/entities/spawn-point"
import type { LootTable } from "../../domain/entities/loot-table"

export interface MonsterRepository {
  readonly getMonsterById: (id: string) => Effect.Effect<Monster | null>
  readonly getMonstersByZone: (zoneId: ZoneId) => Effect.Effect<Monster[]>
  readonly saveMonster: (monster: Monster) => Effect.Effect<void>
  readonly deleteMonster: (id: string) => Effect.Effect<void>
}

export class MonsterRepository extends Context.Tag("MonsterRepository")<MonsterRepository, MonsterRepository>() {}

export interface SpawnPointRepository {
  readonly getSpawnPointsByZone: (zoneId: ZoneId) => Effect.Effect<SpawnPoint[]>
  readonly getAllActiveSpawnPoints: () => Effect.Effect<SpawnPoint[]>
}

export class SpawnPointRepository extends Context.Tag("SpawnPointRepository")<SpawnPointRepository, SpawnPointRepository>() {}

export interface LootTableRepository {
  readonly getLootTableById: (id: number) => Effect.Effect<LootTable | null>
}

export class LootTableRepository extends Context.Tag("LootTableRepository")<LootTableRepository, LootTableRepository>() {}
