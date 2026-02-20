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

export class MonsterAttackTelegraphed extends Schema.TaggedClass<MonsterAttackTelegraphed>()("MonsterAttackTelegraphed", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  monsterId: Schema.String,
  attackType: Schema.String,
  targetAreaX: Schema.Number,
  targetAreaY: Schema.Number,
  targetAreaZ: Schema.Number,
  targetAreaRadius: Schema.Number,
  executeAt: Schema.DateFromSelf,
}) {}

export class MonsterAttackExecuted extends Schema.TaggedClass<MonsterAttackExecuted>()("MonsterAttackExecuted", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  monsterId: Schema.String,
  attackType: Schema.String,
  targets: Schema.Array(Schema.String),
  damage: Schema.Number,
}) {}

export class LootPickedUp extends Schema.TaggedClass<LootPickedUp>()("LootPickedUp", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  lootId: Schema.String,
  playerId: Schema.String,
  itemName: Schema.String,
  quantity: Schema.Number,
}) {}
