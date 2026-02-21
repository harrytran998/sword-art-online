import { Context, Effect } from "effect"
import type { ItemId } from "../../../../shared/kernel/types"
import type { InventorySlot } from "../../domain/entities/inventory-slot"
import type { EquipmentSlotType } from "../../domain/value-objects/equipment-slot"
import type { ItemDefinition } from "../../domain/entities/item-definition"
import type { ItemCategory } from "../../../../shared/infrastructure/database/types"

export class InventoryRepository extends Context.Tag("InventoryRepository")<
  InventoryRepository,
  {
    readonly getInventorySlots: (characterId: string) => Effect.Effect<InventorySlot[]>
    readonly getEquipmentSlots: (characterId: string) => Effect.Effect<Map<EquipmentSlotType, InventorySlot>>
    readonly getSlotById: (slotId: ItemId) => Effect.Effect<InventorySlot | null>
    readonly getSlotByIndex: (characterId: string, slotIndex: number) => Effect.Effect<InventorySlot | null>
    readonly saveSlot: (slot: InventorySlot) => Effect.Effect<InventorySlot>
    readonly saveSlots: (slots: InventorySlot[]) => Effect.Effect<InventorySlot[]>
    readonly deleteSlot: (slotId: ItemId) => Effect.Effect<void>
    readonly findStackableSlot: (characterId: string, itemDefId: number) => Effect.Effect<InventorySlot | null>
    readonly findEmptySlot: (characterId: string) => Effect.Effect<number | null>
  }
>() {}

export class ItemDefinitionRepository extends Context.Tag("ItemDefinitionRepository")<
  ItemDefinitionRepository,
  {
    readonly getById: (id: number) => Effect.Effect<ItemDefinition | null>
    readonly getByName: (name: string) => Effect.Effect<ItemDefinition | null>
    readonly getByCategory: (category: ItemCategory) => Effect.Effect<ItemDefinition[]>
  }
>() {}
