import { Data } from "effect"

export class InsufficientColError extends Data.TaggedError("InsufficientColError")<{
  readonly available: number
  readonly required: number
}> {}

export class TradeNotFoundError extends Data.TaggedError("TradeNotFoundError")<{
  readonly tradeId: string
}> {}

export class AuctionExpiredError extends Data.TaggedError("AuctionExpiredError")<{
  readonly auctionId: string
}> {}
