import { Effect } from "effect"
import { ItemId } from "../../../shared/kernel/types"
import { InventorySlot } from "../domain/entities/inventory-slot"
import { InventoryRepository, ItemDefinitionRepository } from "../ports/outbound/inventory.repository"
import { InventoryFullError, ItemDefinitionNotFoundError } from "../domain/errors"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { ItemPickedUp } from "../events/published"

export const addItem = (
  characterId: string,
  itemDefId: number,
  quantity: number,
): Effect.Effect<InventorySlot, InventoryFullError | ItemDefinitionNotFoundError, InventoryRepository | ItemDefinitionRepository | EventBus> =>
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository
    const itemDefRepo = yield* ItemDefinitionRepository
    const eventBus = yield* EventBus

    const itemDef = yield* itemDefRepo.getById(itemDefId)
    if (!itemDef) {
      return yield* Effect.fail(new ItemDefinitionNotFoundError(itemDefId))
    }

    if (itemDef.isStackable()) {
      const existingSlot = yield* inventoryRepo.findStackableSlot(characterId, itemDefId)
      if (existingSlot) {
        const availableSpace = existingSlot.availableSpace()
        const toAdd = Math.min(quantity, availableSpace)
        const updated = existingSlot.addQuantity(toAdd)
        yield* inventoryRepo.saveSlot(updated)

        yield* eventBus.publish(new ItemPickedUp({
          timestamp: new Date(),
          aggregateId: updated.id,
          characterId,
          itemId: updated.id,
          itemName: itemDef.name,
          quantity: toAdd,
        }))

        return updated
      }
    }

    const emptySlotIndex = yield* inventoryRepo.findEmptySlot(characterId)
    if (emptySlotIndex === null) {
      return yield* Effect.fail(new InventoryFullError())
    }

    const slotId = ItemId(`item_${Date.now()}_${Math.random().toString(36).slice(2)}`)
    const newSlot = InventorySlot.create({
      id: slotId,
      characterId,
      itemDefinition: itemDef,
      quantity: Math.min(quantity, itemDef.maxStack),
      enhancementLevel: 0,
      durability: itemDef.isEquipment() ? 100 : null,
      slotType: "inventory",
      slotIndex: emptySlotIndex,
    })

    yield* inventoryRepo.saveSlot(newSlot)

    yield* eventBus.publish(new ItemPickedUp({
      timestamp: new Date(),
      aggregateId: newSlot.id,
      characterId,
      itemId: newSlot.id,
      itemName: itemDef.name,
      quantity: newSlot.quantity,
    }))

    return newSlot
  })
