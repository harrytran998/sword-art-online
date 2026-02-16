import { Schema } from "effect"

export class PlayerCreated extends Schema.TaggedClass<PlayerCreated>()("PlayerCreated", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  name: Schema.String,
}) {}

export class PlayerLeveledUp extends Schema.TaggedClass<PlayerLeveledUp>()("PlayerLeveledUp", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  newLevel: Schema.Number,
}) {}

export class StatsAllocated extends Schema.TaggedClass<StatsAllocated>()("StatsAllocated", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
}) {}
