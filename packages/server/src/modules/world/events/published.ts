import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface PlayerEnteredZone extends DomainEvent {
  readonly _tag: "PlayerEnteredZone"
  readonly playerId: string
  readonly zoneId: string
}

export interface PlayerLeftZone extends DomainEvent {
  readonly _tag: "PlayerLeftZone"
  readonly playerId: string
  readonly zoneId: string
}

export interface FloorUnlocked extends DomainEvent {
  readonly _tag: "FloorUnlocked"
  readonly floorId: number
  readonly unlockedBy: string
}
