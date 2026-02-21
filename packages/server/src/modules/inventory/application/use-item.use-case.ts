import { Effect } from "effect"
import type { ItemId } from "../../../shared/kernel/types"
import { InventoryRepository } from "../ports/outbound/inventory.repository"
import { ItemNotFoundError, RequirementsNotMetError } from "../domain/errors"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { ItemUsed, ItemDropped } from "../events/published"

export const useItem = (
  characterId: string,
  slotId: ItemId,
): Effect.Effect<{ healHp?: number; healMp?: number; teleport?: boolean }, ItemNotFoundError | RequirementsNotMetError, InventoryRepository | EventBus> =>
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository
    const eventBus = yield* EventBus

    const slot = yield* inventoryRepo.getSlotById(slotId)
    if (!slot || slot?.characterId !== characterId) {
      return yield* Effect.fail(new ItemNotFoundError(slotId))
    }

    const itemDef = slot.itemDefinition
    if (!itemDef.isConsumable()) {
      return yield* Effect.fail(new RequirementsNotMetError("Item is not consumable"))
    }

    const stats = itemDef.stats
    const result: { healHp?: number; healMp?: number; teleport?: boolean } = {}

    if (stats.healHp) result.healHp = stats.healHp
    if (stats.healMp) result.healMp = stats.healMp
    if (stats.teleport) result.teleport = true

    if (slot.quantity > 1) {
      const updated = slot.withQuantity(slot.quantity - 1)
      yield* inventoryRepo.saveSlot(updated)
    } else {
      yield* inventoryRepo.deleteSlot(slotId)
    }

    yield* eventBus.publish(new ItemUsed({
      timestamp: new Date(),
      aggregateId: slotId,
      characterId,
      itemId: slotId,
      itemName: itemDef.name,
    }))

    return result
  })

export const dropItem = (
  characterId: string,
  slotId: ItemId,
  quantity: number,
  positionX: number,
  positionY: number,
  positionZ: number,
): Effect.Effect<void, ItemNotFoundError, InventoryRepository | EventBus> =>
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository
    const eventBus = yield* EventBus

    const slot = yield* inventoryRepo.getSlotById(slotId)
    if (!slot || slot?.characterId !== characterId) {
      return yield* Effect.fail(new ItemNotFoundError(slotId))
    }

    const dropQuantity = Math.min(quantity, slot.quantity)

    if (slot.quantity <= dropQuantity) {
      yield* inventoryRepo.deleteSlot(slotId)
    } else {
      const updated = slot.withQuantity(slot.quantity - dropQuantity)
      yield* inventoryRepo.saveSlot(updated)
    }

    yield* eventBus.publish(new ItemDropped({
      timestamp: new Date(),
      aggregateId: slotId,
      characterId,
      itemId: slotId,
      quantity: dropQuantity,
      positionX,
      positionY,
      positionZ,
    }))
  })
