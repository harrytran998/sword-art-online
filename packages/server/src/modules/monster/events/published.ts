import { Schema } from "effect"

export class MonsterSpawned extends Schema.TaggedClass<MonsterSpawned>()("MonsterSpawned", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  monsterId: Schema.String,
  zoneId: Schema.String,
}) {}

export class MonsterKilled extends Schema.TaggedClass<MonsterKilled>()("MonsterKilled", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  monsterId: Schema.String,
  killedBy: Schema.String,
}) {}

export class LootDropped extends Schema.TaggedClass<LootDropped>()("LootDropped", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  monsterId: Schema.String,
  items: Schema.Array(Schema.String),
}) {}
