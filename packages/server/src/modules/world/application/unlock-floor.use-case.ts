import { Effect } from "effect"
import type { FloorId, PlayerId } from "../../../shared/kernel/types"
import { ZoneRepository } from "../ports/outbound/zone.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { FloorUnlocked } from "../events/published"
import { DatabaseService } from "../../../shared/infrastructure/database/index"
import { DatabaseQueryError } from "../../../shared/kernel/errors"

/**
 * Unlock a floor after its boss has been defeated.
 * Updates the floor_definitions table and publishes a FloorUnlocked event.
 */
export const unlockFloor = (
  floorId: FloorId,
  unlockedBy: PlayerId,
): Effect.Effect<void, DatabaseQueryError, ZoneRepository | EventBus | DatabaseService> =>
  Effect.gen(function* () {
    const zoneRepo = yield* ZoneRepository
    const eventBus = yield* EventBus
    const db = yield* DatabaseService

    // Check if already unlocked
    const floor = yield* zoneRepo.getFloorById(floorId)
    if (!floor) {
      yield* Effect.logWarning(`Floor ${floorId} not found, cannot unlock`)
      return
    }

    if (floor.isUnlocked) {
      yield* Effect.logInfo(`Floor ${floorId} already unlocked`)
      return
    }

    // Unlock the floor in the database
    yield* Effect.tryPromise(() =>
      db.kysely
        .updateTable("sao.floor_definitions")
        .set({ is_unlocked: true })
        .where("id", "=", floorId as number)
        .execute(),
    ).pipe(Effect.orDie)

    // Publish FloorUnlocked event
    yield* eventBus.publish(
      new FloorUnlocked({
        timestamp: new Date(),
        aggregateId: String(floorId),
        floorId: floorId as number,
        unlockedBy,
      }),
    )

    yield* Effect.logInfo(`Floor ${floorId} unlocked by ${unlockedBy}`)
  })
