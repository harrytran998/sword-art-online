import { Effect } from "effect"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { BossRoomSealed, BossRoomUnsealed } from "../../monster/events/boss-events"
import type { ZoneId } from "../../../shared/kernel/types"

// In-memory sealed zone tracking
const sealedZones = new Set<string>()

export const sealBossRoom = (
  zoneId: ZoneId,
  bossName: string,
): Effect.Effect<void, never, EventBus> =>
  Effect.gen(function* () {
    const eventBus = yield* EventBus

    sealedZones.add(zoneId)

    yield* eventBus.publish(
      new BossRoomSealed({
        timestamp: new Date(),
        aggregateId: zoneId,
        zoneId,
        bossName,
      }),
    )
  })

export const unsealBossRoom = (
  zoneId: ZoneId,
  reason: "boss_defeated" | "party_wipe",
): Effect.Effect<void, never, EventBus> =>
  Effect.gen(function* () {
    const eventBus = yield* EventBus

    sealedZones.delete(zoneId)

    yield* eventBus.publish(
      new BossRoomUnsealed({
        timestamp: new Date(),
        aggregateId: zoneId,
        zoneId,
        reason,
      }),
    )
  })

export const isZoneSealed = (zoneId: ZoneId): boolean => {
  return sealedZones.has(zoneId)
}
