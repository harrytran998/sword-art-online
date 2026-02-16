import { Schema } from "effect"

export class PlayerLoggedIn extends Schema.TaggedClass<PlayerLoggedIn>()("PlayerLoggedIn", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
}) {}

export class PlayerRegistered extends Schema.TaggedClass<PlayerRegistered>()("PlayerRegistered", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  accountId: Schema.String,
  email: Schema.String,
}) {}

export class PlayerLoggedOut extends Schema.TaggedClass<PlayerLoggedOut>()("PlayerLoggedOut", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
}) {}
