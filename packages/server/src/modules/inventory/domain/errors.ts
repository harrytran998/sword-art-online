export class ItemNotFoundError extends Error {
  readonly _tag = "ItemNotFoundError" as const
  constructor(readonly itemId: string) {
    super(`Item not found: ${itemId}`)
    this.name = "ItemNotFoundError"
  }
}

export class InventoryFullError extends Error {
  readonly _tag = "InventoryFullError" as const
  constructor() {
    super("Inventory is full")
    this.name = "InventoryFullError"
  }
}

export class InsufficientQuantityError extends Error {
  readonly _tag = "InsufficientQuantityError" as const
  constructor(readonly requested: number, readonly available: number) {
    super(`Insufficient quantity: requested ${requested}, available ${available}`)
    this.name = "InsufficientQuantityError"
  }
}

export class RequirementsNotMetError extends Error {
  readonly _tag = "RequirementsNotMetError" as const
  constructor(readonly reason: string) {
    super(`Requirements not met: ${reason}`)
    this.name = "RequirementsNotMetError"
  }
}

export class InvalidSlotError extends Error {
  readonly _tag = "InvalidSlotError" as const
  constructor(readonly slot: string) {
    super(`Invalid slot: ${slot}`)
    this.name = "InvalidSlotError"
  }
}

export class ItemDefinitionNotFoundError extends Error {
  readonly _tag = "ItemDefinitionNotFoundError" as const
  constructor(readonly itemDefId: number) {
    super(`Item definition not found: ${itemDefId}`)
    this.name = "ItemDefinitionNotFoundError"
  }
}

export class EquipmentSlotOccupiedError extends Error {
  readonly _tag = "EquipmentSlotOccupiedError" as const
  constructor(readonly slot: string) {
    super(`Equipment slot occupied: ${slot}`)
    this.name = "EquipmentSlotOccupiedError"
  }
}
