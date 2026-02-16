import { Schema } from "effect"

export class PartyCreated extends Schema.TaggedClass<PartyCreated>()("PartyCreated", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  partyId: Schema.String,
  leaderId: Schema.String,
}) {}

export class GuildCreated extends Schema.TaggedClass<GuildCreated>()("GuildCreated", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  guildId: Schema.String,
  name: Schema.String,
}) {}

export class ChatSent extends Schema.TaggedClass<ChatSent>()("ChatSent", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  senderId: Schema.String,
  channel: Schema.String,
  message: Schema.String,
}) {}
