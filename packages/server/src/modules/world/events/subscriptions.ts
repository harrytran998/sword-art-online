import { Effect, Layer } from "effect"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import type { BossDefeated } from "../../monster/events/boss-events"
import { unlockFloor } from "../application/unlock-floor.use-case"
import { ZoneRepository } from "../ports/outbound/zone.repository"
import { DatabaseService } from "../../../shared/infrastructure/database/index"
import type { FloorId, PlayerId } from "../../../shared/kernel/types"

/**
 * World module event subscriptions.
 * Subscribes to BossDefeated events to trigger floor unlocks.
 */
export const WorldSubscriptionsLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const eventBus = yield* EventBus
    const zoneRepo = yield* ZoneRepository
    const db = yield* DatabaseService

    // When a boss is defeated, unlock the next floor
    yield* eventBus.subscribe(
      "BossDefeated",
      (event: BossDefeated) =>
        Effect.gen(function* () {
          const nextFloorId = (event.floorId + 1) as FloorId
          yield* unlockFloor(nextFloorId, event.lastAttackPlayerId as PlayerId).pipe(
            Effect.provide(Layer.succeed(ZoneRepository, zoneRepo)),
            Effect.provide(Layer.succeed(EventBus, eventBus)),
            Effect.provide(Layer.succeed(DatabaseService, db)),
          )
          yield* Effect.logInfo(
            `Boss defeated on floor ${event.floorId} — floor ${nextFloorId} unlocked by ${event.lastAttackPlayerId}`,
          )
        }).pipe(
          Effect.catchAll((error) =>
            Effect.logError(`Failed to unlock floor after boss defeat: ${error}`),
          ),
        ),
    )
  }),
)
