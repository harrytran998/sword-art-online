import { Schema } from "effect"

export class SkillExecuted extends Schema.TaggedClass<SkillExecuted>()("SkillExecuted", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  skillId: Schema.String,
}) {}

export class DamageDealt extends Schema.TaggedClass<DamageDealt>()("DamageDealt", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  attackerId: Schema.String,
  targetId: Schema.String,
  damage: Schema.Number,
}) {}

export class PlayerDefeated extends Schema.TaggedClass<PlayerDefeated>()("PlayerDefeated", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  defeatedBy: Schema.String,
}) {}
