import { Layer } from "effect"
import {
  PgMonsterRepositoryLive,
  PgSpawnPointRepositoryLive,
  PgLootTableRepositoryLive,
} from "./adapters/outbound/pg-monster.repository"
import { MonsterPortLive } from "./adapters/inbound/monster-port.live"
import { InMemoryDroppedLootRepositoryLive } from "./application/pickup-loot.use-case"

const MonsterRepositoriesLive = Layer.mergeAll(
  PgMonsterRepositoryLive,
  PgSpawnPointRepositoryLive,
  PgLootTableRepositoryLive,
  InMemoryDroppedLootRepositoryLive,
)

export const MonsterModule = MonsterPortLive.pipe(
  Layer.provideMerge(MonsterRepositoriesLive),
)
