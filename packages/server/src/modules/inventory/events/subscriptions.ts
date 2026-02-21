import { Effect, Layer } from "effect"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { MonsterKilled } from "../../monster/events/published"
import { ItemDropped } from "./published"
import { ItemId } from "../../../shared/kernel/types"

export const InventorySubscriptionsLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const eventBus = yield* EventBus

    // Subscribe to MonsterKilled to generate loot
    yield* eventBus.subscribe(
      "MonsterKilled",
      (event: MonsterKilled) =>
        Effect.gen(function* () {
          // Note for Full Implementation:
          // We would query a LootTableRepository to get drop chances for the specific monsterId.
          
          // Basic Potion is ID 1 (based on consumables seed)
          // Beginner Sword is ID 2 (based on equipment seed)
          // Slime Gel is ID 100 (based on floor 1 drops seed)
          
          const roll = Math.random()
          let itemDefId: number | null = null
          let quantity = 1

          if (roll < 0.1) {
            itemDefId = 2 // 10% chance for Beginner Sword
          } else if (roll < 0.4) {
            itemDefId = 1 // 30% chance for Potion
            quantity = Math.floor(Math.random() * 3) + 1 // 1-3 potions
          } else if (roll < 0.8) {
            itemDefId = 100 // 40% chance for Slime Gel
            quantity = Math.floor(Math.random() * 5) + 1 // 1-5 gels
          }

          if (itemDefId !== null) {
            yield* eventBus.publish(new ItemDropped({
              timestamp: new Date(),
              aggregateId: `loot_${Date.now()}`,
              characterId: event.killedBy, // Attribute loot to the killer
              itemId: ItemId(`item_${Date.now()}_${Math.random().toString(36).slice(2)}`),
              quantity,
              // Stubs for position until World module is fully integrated with Monster module events
              positionX: 0,
              positionY: 0,
              positionZ: 0,
            }))
          }
        }).pipe(
          Effect.catchAll((error) =>
            Effect.sync(() => console.error("Failed to process MonsterKilled loot:", error))
          )
        )
    )
  })
)
