import { Schema } from "effect"

export class ItemPickedUp extends Schema.TaggedClass<ItemPickedUp>()("ItemPickedUp", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  itemId: Schema.String,
}) {}

export class ItemEquipped extends Schema.TaggedClass<ItemEquipped>()("ItemEquipped", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  itemId: Schema.String,
  slot: Schema.String,
}) {}

export class ItemEnhanced extends Schema.TaggedClass<ItemEnhanced>()("ItemEnhanced", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  playerId: Schema.String,
  itemId: Schema.String,
  newLevel: Schema.Number,
}) {}
