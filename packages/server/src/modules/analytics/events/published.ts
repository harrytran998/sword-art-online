import { Schema } from "effect"

export class GameEventLogged extends Schema.TaggedClass<GameEventLogged>()("GameEventLogged", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  eventType: Schema.String,
  payload: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
}) {}

export class LeaderboardUpdated extends Schema.TaggedClass<LeaderboardUpdated>()("LeaderboardUpdated", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  leaderboardId: Schema.String,
}) {}
