import { Data } from "effect"

export class InventoryFullError extends Data.TaggedError("InventoryFullError")<{
  readonly currentSize: number
  readonly maxSize: number
}> {}

export class ItemNotFoundError extends Data.TaggedError("ItemNotFoundError")<{
  readonly itemId: string
}> {}

export class EquipmentSlotOccupiedError extends Data.TaggedError("EquipmentSlotOccupiedError")<{
  readonly slot: string
}> {}
