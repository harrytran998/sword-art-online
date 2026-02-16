import { Effect, Layer } from "effect"
import { WorldPort } from "../../ports/inbound/world.port.js"
import { ZoneStateRepository } from "../../ports/outbound/zone-state.repository.js"
import { EventBus } from "../../../../shared/infrastructure/event-bus/index.js"
import { SuspicionTracker } from "../../../../gateway/security/suspicion-tracker.js"
import { validateMovement } from "../../application/validate-movement.use-case.js"
import type { PlayerId, ZoneId } from "../../../../shared/kernel/types.js"

export const WorldPortLive = Layer.effect(
  WorldPort,
  Effect.gen(function* () {
    const ctx = yield* Effect.context<
      ZoneStateRepository | EventBus | SuspicionTracker
    >()

    return {
      handleMovement: (playerId, msg) =>
        validateMovement(playerId, msg).pipe(Effect.provide(ctx)),

      getPlayerPosition: (playerId) =>
        Effect.gen(function* () {
          const repo = yield* ZoneStateRepository
          const state = yield* repo.getPlayerState(playerId)
          return state ? state.position : null
        }).pipe(Effect.provide(ctx)),

      getPlayersInZone: (zoneId) =>
        Effect.gen(function* () {
          const repo = yield* ZoneStateRepository
          const states = yield* repo.getPlayersInZone(zoneId)
          return states.map((s) => ({
            playerId: s.playerId,
            position: s.position,
            rotation: s.rotation,
          }))
        }).pipe(Effect.provide(ctx)),

      setPlayerZone: (playerId: PlayerId, zoneId: ZoneId) =>
        Effect.gen(function* () {
          const repo = yield* ZoneStateRepository
          yield* repo.setPlayerState({
            playerId,
            zoneId,
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            lastUpdate: Date.now(),
          })
        }).pipe(Effect.provide(ctx)),

      removePlayer: (playerId) =>
        Effect.gen(function* () {
          const repo = yield* ZoneStateRepository
          yield* repo.removePlayer(playerId)
        }).pipe(Effect.provide(ctx)),
    }
  }),
)
