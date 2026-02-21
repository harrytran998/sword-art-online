import { Effect, Layer } from "effect"
import { InventoryPort } from "../../ports/inbound/inventory.port"
import { InventoryRepository, ItemDefinitionRepository } from "../../ports/outbound/inventory.repository"
import { ItemId } from "../../../../shared/kernel/types"
import { InventorySlot } from "../../domain/entities/inventory-slot"
import type { EquipmentSlotType } from "../../domain/value-objects/equipment-slot"
import { InventoryLock } from "../../domain/security/inventory-lock"
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
import { dropItem as dropItemUseCase } from "../../application/use-item.use-case"
import { npcBuy as npcBuyUseCase, npcSell as npcSellUseCase } from "../../application/npc-trade.use-case"
import { PlayerPort } from "../../../player/ports/inbound/player.port"

export const InventoryPortLive = Layer.effect(
  InventoryPort,
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository
    const itemDefRepo = yield* ItemDefinitionRepository
    const inventoryLock = yield* InventoryLock
    const eventBus = yield* EventBus
    const playerPort = yield* PlayerPort

    return {
      getInventory: (characterId: string) =>
        Effect.gen(function* () {
          return yield* inventoryRepo.getInventorySlots(characterId)
        }),

      getEquipment: (characterId: string) =>
        Effect.gen(function* () {
          return yield* inventoryRepo.getEquipmentSlots(characterId)
        }),

      addItem: (characterId: string, itemDefId: number, quantity: number) =>
        inventoryLock.withLock(characterId, Effect.gen(function* () {
          const itemDef = yield* itemDefRepo.getById(itemDefId)
          if (!itemDef) {
            return yield* Effect.fail(new ItemDefinitionNotFoundError(itemDefId))
          }

          if (itemDef.isStackable()) {
            const existingSlot = yield* inventoryRepo.findStackableSlot(characterId, itemDefId)
            if (existingSlot) {
              const toAdd = Math.min(quantity, existingSlot.availableSpace())
              const updated = existingSlot.addQuantity(toAdd)
              const saved = yield* inventoryRepo.saveSlot(updated)

              yield* eventBus.publish(new ItemPickedUp({
                timestamp: new Date(),
                aggregateId: saved.id,
                characterId,
                itemId: saved.id,
                itemName: itemDef.name,
                quantity: toAdd,
              }))

              return saved
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

          const savedNewSlot = yield* inventoryRepo.saveSlot(newSlot)

          yield* eventBus.publish(new ItemPickedUp({
            timestamp: new Date(),
            aggregateId: savedNewSlot.id,
            characterId,
            itemId: savedNewSlot.id,
            itemName: itemDef.name,
            quantity: savedNewSlot.quantity,
          }))

          return savedNewSlot
        })),

      removeItem: (characterId: string, slotId: ItemId, quantity: number) =>
        inventoryLock.withLock(characterId, Effect.gen(function* () {
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
        })),

      moveItem: (characterId: string, fromSlot: number, toSlot: number) =>
        inventoryLock.withLock(characterId, Effect.gen(function* () {
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
            yield* inventoryRepo.saveSlots([updatedFrom, updatedTo])
          } else {
            const updatedFrom = fromSlotItem.withSlot("inventory", toSlot)
            yield* inventoryRepo.saveSlot(updatedFrom)
          }
        })),

      equipItem: (characterId: string, slotId: ItemId, targetSlot: EquipmentSlotType) =>
        inventoryLock.withLock(characterId, Effect.gen(function* () {
          const slot = yield* inventoryRepo.getSlotById(slotId)
          if (!slot || slot?.characterId !== characterId) {
            return yield* Effect.fail(new ItemNotFoundError(slotId))
          }

          if (!slot.itemDefinition.isEquipment()) {
            return yield* Effect.fail(new RequirementsNotMetError("Item is not equipment"))
          }

          const existingEquipment = yield* inventoryRepo.getEquipmentSlots(characterId)
          const existingInSlot = existingEquipment.get(targetSlot)

          let savedEquipped: InventorySlot
          const equipped = slot.withSlot(targetSlot, null)

          if (existingInSlot) {
            const emptySlotIndex = yield* inventoryRepo.findEmptySlot(characterId)
            if (emptySlotIndex === null) {
              return yield* Effect.fail(new InventoryFullError())
            }

            const unequipped = existingInSlot.withSlot("inventory", emptySlotIndex)
            const [savedUnequipped, savedEq] = (yield* inventoryRepo.saveSlots([
              unequipped,
              equipped,
            ])) as [InventorySlot, InventorySlot]
            savedEquipped = savedEq

            yield* eventBus.publish(new ItemUnequipped({
              timestamp: new Date(),
              aggregateId: savedUnequipped.id,
              characterId,
              itemId: savedUnequipped.id,
              slot: targetSlot,
            }))
          } else {
            savedEquipped = yield* inventoryRepo.saveSlot(equipped)
          }

          yield* eventBus.publish(new ItemEquipped({
            timestamp: new Date(),
            aggregateId: savedEquipped.id,
            characterId,
            itemId: savedEquipped.id,
            slot: targetSlot,
          }))

          return savedEquipped
        })),

      unequipItem: (characterId: string, slot: EquipmentSlotType) =>
        inventoryLock.withLock(characterId, Effect.gen(function* () {
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
          const savedUnequipped = yield* inventoryRepo.saveSlot(unequipped)

          yield* eventBus.publish(new ItemUnequipped({
            timestamp: new Date(),
            aggregateId: savedUnequipped.id,
            characterId,
            itemId: savedUnequipped.id,
            slot,
          }))

          return savedUnequipped
        })),

      useItem: (characterId: string, slotId: ItemId) =>
        inventoryLock.withLock(characterId, Effect.gen(function* () {
          const slot = yield* inventoryRepo.getSlotById(slotId)
          if (!slot || slot?.characterId !== characterId) {
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
        })),

      dropItem: (
        characterId: string,
        slotId: ItemId,
        quantity: number,
        positionX: number,
        positionY: number,
        positionZ: number,
      ) => inventoryLock.withLock(
        characterId, 
        dropItemUseCase(characterId, slotId, quantity, positionX, positionY, positionZ).pipe(
          Effect.provideService(InventoryRepository, inventoryRepo),
          Effect.provideService(EventBus, eventBus)
        )
      ),

      npcBuy: (
        characterId: string,
        npcId: string,
        itemDefId: number,
        quantity: number,
      ) => inventoryLock.withLock(
        characterId,
        npcBuyUseCase(characterId, npcId, itemDefId, quantity).pipe(
          Effect.provideService(InventoryRepository, inventoryRepo),
          Effect.provideService(ItemDefinitionRepository, itemDefRepo),
          Effect.provideService(PlayerPort, playerPort),
          Effect.provideService(EventBus, eventBus)
        )
      ),

      npcSell: (
        characterId: string,
        npcId: string,
        slotId: ItemId,
        quantity: number,
      ) => inventoryLock.withLock(
        characterId,
        npcSellUseCase(characterId, npcId, slotId, quantity).pipe(
          Effect.provideService(InventoryRepository, inventoryRepo),
          Effect.provideService(PlayerPort, playerPort)
        )
      ),
    }
  }),
)
