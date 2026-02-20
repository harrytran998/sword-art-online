import { Context, Effect } from "effect"
import type { ItemId } from "../../../../shared/kernel/types"
import type { InventorySlot } from "../../domain/entities/inventory-slot"
import type { EquipmentSlotType } from "../../domain/value-objects/equipment-slot"
import type { ItemNotFoundError, InventoryFullError, InsufficientQuantityError, RequirementsNotMetError, InvalidSlotError, ItemDefinitionNotFoundError } from "../../domain/errors"

export class InventoryPort extends Context.Tag("InventoryPort")<
  InventoryPort,
  {
    readonly getInventory: (characterId: number) => Effect.Effect<InventorySlot[]>
    readonly getEquipment: (characterId: number) => Effect.Effect<Map<EquipmentSlotType, InventorySlot>>
    readonly addItem: (characterId: number, itemDefId: number, quantity: number) => Effect.Effect<InventorySlot, InventoryFullError | ItemDefinitionNotFoundError>
    readonly removeItem: (characterId: number, slotId: ItemId, quantity: number) => Effect.Effect<void, ItemNotFoundError | InsufficientQuantityError>
    readonly moveItem: (characterId: number, fromSlot: number, toSlot: number) => Effect.Effect<void, InvalidSlotError>
    readonly equipItem: (characterId: number, slotId: ItemId, targetSlot: EquipmentSlotType) => Effect.Effect<InventorySlot, ItemNotFoundError | RequirementsNotMetError | InvalidSlotError>
    readonly unequipItem: (characterId: number, slot: EquipmentSlotType) => Effect.Effect<InventorySlot, InvalidSlotError | InventoryFullError>
    readonly useItem: (characterId: number, slotId: ItemId) => Effect.Effect<void, ItemNotFoundError | RequirementsNotMetError>
  }
>() {}
