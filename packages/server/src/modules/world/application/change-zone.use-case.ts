import { Effect } from "effect"
import type { PlayerId, ZoneId } from "../../../shared/kernel/types"
import { ZoneRepository } from "../ports/outbound/zone.repository"
import { ZoneStateRepository } from "../ports/outbound/zone-state.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { FloorLockedError, ZoneChangeError, ZoneNotFoundError } from "../domain/errors"
import { PlayerLeftZone, PlayerEnteredZone } from "../events/published"
import { positionDistance } from "../domain/value-objects/position"

const SPAWN_VISIBILITY_RADIUS = 150

export interface ZoneChangeResult {
  readonly zoneId: string
  readonly zoneName: string
  readonly zoneType: string
  readonly isSafeZone: boolean
  readonly spawnX: number
  readonly spawnY: number
  readonly spawnZ: number
  readonly players: { playerId: string; x: number; y: number; z: number; rotation: number }[]
}

export const changeZone = (playerId: PlayerId, targetZoneId: ZoneId) =>
  Effect.gen(function* () {
    const zoneRepo = yield* ZoneRepository
    const zoneState = yield* ZoneStateRepository
    const eventBus = yield* EventBus

    // 1. Validate target zone exists
    const targetZone = yield* zoneRepo.getZoneById(targetZoneId)
    if (!targetZone) {
      return yield* Effect.fail(new ZoneNotFoundError({ zoneId: targetZoneId }))
    }

    // 2. Check floor is unlocked
    const floor = yield* zoneRepo.getFloorById(targetZone.floorId)
    if (!floor || !floor.isUnlocked) {
      return yield* Effect.fail(new FloorLockedError({ floorId: targetZone.floorId as number }))
    }

    // 3. Get current player state
    const currentState = yield* zoneState.getPlayerState(playerId)
    const currentZoneId = currentState?.zoneId

    // 4. Don't allow changing to the same zone
    if (currentZoneId === targetZoneId) {
      return yield* Effect.fail(
        new ZoneChangeError({ reason: "Already in target zone" }),
      )
    }

    // 5. Check zone capacity
    const playersInZone = yield* zoneState.getPlayersInZone(targetZoneId)
    if (playersInZone.length >= targetZone.maxPlayers) {
      return yield* Effect.fail(
        new ZoneChangeError({ reason: "Zone is full" }),
      )
    }

    // 6. Validate spawn point is within zone bounds, fall back to zone center
    let spawnPoint = targetZone.spawnPoint
    if (!targetZone.zoneBoundsContainsPosition(spawnPoint.x, spawnPoint.y, spawnPoint.z)) {
      spawnPoint = {
        x: (targetZone.bounds.minX + targetZone.bounds.maxX) / 2,
        y: 0,
        z: (targetZone.bounds.minZ + targetZone.bounds.maxZ) / 2,
      }
    }

    // 7. Commit state changes FIRST (before events)
    yield* zoneState.setPlayerState({
      playerId,
      zoneId: targetZoneId,
      position: spawnPoint,
      rotation: 0,
      lastUpdate: Date.now(),
    })

    // 8. THEN publish events (after state is committed)
    if (currentZoneId) {
      yield* eventBus.publish(
        new PlayerLeftZone({
          timestamp: new Date(),
          aggregateId: playerId,
          playerId,
          zoneId: currentZoneId,
        }),
      )
    }

    yield* eventBus.publish(
      new PlayerEnteredZone({
        timestamp: new Date(),
        aggregateId: playerId,
        playerId,
        zoneId: targetZoneId,
      }),
    )

    // 9. Return only nearby players (within spawn visibility radius)
    const nearbyPlayers = playersInZone
      .filter((p) => p.playerId !== playerId)
      .filter((p) => positionDistance(p.position, spawnPoint) <= SPAWN_VISIBILITY_RADIUS)
      .map((p) => ({
        playerId: p.playerId as string,
        x: p.position.x,
        y: p.position.y,
        z: p.position.z,
        rotation: p.rotation,
      }))

    const result: ZoneChangeResult = {
      zoneId: targetZone.id,
      zoneName: targetZone.name,
      zoneType: targetZone.type,
      isSafeZone: targetZone.safeZone,
      spawnX: spawnPoint.x,
      spawnY: spawnPoint.y,
      spawnZ: spawnPoint.z,
      players: nearbyPlayers,
    }

    return result
  })
