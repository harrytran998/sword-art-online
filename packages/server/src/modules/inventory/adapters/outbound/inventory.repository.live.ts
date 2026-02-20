import { Effect, Layer } from "effect"
import { InventoryRepository, ItemDefinitionRepository } from "../../ports/outbound/inventory.repository"
import { DatabaseService } from "../../../../shared/infrastructure/database/index"
import { InventorySlot } from "../../domain/entities/inventory-slot"
import { ItemDefinition } from "../../domain/entities/item-definition"
import type { ItemId } from "../../../../shared/kernel/types"
import type { EquipmentSlotType } from "../../domain/value-objects/equipment-slot"
import type { ItemCategory } from "../../../../shared/infrastructure/database/types"

const inventoryStore = new Map<ItemId, InventorySlot>()

export const InMemoryInventoryRepositoryLive = Layer.effect(
  InventoryRepository,
  Effect.gen(function* () {
    return {
      getInventorySlots: (characterId: number) =>
        Effect.gen(function* () {
          return Array.from(inventoryStore.values()).filter(
            (slot) => slot.characterId === characterId && slot.slotType === "inventory",
          )
        }),

      getEquipmentSlots: (characterId: number) =>
        Effect.gen(function* () {
          const equipment = new Map<EquipmentSlotType, InventorySlot>()
          for (const slot of inventoryStore.values()) {
            if (slot.characterId === characterId && slot.slotType && slot.slotType !== "inventory") {
              equipment.set(slot.slotType as EquipmentSlotType, slot)
            }
          }
          return equipment
        }),

      getSlotById: (slotId: ItemId) =>
        Effect.gen(function* () {
          return inventoryStore.get(slotId) ?? null
        }),

      getSlotByIndex: (characterId: number, slotIndex: number) =>
        Effect.gen(function* () {
          for (const slot of inventoryStore.values()) {
            if (slot.characterId === characterId && slot.slotIndex === slotIndex) {
              return slot
            }
          }
          return null
        }),

      saveSlot: (slot: InventorySlot) =>
        Effect.gen(function* () {
          inventoryStore.set(slot.id, slot)
        }),

      deleteSlot: (slotId: ItemId) =>
        Effect.gen(function* () {
          inventoryStore.delete(slotId)
        }),

      findStackableSlot: (characterId: number, itemDefId: number) =>
        Effect.gen(function* () {
          for (const slot of inventoryStore.values()) {
            if (
              slot.characterId === characterId &&
              slot.itemDefinition.id === itemDefId &&
              slot.slotType === "inventory" &&
              slot.quantity < slot.itemDefinition.maxStack
            ) {
              return slot
            }
          }
          return null
        }),

      findEmptySlot: (characterId: number) =>
        Effect.gen(function* () {
          const usedSlots = new Set<number>()
          for (const slot of inventoryStore.values()) {
            if (slot.characterId === characterId && slot.slotType === "inventory" && slot.slotIndex !== null) {
              usedSlots.add(slot.slotIndex)
            }
          }
          for (let i = 0; i < 40; i++) {
            if (!usedSlots.has(i)) return i
          }
          return null
        }),
    }
  }),
)

export const PgItemDefinitionRepositoryLive = Layer.effect(
  ItemDefinitionRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService

    return {
      getById: (id: number) =>
        Effect.gen(function* () {
          const row = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.item_definitions")
              .selectAll()
              .where("id", "=", id)
              .executeTakeFirst(),
          ).pipe(Effect.orDie)

          if (!row) return null

          return ItemDefinition.create({
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            subcategory: row.subcategory,
            rarity: row.rarity,
            stats: JSON.parse(row.stats as string) ?? {},
            requirements: JSON.parse(row.requirements as string) ?? {},
            maxStack: row.max_stack,
            tradeable: row.tradeable,
            basePrice: row.base_price,
          })
        }),

      getByName: (name: string) =>
        Effect.gen(function* () {
          const row = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.item_definitions")
              .selectAll()
              .where("name", "=", name)
              .executeTakeFirst(),
          ).pipe(Effect.orDie)

          if (!row) return null

          return ItemDefinition.create({
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            subcategory: row.subcategory,
            rarity: row.rarity,
            stats: JSON.parse(row.stats as string) ?? {},
            requirements: JSON.parse(row.requirements as string) ?? {},
            maxStack: row.max_stack,
            tradeable: row.tradeable,
            basePrice: row.base_price,
          })
        }),

      getByCategory: (category: ItemCategory) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.item_definitions")
              .selectAll()
              .where("category", "=", category)
              .execute(),
          ).pipe(Effect.orDie)

          return rows.map((row) =>
            ItemDefinition.create({
              id: row.id,
              name: row.name,
              description: row.description,
              category: row.category,
              subcategory: row.subcategory,
              rarity: row.rarity,
              stats: JSON.parse(row.stats as string) ?? {},
              requirements: JSON.parse(row.requirements as string) ?? {},
              maxStack: row.max_stack,
              tradeable: row.tradeable,
              basePrice: row.base_price,
            }),
          )
        }),
    }
  }),
)
