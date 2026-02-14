import { Data } from "effect"

export class PartyFullError extends Data.TaggedError("PartyFullError")<{
  readonly partyId: string
  readonly maxSize: number
}> {}

export class GuildNotFoundError extends Data.TaggedError("GuildNotFoundError")<{
  readonly guildId: string
}> {}

export class AlreadyInPartyError extends Data.TaggedError("AlreadyInPartyError")<{
  readonly playerId: string
}> {}
