import { Effect, Layer } from "effect"
import { InventoryRepository, ItemDefinitionRepository } from "../../ports/outbound/inventory.repository"
import { DatabaseService } from "../../../../shared/infrastructure/database/index"
import { InventorySlot } from "../../domain/entities/inventory-slot"
import { ItemDefinition } from "../../domain/entities/item-definition"
import type { ItemId } from "../../../../shared/kernel/types"
import type { EquipmentSlotType } from "../../domain/value-objects/equipment-slot"
import type { ItemCategory } from "../../../../shared/infrastructure/database/types"

export const PgInventoryRepositoryLive = Layer.effect(
  InventoryRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseService

    const mapRowToSlot = (row: any): InventorySlot => {
      const itemDef = ItemDefinition.create({
        id: row.def_id,
        name: row.name,
        description: row.description,
        category: row.category,
        subcategory: row.subcategory,
        rarity: row.rarity,
        stats: typeof row.stats === "string" ? JSON.parse(row.stats) : row.stats ?? {},
        requirements: typeof row.requirements === "string" ? JSON.parse(row.requirements) : row.requirements ?? {},
        maxStack: row.max_stack,
        tradeable: row.tradeable,
        basePrice: row.base_price,
      })

      return InventorySlot.create({
        id: row.id.toString() as ItemId,
        characterId: row.character_id,
        itemDefinition: itemDef,
        quantity: row.quantity,
        enhancementLevel: row.enhancement_level,
        durability: row.durability,
        slotType: row.slot_type,
        slotIndex: row.slot_index,
      })
    }

    return {
      getInventorySlots: (characterId: string) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.character_inventory as ci")
              .innerJoin("sao.item_definitions as id", "ci.item_def_id", "id.id")
              .selectAll()
              .select(["id.id as def_id", "ci.id as id"])
              .where("ci.character_id", "=", characterId)
              .where("ci.slot_type", "=", "inventory")
              .execute(),
          ).pipe(Effect.orDie)

          return rows.map(mapRowToSlot)
        }),

      getEquipmentSlots: (characterId: string) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.character_inventory as ci")
              .innerJoin("sao.item_definitions as id", "ci.item_def_id", "id.id")
              .selectAll()
              .select(["id.id as def_id", "ci.id as id"])
              .where("ci.character_id", "=", characterId)
              .where("ci.slot_type", "!=", "inventory")
              .where("ci.slot_type", "is not", null)
              .execute(),
          ).pipe(Effect.orDie)

          const equipment = new Map<EquipmentSlotType, InventorySlot>()
          for (const row of rows) {
            const slot = mapRowToSlot(row)
            if (slot.slotType && slot.slotType !== "inventory") {
              equipment.set(slot.slotType as EquipmentSlotType, slot)
            }
          }
          return equipment
        }),

      getSlotById: (slotId: ItemId) =>
        Effect.gen(function* () {
          const row = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.character_inventory as ci")
              .innerJoin("sao.item_definitions as id", "ci.item_def_id", "id.id")
              .selectAll()
              .select(["id.id as def_id", "ci.id as id"])
              .where("ci.id", "=", Number.parseInt(slotId))
              .executeTakeFirst(),
          ).pipe(Effect.orDie)

          return row ? mapRowToSlot(row) : null
        }),

      getSlotByIndex: (characterId: string, slotIndex: number) =>
        Effect.gen(function* () {
          const row = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.character_inventory as ci")
              .innerJoin("sao.item_definitions as id", "ci.item_def_id", "id.id")
              .selectAll()
              .select(["id.id as def_id", "ci.id as id"])
              .where("ci.character_id", "=", characterId)
              .where("ci.slot_type", "=", "inventory")
              .where("ci.slot_index", "=", slotIndex)
              .executeTakeFirst(),
          ).pipe(Effect.orDie)

          return row ? mapRowToSlot(row) : null
        }),

      saveSlot: (slot: InventorySlot) =>
        Effect.gen(function* () {
          if (slot.id.startsWith("item_")) {
            // New item - insert
            const result = yield* Effect.tryPromise(() =>
              db.kysely
                .insertInto("sao.character_inventory")
                .values({
                  character_id: slot.characterId,
                  item_def_id: slot.itemDefinition.id,
                  quantity: slot.quantity,
                  enhancement_level: slot.enhancementLevel,
                  enhancement_stats: '{}',
                  durability: slot.durability,
                  slot_type: slot.slotType as EquipmentSlotType,
                  slot_index: slot.slotIndex,
                })
                .returning("id")
                .executeTakeFirstOrThrow()
            ).pipe(Effect.orDie)
            
            // Since we can't easily modify private props, let's just recreate it via create()
            const props = (slot as any).props
            return InventorySlot.create({ ...props, id: result.id.toString() as ItemId })
          } else {
            // Existing item - update
            yield* Effect.tryPromise(() =>
              db.kysely
                .updateTable("sao.character_inventory")
                .set({
                  quantity: slot.quantity,
                  enhancement_level: slot.enhancementLevel,
                  durability: slot.durability,
                  slot_type: slot.slotType as EquipmentSlotType,
                  slot_index: slot.slotIndex,
                })
                .where("id", "=", Number.parseInt(slot.id))
                .execute()
            ).pipe(Effect.orDie)
            
            return slot
          }
        }),

      saveSlots: (slots: InventorySlot[]) =>
        Effect.gen(function* () {
          // Wrap all slot saves in a generic transaction
          const updatedSlots = yield* Effect.tryPromise(() =>
            db.kysely.transaction().execute(async (trx) => {
              const results: InventorySlot[] = []
              for (const slot of slots) {
                if (slot.id.startsWith("item_")) {
                  const result = await trx
                    .insertInto("sao.character_inventory")
                    .values({
                      character_id: slot.characterId,
                      item_def_id: slot.itemDefinition.id,
                      quantity: slot.quantity,
                      enhancement_level: slot.enhancementLevel,
                      enhancement_stats: '{}',
                      durability: slot.durability,
                      slot_type: slot.slotType as EquipmentSlotType,
                      slot_index: slot.slotIndex,
                    })
                    .returning("id")
                    .executeTakeFirstOrThrow()
                    
                  const props = (slot as any).props
                  results.push(InventorySlot.create({ ...props, id: result.id.toString() as ItemId }))
                } else {
                  await trx
                    .updateTable("sao.character_inventory")
                    .set({
                      quantity: slot.quantity,
                      enhancement_level: slot.enhancementLevel,
                      durability: slot.durability,
                      slot_type: slot.slotType as EquipmentSlotType,
                      slot_index: slot.slotIndex,
                    })
                    .where("id", "=", Number.parseInt(slot.id))
                    .execute()
                    
                  results.push(slot)
                }
              }
              return results
            })
          ).pipe(Effect.orDie)
          
          return updatedSlots
        }),

      deleteSlot: (slotId: ItemId) =>
        Effect.gen(function* () {
          yield* Effect.tryPromise(() =>
            db.kysely
              .deleteFrom("sao.character_inventory")
              .where("id", "=", Number.parseInt(slotId))
              .execute()
          ).pipe(Effect.orDie)
        }),

      findStackableSlot: (characterId: string, itemDefId: number) =>
        Effect.gen(function* () {
          // Join with item_definitions to get maxStack directly via the mapped entity
          const row = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.character_inventory as ci")
              .innerJoin("sao.item_definitions as id", "ci.item_def_id", "id.id")
              .selectAll()
              .select(["id.id as def_id", "ci.id as id"])
              .where("ci.character_id", "=", characterId)
              .where("ci.item_def_id", "=", itemDefId)
              .where("ci.slot_type", "=", "inventory")
              .whereRef("ci.quantity", "<", "id.max_stack")
              .executeTakeFirst(),
          ).pipe(Effect.orDie)

          return row ? mapRowToSlot(row) : null
        }),

      findEmptySlot: (characterId: string) =>
        Effect.gen(function* () {
          const rows = yield* Effect.tryPromise(() =>
            db.kysely
              .selectFrom("sao.character_inventory")
              .select("slot_index")
              .where("character_id", "=", characterId)
              .where("slot_type", "=", "inventory")
              .where("slot_index", "is not", null)
              .execute()
          ).pipe(Effect.orDie)

          const usedSlots = new Set(rows.map(r => r.slot_index))
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
            stats: JSON.parse(row.stats) ?? {},
            requirements: JSON.parse(row.requirements) ?? {},
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
            stats: JSON.parse(row.stats) ?? {},
            requirements: JSON.parse(row.requirements) ?? {},
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
              stats: JSON.parse(row.stats) ?? {},
              requirements: JSON.parse(row.requirements) ?? {},
              maxStack: row.max_stack,
              tradeable: row.tradeable,
              basePrice: row.base_price,
            }),
          )
        }),
    }
  }),
)
