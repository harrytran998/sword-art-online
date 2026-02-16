import { Schema } from "effect"

export class PlayerEnteredZone extends Schema.TaggedClass<PlayerEnteredZone>()("PlayerEnteredZone", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  zoneId: Schema.String,
}) {}

export class PlayerLeftZone extends Schema.TaggedClass<PlayerLeftZone>()("PlayerLeftZone", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  zoneId: Schema.String,
}) {}

export class PlayerMoved extends Schema.TaggedClass<PlayerMoved>()("PlayerMoved", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  zoneId: Schema.String,
  x: Schema.Number,
  y: Schema.Number,
  z: Schema.Number,
  rotation: Schema.Number,
}) {}

export class FloorUnlocked extends Schema.TaggedClass<FloorUnlocked>()("FloorUnlocked", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  floorId: Schema.Number,
  unlockedBy: Schema.String,
}) {}
