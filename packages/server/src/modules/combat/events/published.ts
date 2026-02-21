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

export class SkillProficiencyUpdated extends Schema.TaggedClass<SkillProficiencyUpdated>()("SkillProficiencyUpdated", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  skillId: Schema.String,
  newProficiency: Schema.Number,
  tierName: Schema.String,
}) {}

export class SkillUnlocked extends Schema.TaggedClass<SkillUnlocked>()("SkillUnlocked", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  skillId: Schema.String,
  skillName: Schema.String,
}) {}

export class SkillSlotAssigned extends Schema.TaggedClass<SkillSlotAssigned>()("SkillSlotAssigned", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  skillId: Schema.String,
  slotIndex: Schema.Number,
}) {}
