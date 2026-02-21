import { Context, Effect } from "effect"
import { ItemId } from "../../../../shared/kernel/types"
import { InventorySlot } from "../../domain/entities/inventory-slot"
import { EquipmentSlotType } from "../../domain/value-objects/equipment-slot"
import {
  ItemNotFoundError,
  InventoryFullError,
  InsufficientQuantityError,
  RequirementsNotMetError,
  InvalidSlotError,
  ItemDefinitionNotFoundError,
} from "../../domain/errors"
import { InventoryLockError } from "../../domain/security/inventory-lock"
import { PlayerNotFoundError } from "@/modules/player/domain"

export class InventoryPort extends Context.Tag("InventoryPort")<
  InventoryPort,
  {
    readonly getInventory: (characterId: string) => Effect.Effect<InventorySlot[]>
    readonly getEquipment: (characterId: string) => Effect.Effect<Map<EquipmentSlotType, InventorySlot>>
    readonly addItem: (
      characterId: string,
      itemDefId: number,
      quantity: number,
    ) => Effect.Effect<InventorySlot, ItemDefinitionNotFoundError | InventoryFullError | InventoryLockError>
    readonly removeItem: (
      characterId: string,
      slotId: ItemId,
      quantity: number,
    ) => Effect.Effect<void, ItemNotFoundError | InsufficientQuantityError | InventoryLockError>
    readonly moveItem: (
      characterId: string,
      fromSlot: number,
      toSlot: number,
    ) => Effect.Effect<void, InvalidSlotError | InventoryLockError>
    readonly equipItem: (
      characterId: string,
      slotId: ItemId,
      targetSlot: EquipmentSlotType,
    ) => Effect.Effect<
      InventorySlot,
      ItemNotFoundError | RequirementsNotMetError | InventoryFullError | InventoryLockError
    >
    readonly unequipItem: (
      characterId: string,
      slot: EquipmentSlotType,
    ) => Effect.Effect<InventorySlot, InvalidSlotError | InventoryFullError | InventoryLockError>
    readonly useItem: (
      characterId: string,
      slotId: ItemId,
    ) => Effect.Effect<void, ItemNotFoundError | RequirementsNotMetError | InventoryLockError>
    readonly dropItem: (
      characterId: string,
      slotId: ItemId,
      quantity: number,
      positionX: number,
      positionY: number,
      positionZ: number,
    ) => Effect.Effect<void, ItemNotFoundError | InventoryLockError>
    readonly npcBuy: (
      characterId: string,
      npcId: string,
      itemDefId: number,
      quantity: number,
    ) => Effect.Effect<
      InventorySlot,
      ItemDefinitionNotFoundError | InventoryFullError | RequirementsNotMetError | InventoryLockError | PlayerNotFoundError | Error
    >
    readonly npcSell: (
      characterId: string,
      npcId: string,
      slotId: ItemId,
      quantity: number,
    ) => Effect.Effect<void, ItemNotFoundError | RequirementsNotMetError | InsufficientQuantityError | InventoryLockError | PlayerNotFoundError>
  }
>() {}
