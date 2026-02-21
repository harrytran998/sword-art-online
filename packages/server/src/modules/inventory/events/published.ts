import { Schema } from "effect"

export class ItemPickedUp extends Schema.TaggedClass<ItemPickedUp>()("ItemPickedUp", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  characterId: Schema.String,
  itemId: Schema.String,
  itemName: Schema.String,
  quantity: Schema.Number,
}) {}

export class ItemEquipped extends Schema.TaggedClass<ItemEquipped>()("ItemEquipped", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  characterId: Schema.String,
  itemId: Schema.String,
  slot: Schema.String,
}) {}

export class ItemUnequipped extends Schema.TaggedClass<ItemUnequipped>()("ItemUnequipped", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  characterId: Schema.String,
  itemId: Schema.String,
  slot: Schema.String,
}) {}

export class ItemUsed extends Schema.TaggedClass<ItemUsed>()("ItemUsed", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  characterId: Schema.String,
  itemId: Schema.String,
  itemName: Schema.String,
}) {}

export class ItemEnhanced extends Schema.TaggedClass<ItemEnhanced>()("ItemEnhanced", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  characterId: Schema.String,
  itemId: Schema.String,
  newLevel: Schema.Number,
  success: Schema.Boolean,
}) {}

export class ItemDropped extends Schema.TaggedClass<ItemDropped>()("ItemDropped", {
  timestamp: Schema.DateFromSelf,
  aggregateId: Schema.String,
  characterId: Schema.String,
  itemId: Schema.String,
  quantity: Schema.Number,
  positionX: Schema.Number,
  positionY: Schema.Number,
  positionZ: Schema.Number,
}) {}
