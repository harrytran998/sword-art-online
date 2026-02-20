import { Context, Effect } from "effect"
import type { ZoneId } from "../../../../shared/kernel/types"
import type { Monster } from "../../domain/entities/monster"
import type { SpawnPoint } from "../../domain/entities/spawn-point"
import type { LootTable } from "../../domain/entities/loot-table"

export class MonsterRepository extends Context.Tag("MonsterRepository")<
  MonsterRepository,
  {
    readonly getMonsterById: (id: string) => Effect.Effect<Monster | null>
    readonly getMonstersByZone: (zoneId: ZoneId) => Effect.Effect<Monster[]>
    readonly saveMonster: (monster: Monster) => Effect.Effect<void>
    readonly deleteMonster: (id: string) => Effect.Effect<void>
  }
>() {}

export class SpawnPointRepository extends Context.Tag("SpawnPointRepository")<
  SpawnPointRepository,
  {
    readonly getSpawnPointsByZone: (zoneId: ZoneId) => Effect.Effect<SpawnPoint[]>
    readonly getAllActiveSpawnPoints: () => Effect.Effect<SpawnPoint[]>
  }
>() {}

export class LootTableRepository extends Context.Tag("LootTableRepository")<
  LootTableRepository,
  {
    readonly getLootTableById: (id: number) => Effect.Effect<LootTable | null>
  }
>() {}
