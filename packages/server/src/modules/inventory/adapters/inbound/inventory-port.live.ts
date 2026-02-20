import { Effect, Layer } from "effect"
import { InventoryPort } from "../../ports/inbound/inventory.port"
import { InventoryRepository, ItemDefinitionRepository } from "../../ports/outbound/inventory.repository"
import { ItemId } from "../../../../shared/kernel/types"
import { InventorySlot } from "../../domain/entities/inventory-slot"
import type { EquipmentSlotType } from "../../domain/value-objects/equipment-slot"
import {
  ItemNotFoundError,
  InventoryFullError,
  InsufficientQuantityError,
  RequirementsNotMetError,
  InvalidSlotError,
  ItemDefinitionNotFoundError,
} from "../../domain/errors"
import { EventBus } from "../../../../shared/infrastructure/event-bus/index"
import { ItemPickedUp, ItemEquipped, ItemUnequipped, ItemUsed } from "../../events/published"

export const InventoryPortLive = Layer.effect(
  InventoryPort,
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository
    const itemDefRepo = yield* ItemDefinitionRepository
    const eventBus = yield* EventBus

    return {
      getInventory: (characterId: number) =>
        Effect.gen(function* () {
          return yield* inventoryRepo.getInventorySlots(characterId)
        }),

      getEquipment: (characterId: number) =>
        Effect.gen(function* () {
          return yield* inventoryRepo.getEquipmentSlots(characterId)
        }),

      addItem: (characterId: number, itemDefId: number, quantity: number) =>
        Effect.gen(function* () {
          const itemDef = yield* itemDefRepo.getById(itemDefId)
          if (!itemDef) {
            return yield* Effect.fail(new ItemDefinitionNotFoundError(itemDefId))
          }

          if (itemDef.isStackable()) {
            const existingSlot = yield* inventoryRepo.findStackableSlot(characterId, itemDefId)
            if (existingSlot) {
              const toAdd = Math.min(quantity, existingSlot.availableSpace())
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
        }),

      removeItem: (characterId: number, slotId: ItemId, quantity: number) =>
        Effect.gen(function* () {
          const slot = yield* inventoryRepo.getSlotById(slotId)
          if (!slot || slot.characterId !== characterId) {
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
        }),

      moveItem: (characterId: number, fromSlot: number, toSlot: number) =>
        Effect.gen(function* () {
          if (fromSlot < 0 || fromSlot >= 40 || toSlot < 0 || toSlot >= 40) {
            return yield* Effect.fail(new InvalidSlotError(`${fromSlot}->${toSlot}`))
          }

          const fromSlotItem = yield* inventoryRepo.getSlotByIndex(characterId, fromSlot)
          if (!fromSlotItem) {
            return yield* Effect.fail(new InvalidSlotError(`from_${fromSlot}`))
          }

          const toSlotItem = yield* inventoryRepo.getSlotByIndex(characterId, toSlot)

          if (toSlotItem) {
            const updatedFrom = fromSlotItem.withSlot("inventory", toSlot)
            const updatedTo = toSlotItem.withSlot("inventory", fromSlot)
            yield* inventoryRepo.saveSlot(updatedFrom)
            yield* inventoryRepo.saveSlot(updatedTo)
          } else {
            const updatedFrom = fromSlotItem.withSlot("inventory", toSlot)
            yield* inventoryRepo.saveSlot(updatedFrom)
          }
        }),

      equipItem: (characterId: number, slotId: ItemId, targetSlot: EquipmentSlotType) =>
        Effect.gen(function* () {
          const slot = yield* inventoryRepo.getSlotById(slotId)
          if (!slot || slot.characterId !== characterId) {
            return yield* Effect.fail(new ItemNotFoundError(slotId))
          }

          if (!slot.itemDefinition.isEquipment()) {
            return yield* Effect.fail(new RequirementsNotMetError("Item is not equipment"))
          }

          const existingEquipment = yield* inventoryRepo.getEquipmentSlots(characterId)
          const existingInSlot = existingEquipment.get(targetSlot)

          if (existingInSlot) {
            const emptySlotIndex = yield* inventoryRepo.findEmptySlot(characterId)
            if (emptySlotIndex !== null) {
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

          return equipped
        }),

      unequipItem: (characterId: number, slot: EquipmentSlotType) =>
        Effect.gen(function* () {
          const equipment = yield* inventoryRepo.getEquipmentSlots(characterId)
          const equippedItem = equipment.get(slot)

          if (!equippedItem) {
            return yield* Effect.fail(new InvalidSlotError(slot))
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

          return unequipped
        }),

      useItem: (characterId: number, slotId: ItemId) =>
        Effect.gen(function* () {
          const slot = yield* inventoryRepo.getSlotById(slotId)
          if (!slot || slot.characterId !== characterId) {
            return yield* Effect.fail(new ItemNotFoundError(slotId))
          }

          if (!slot.itemDefinition.isConsumable()) {
            return yield* Effect.fail(new RequirementsNotMetError("Item is not consumable"))
          }

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
            itemName: slot.itemDefinition.name,
          }))
        }),
    }
  }),
)
