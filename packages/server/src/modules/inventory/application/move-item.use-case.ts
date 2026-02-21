import { Effect } from "effect"
import type { ItemId } from "../../../shared/kernel/types"
import { InventoryRepository } from "../ports/outbound/inventory.repository"
import { ItemNotFoundError, InsufficientQuantityError } from "../domain/errors"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"

export const removeItem = (
  characterId: string,
  slotId: ItemId,
  quantity: number,
): Effect.Effect<void, ItemNotFoundError | InsufficientQuantityError, InventoryRepository | EventBus> =>
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository

    const slot = yield* inventoryRepo.getSlotById(slotId)
    if (!slot || slot?.characterId !== characterId) {
      return yield* Effect.fail(new ItemNotFoundError(slotId))
    }

    if (slot.quantity < quantity) {
      return yield* Effect.fail(new InsufficientQuantityError(quantity, slot.quantity))
    }

    if (slot.quantity === quantity) {
      yield* inventoryRepo.deleteSlot(slotId)
    } else {
      const updated = slot.withQuantity(slot.quantity - quantity)
      yield* inventoryRepo.saveSlot(updated)
    }
  })

export const moveItem = (
  characterId: string,
  fromSlotIndex: number,
  toSlotIndex: number,
): Effect.Effect<void, ItemNotFoundError, InventoryRepository> =>
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository

    if (fromSlotIndex < 0 || fromSlotIndex >= 40 || toSlotIndex < 0 || toSlotIndex >= 40) {
      return yield* Effect.fail(new ItemNotFoundError(`invalid_slot_${fromSlotIndex}_${toSlotIndex}` as ItemId))
    }

    const fromSlot = yield* inventoryRepo.getSlotByIndex(characterId, fromSlotIndex)
    if (!fromSlot) {
      return yield* Effect.fail(new ItemNotFoundError(`slot_${fromSlotIndex}` as ItemId))
    }

    const toSlot = yield* inventoryRepo.getSlotByIndex(characterId, toSlotIndex)

    if (toSlot) {
      const updatedFrom = fromSlot.withSlot("inventory", toSlotIndex)
      const updatedTo = toSlot.withSlot("inventory", fromSlotIndex)
      yield* inventoryRepo.saveSlot(updatedFrom)
      yield* inventoryRepo.saveSlot(updatedTo)
    } else {
      const updatedFrom = fromSlot.withSlot("inventory", toSlotIndex)
      yield* inventoryRepo.saveSlot(updatedFrom)
    }
  })
