import { Schema } from "effect"

export class QuestAccepted extends Schema.TaggedClass<QuestAccepted>()("QuestAccepted", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  questId: Schema.String,
  playerId: Schema.String,
}) {}

export class QuestCompleted extends Schema.TaggedClass<QuestCompleted>()("QuestCompleted", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  questId: Schema.String,
  playerId: Schema.String,
}) {}

export class ObjectiveUpdated extends Schema.TaggedClass<ObjectiveUpdated>()("ObjectiveUpdated", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  questId: Schema.String,
  objectiveId: Schema.String,
  progress: Schema.Number,
}) {}
