import { Context, Effect, Layer } from "effect"
import type { ZoneId, PlayerId } from "../../../shared/kernel/types"
import { DroppedLoot } from "../domain/entities/dropped-loot"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { LootPickedUp } from "../events/published"

export class DroppedLootRepository extends Context.Tag("DroppedLootRepository")<
  DroppedLootRepository,
  {
    readonly getDroppedLootInZone: (zoneId: ZoneId) => Effect.Effect<DroppedLoot[]>
    readonly getDroppedLootById: (id: string) => Effect.Effect<DroppedLoot | null>
    readonly saveDroppedLoot: (loot: DroppedLoot) => Effect.Effect<void>
    readonly deleteDroppedLoot: (id: string) => Effect.Effect<void>
  }
>() {}

const droppedLootStore = new Map<string, DroppedLoot>()

export const InMemoryDroppedLootRepositoryLive = Layer.effect(
  DroppedLootRepository,
  Effect.gen(function* () {
    return {
      getDroppedLootInZone: (zoneId: ZoneId) =>
        Effect.gen(function* () {
          return Array.from(droppedLootStore.values()).filter((loot) => loot.zoneId === zoneId)
        }),

      getDroppedLootById: (id: string) =>
        Effect.gen(function* () {
          return droppedLootStore.get(id) ?? null
        }),

      saveDroppedLoot: (loot: DroppedLoot) =>
        Effect.gen(function* () {
          droppedLootStore.set(loot.id, loot)
        }),

      deleteDroppedLoot: (id: string) =>
        Effect.gen(function* () {
          droppedLootStore.delete(id)
        }),
    }
  }),
)

export interface PickupLootResult {
  readonly success: boolean
  readonly loot: DroppedLoot | null
  readonly reason?: string
}

export const pickupLoot = (
  lootId: string,
  playerId: PlayerId,
  playerX: number,
  playerZ: number,
): Effect.Effect<PickupLootResult, never, DroppedLootRepository | EventBus> =>
  Effect.gen(function* () {
    const lootRepo = yield* DroppedLootRepository
    const eventBus = yield* EventBus

    const loot = yield* lootRepo.getDroppedLootById(lootId)
    if (!loot) {
      return { success: false, loot: null, reason: "Loot not found" }
    }

    if (!loot.isInRange(playerX, playerZ, 2.0)) {
      return { success: false, loot: null, reason: "Too far away" }
    }

    if (loot.isProtected(playerId)) {
      return { success: false, loot: null, reason: "Loot is protected" }
    }

    yield* lootRepo.deleteDroppedLoot(lootId)

    yield* eventBus.publish(
      new LootPickedUp({
        timestamp: new Date(),
        aggregateId: lootId,
        lootId,
        playerId,
        itemName: loot.itemName,
        quantity: loot.quantity,
      }),
    )

    return { success: true, loot }
  })

export const createDroppedLoot = (
  loot: DroppedLoot,
): Effect.Effect<void, never, DroppedLootRepository> =>
  Effect.gen(function* () {
    const lootRepo = yield* DroppedLootRepository
    yield* lootRepo.saveDroppedLoot(loot)
  })
