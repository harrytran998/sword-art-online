import { Effect } from "effect"
import { MAX_MOVE_SPEED, SUSPICION_SPEED_HACK_PENALTY, SUSPICION_TELEPORT_PENALTY } from "@sao/shared"
import type { PlayerId } from "../../../shared/kernel/types.js"
import { InvalidPositionError } from "../domain/errors.js"
import { distance } from "../domain/value-objects/position.js"
import { ZoneStateRepository } from "../ports/outbound/zone-state.repository.js"
import { EventBus } from "../../../shared/infrastructure/event-bus/index.js"
import { SuspicionTracker } from "../../../gateway/security/suspicion-tracker.js"
import { logSecurityEvent, SecurityEventType } from "../../../gateway/security/security-logger.js"

const SPEED_TOLERANCE = 1.2
const TELEPORT_DISTANCE_THRESHOLD = MAX_MOVE_SPEED * 2
const MIN_DELTA_TIME = 0.016 // ~1 frame at 60fps

export const validateMovement = (
  playerId: PlayerId,
  msg: { x: number; y: number; z: number; rotation: number; timestamp: number },
) =>
  Effect.gen(function* () {
    const repo = yield* ZoneStateRepository
    const eventBus = yield* EventBus
    const suspicion = yield* SuspicionTracker

    const currentState = yield* repo.getPlayerState(playerId)
    if (!currentState) {
      return yield* Effect.fail(
        new InvalidPositionError({
          x: msg.x,
          y: msg.y,
          z: msg.z,
          reason: "Player not in any zone",
        }),
      )
    }

    const requestedPos = { x: msg.x, y: msg.y, z: msg.z }
    const dist = distance(currentState.position, requestedPos)
    const now = Date.now()
    const deltaTime = Math.max(
      (now - currentState.lastUpdate) / 1000,
      MIN_DELTA_TIME,
    )

    // Teleport check (extreme distance)
    if (dist > TELEPORT_DISTANCE_THRESHOLD) {
      yield* logSecurityEvent({
        type: SecurityEventType.TELEPORT_HACK,
        playerId,
        severity: "critical",
        data: { distance: dist, threshold: TELEPORT_DISTANCE_THRESHOLD },
      })
      yield* suspicion.addSuspicion(playerId, SUSPICION_TELEPORT_PENALTY)
      return yield* Effect.fail(
        new InvalidPositionError({
          x: msg.x,
          y: msg.y,
          z: msg.z,
          reason: "Teleport detected",
        }),
      )
    }

    // Speed hack check
    const maxAllowedDistance = MAX_MOVE_SPEED * deltaTime * SPEED_TOLERANCE
    if (dist > maxAllowedDistance) {
      yield* logSecurityEvent({
        type: SecurityEventType.SPEED_HACK,
        playerId,
        severity: "warning",
        data: { distance: dist, maxAllowed: maxAllowedDistance, deltaTime },
      })
      yield* suspicion.addSuspicion(playerId, SUSPICION_SPEED_HACK_PENALTY)
      return yield* Effect.fail(
        new InvalidPositionError({
          x: msg.x,
          y: msg.y,
          z: msg.z,
          reason: "Speed hack detected",
        }),
      )
    }

    // Update position
    yield* repo.setPlayerState({
      playerId,
      zoneId: currentState.zoneId,
      position: requestedPos,
      rotation: msg.rotation,
      lastUpdate: now,
    })

    // Publish event
    yield* eventBus.publish({
      _tag: "PlayerMoved",
      timestamp: new Date(),
      aggregateId: playerId,
      playerId,
      zoneId: currentState.zoneId,
      x: msg.x,
      y: msg.y,
      z: msg.z,
      rotation: msg.rotation,
    } as unknown as import("../../../shared/kernel/events.js").DomainEvent)
  })
