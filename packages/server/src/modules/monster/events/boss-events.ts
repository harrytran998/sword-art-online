import { Schema } from "effect"

export class BossPhaseChanged extends Schema.TaggedClass<BossPhaseChanged>()("BossPhaseChanged", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  bossId: Schema.String,
  bossName: Schema.String,
  newPhase: Schema.Number,
  currentHp: Schema.Number,
  totalHp: Schema.Number,
}) {}

export class BossDefeated extends Schema.TaggedClass<BossDefeated>()("BossDefeated", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  bossId: Schema.String,
  bossName: Schema.String,
  floorId: Schema.Number,
  lastAttackPlayerId: Schema.String,
}) {}

export class BossRoomSealed extends Schema.TaggedClass<BossRoomSealed>()("BossRoomSealed", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  zoneId: Schema.String,
  bossName: Schema.String,
}) {}

export class BossRoomUnsealed extends Schema.TaggedClass<BossRoomUnsealed>()("BossRoomUnsealed", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  zoneId: Schema.String,
  reason: Schema.String, // "boss_defeated" | "party_wipe"
}) {}
