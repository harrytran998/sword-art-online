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

export interface PlayerMoved extends DomainEvent {
  readonly _tag: "PlayerMoved"
  readonly playerId: string
  readonly zoneId: string
  readonly x: number
  readonly y: number
  readonly z: number
  readonly rotation: number
}

export interface FloorUnlocked extends DomainEvent {
  readonly _tag: "FloorUnlocked"
  readonly floorId: number
  readonly unlockedBy: string
}
