import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface PlayerCreated extends DomainEvent {
  readonly _tag: "PlayerCreated"
  readonly playerId: string
  readonly name: string
}

export interface PlayerLeveledUp extends DomainEvent {
  readonly _tag: "PlayerLeveledUp"
  readonly playerId: string
  readonly newLevel: number
}

export interface StatsAllocated extends DomainEvent {
  readonly _tag: "StatsAllocated"
  readonly playerId: string
}
