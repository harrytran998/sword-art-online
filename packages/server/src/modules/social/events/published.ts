import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface PartyCreated extends DomainEvent {
  readonly _tag: "PartyCreated"
  readonly partyId: string
  readonly leaderId: string
}

export interface GuildCreated extends DomainEvent {
  readonly _tag: "GuildCreated"
  readonly guildId: string
  readonly name: string
}

export interface ChatSent extends DomainEvent {
  readonly _tag: "ChatSent"
  readonly senderId: string
  readonly channel: string
  readonly message: string
}
