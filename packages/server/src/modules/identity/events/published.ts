import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface PlayerLoggedIn extends DomainEvent {
  readonly _tag: "PlayerLoggedIn"
  readonly playerId: string
}

export interface PlayerRegistered extends DomainEvent {
  readonly _tag: "PlayerRegistered"
  readonly accountId: string
  readonly email: string
}

export interface PlayerLoggedOut extends DomainEvent {
  readonly _tag: "PlayerLoggedOut"
  readonly playerId: string
}
