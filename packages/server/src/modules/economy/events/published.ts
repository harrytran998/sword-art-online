import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface TradeCompleted extends DomainEvent {
  readonly _tag: "TradeCompleted"
  readonly tradeId: string
  readonly buyerId: string
  readonly sellerId: string
}

export interface AuctionSold extends DomainEvent {
  readonly _tag: "AuctionSold"
  readonly auctionId: string
  readonly itemId: string
  readonly price: number
}

export interface ColTransferred extends DomainEvent {
  readonly _tag: "ColTransferred"
  readonly fromId: string
  readonly toId: string
  readonly amount: number
}
