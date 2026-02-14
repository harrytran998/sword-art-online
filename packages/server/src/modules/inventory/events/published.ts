import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface ItemPickedUp extends DomainEvent {
  readonly _tag: "ItemPickedUp"
  readonly playerId: string
  readonly itemId: string
}

export interface ItemEquipped extends DomainEvent {
  readonly _tag: "ItemEquipped"
  readonly playerId: string
  readonly itemId: string
  readonly slot: string
}

export interface ItemEnhanced extends DomainEvent {
  readonly _tag: "ItemEnhanced"
  readonly playerId: string
  readonly itemId: string
  readonly newLevel: number
}
