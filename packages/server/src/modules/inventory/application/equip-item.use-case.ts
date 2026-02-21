import { Effect } from "effect"
import type { ItemId } from "../../../shared/kernel/types"
import { InventoryRepository } from "../ports/outbound/inventory.repository"
import { isEquipmentSlot, type EquipmentSlotType } from "../domain/value-objects/equipment-slot"
import { ItemNotFoundError, RequirementsNotMetError, InvalidSlotError, InventoryFullError, EquipmentSlotOccupiedError } from "../domain/errors"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { ItemEquipped, ItemUnequipped } from "../events/published"

export const equipItem = (
  characterId: string,
  slotId: ItemId,
  targetSlot: EquipmentSlotType,
): Effect.Effect<void, ItemNotFoundError | RequirementsNotMetError | InvalidSlotError | EquipmentSlotOccupiedError, InventoryRepository | EventBus> =>
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository
    const eventBus = yield* EventBus

    if (!isEquipmentSlot(targetSlot)) {
      return yield* Effect.fail(new InvalidSlotError(targetSlot))
    }

    const slot = yield* inventoryRepo.getSlotById(slotId)
    if (!slot || slot?.characterId !== characterId) {
      return yield* Effect.fail(new ItemNotFoundError(slotId))
    }

    const itemDef = slot.itemDefinition
    if (!itemDef.isEquipment()) {
      return yield* Effect.fail(new RequirementsNotMetError("Item is not equipment"))
    }

    const existingEquipment = yield* inventoryRepo.getEquipmentSlots(characterId)
    const existingInSlot = existingEquipment.get(targetSlot)

    if (existingInSlot) {
      const emptySlotIndex = yield* inventoryRepo.findEmptySlot(characterId)
      if (emptySlotIndex === null) {
        const unequipped = existingInSlot.withSlot("inventory", null)
        yield* inventoryRepo.saveSlot(unequipped)
      } else {
        const unequipped = existingInSlot.withSlot("inventory", emptySlotIndex)
        yield* inventoryRepo.saveSlot(unequipped)

        yield* eventBus.publish(new ItemUnequipped({
          timestamp: new Date(),
          aggregateId: unequipped.id,
          characterId,
          itemId: unequipped.id,
          slot: targetSlot,
        }))
      }
    }

    const equipped = slot.withSlot(targetSlot, null)
    yield* inventoryRepo.saveSlot(equipped)

    yield* eventBus.publish(new ItemEquipped({
      timestamp: new Date(),
      aggregateId: equipped.id,
      characterId,
      itemId: equipped.id,
      slot: targetSlot,
    }))
  })

export const unequipItem = (
  characterId: string,
  slot: EquipmentSlotType,
): Effect.Effect<void, InvalidSlotError | InventoryFullError, InventoryRepository | EventBus> =>
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository
    const eventBus = yield* EventBus

    if (!isEquipmentSlot(slot)) {
      return yield* Effect.fail(new InvalidSlotError(slot))
    }

    const equipment = yield* inventoryRepo.getEquipmentSlots(characterId)
    const equippedItem = equipment.get(slot)

    if (!equippedItem) {
      return
    }

    const emptySlotIndex = yield* inventoryRepo.findEmptySlot(characterId)
    if (emptySlotIndex === null) {
      return yield* Effect.fail(new InventoryFullError())
    }

    const unequipped = equippedItem.withSlot("inventory", emptySlotIndex)
    yield* inventoryRepo.saveSlot(unequipped)

    yield* eventBus.publish(new ItemUnequipped({
      timestamp: new Date(),
      aggregateId: unequipped.id,
      characterId,
      itemId: unequipped.id,
      slot,
    }))
  })
