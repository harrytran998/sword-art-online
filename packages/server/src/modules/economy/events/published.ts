import { Schema } from "effect"

export class TradeCompleted extends Schema.TaggedClass<TradeCompleted>()("TradeCompleted", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  tradeId: Schema.String,
  buyerId: Schema.String,
  sellerId: Schema.String,
}) {}

export class AuctionSold extends Schema.TaggedClass<AuctionSold>()("AuctionSold", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  auctionId: Schema.String,
  itemId: Schema.String,
  price: Schema.Number,
}) {}

export class ColTransferred extends Schema.TaggedClass<ColTransferred>()("ColTransferred", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  fromId: Schema.String,
  toId: Schema.String,
  amount: Schema.Number,
}) {}
