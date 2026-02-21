import { Effect } from "effect"
import { ItemId } from "../../../shared/kernel/types"
import { InventorySlot } from "../domain/entities/inventory-slot"
import { InventoryRepository, ItemDefinitionRepository } from "../ports/outbound/inventory.repository"
import { PlayerPort } from "../../player/ports/inbound/player.port"
import { 
  ItemDefinitionNotFoundError, 
  InventoryFullError, 
  ItemNotFoundError,
  RequirementsNotMetError,
  InsufficientQuantityError
} from "../domain/errors"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { ItemPickedUp } from "../events/published"
import { PlayerNotFoundError } from "@/modules/player/domain"

export const npcBuy = (
  characterId: string,
  _npcId: string,
  itemDefId: number,
  quantity: number,
): Effect.Effect<
  InventorySlot, 
  ItemDefinitionNotFoundError | InventoryFullError | RequirementsNotMetError | PlayerNotFoundError | Error, 
  InventoryRepository | ItemDefinitionRepository | PlayerPort | EventBus
> =>
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository
    const itemDefRepo = yield* ItemDefinitionRepository
    const playerPort = yield* PlayerPort
    const eventBus = yield* EventBus

    const itemDef = yield* itemDefRepo.getById(itemDefId)
    if (!itemDef) {
      return yield* Effect.fail(new ItemDefinitionNotFoundError(itemDefId))
    }

    if (!itemDef.basePrice) {
      return yield* Effect.fail(new RequirementsNotMetError("Item cannot be bought"))
    }

    const totalCost = itemDef.basePrice * quantity
    
    // Check if player has enough money and deduct it
    // In a full implementation, this should be an atomic transaction via PlayerPort or EconomySystem.
    // If the player doesn't have enough, it would fail here.

    // 1. Validate Proximity (Stubbed out here for future NpcPort integration)
    // const npcPort = yield* NpcPort
    // yield* npcPort.validateProximity(characterId, npcId)
    
    yield* playerPort.deductCurrency(characterId, totalCost)

    let purchasedSlot: InventorySlot

    if (itemDef.isStackable()) {
      const existingSlot = yield* inventoryRepo.findStackableSlot(characterId, itemDefId)
      if (existingSlot) {
        const availableSpace = existingSlot.availableSpace()
        const toAdd = Math.min(quantity, availableSpace)
        const updated = existingSlot.addQuantity(toAdd)
        purchasedSlot = yield* inventoryRepo.saveSlot(updated)
        
        yield* eventBus.publish(new ItemPickedUp({
          timestamp: new Date(),
          aggregateId: purchasedSlot.id,
          characterId,
          itemId: purchasedSlot.id,
          itemName: itemDef.name,
          quantity: toAdd,
        }))

        return purchasedSlot
      }
    }

    const emptySlotIndex = yield* inventoryRepo.findEmptySlot(characterId)
    if (emptySlotIndex === null) {
      // Refund money if inventory is full after all
      yield* playerPort.addCurrency(characterId, totalCost)
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

    purchasedSlot = yield* inventoryRepo.saveSlot(newSlot)

    yield* eventBus.publish(new ItemPickedUp({
      timestamp: new Date(),
      aggregateId: purchasedSlot.id,
      characterId,
      itemId: purchasedSlot.id,
      itemName: itemDef.name,
      quantity: purchasedSlot.quantity,
    }))

    return purchasedSlot
  })

export const npcSell = (
  characterId: string,
  _npcId: string,
  slotId: ItemId,
  quantity: number,
): Effect.Effect<
  void, 
  ItemNotFoundError | RequirementsNotMetError | InsufficientQuantityError | PlayerNotFoundError, 
  InventoryRepository | PlayerPort
> =>
  Effect.gen(function* () {
    const inventoryRepo = yield* InventoryRepository
    const playerPort = yield* PlayerPort

    const slot = yield* inventoryRepo.getSlotById(slotId)
    if (!slot || slot.characterId !== characterId) {
      return yield* Effect.fail(new ItemNotFoundError(slotId))
    }

    if (!slot.itemDefinition.basePrice) {
      return yield* Effect.fail(new RequirementsNotMetError("Item cannot be sold"))
    }

    if (slot.quantity < quantity) {
      return yield* Effect.fail(new InsufficientQuantityError(quantity, slot.quantity))
    }

    // Sell price is typically lower than base price, e.g. 50%
    const totalEarnings = Math.floor(slot.itemDefinition.basePrice * quantity * 0.5)

    // 1. Validate Proximity (Stubbed out here for future NpcPort integration)
    // const npcPort = yield* NpcPort
    // yield* npcPort.validateProximity(characterId, npcId)

    if (slot.quantity <= quantity) {
      yield* inventoryRepo.deleteSlot(slotId)
    } else {
      const updated = slot.withQuantity(slot.quantity - quantity)
      yield* inventoryRepo.saveSlot(updated)
    }

    yield* playerPort.addCurrency(characterId, totalEarnings)
  })
