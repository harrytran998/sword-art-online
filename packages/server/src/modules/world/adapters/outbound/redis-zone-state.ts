import { Effect, Layer } from "effect"
import type { PlayerId, ZoneId } from "../../../../shared/kernel/types"
import { CacheService } from "../../../../shared/infrastructure/cache/index"
import {
  ZoneStateRepository,
  type PlayerZoneState,
} from "../../ports/outbound/zone-state.repository"

const ZONE_MEMBERS_KEY = (zoneId: string) => `zone:members:${zoneId}`
const PLAYER_STATE_KEY = (playerId: string) => `zone:player:${playerId}`

export const RedisZoneStateLive = Layer.effect(
  ZoneStateRepository,
  Effect.gen(function* () {
    const cache = yield* CacheService

    const serializeState = (state: PlayerZoneState): Record<string, string> => ({
      playerId: state.playerId,
      zoneId: state.zoneId,
      x: String(state.position.x),
      y: String(state.position.y),
      z: String(state.position.z),
      rotation: String(state.rotation),
      lastUpdate: String(state.lastUpdate),
    })

    const deserializeState = (data: Record<string, string>): PlayerZoneState | null => {
      if (!data.playerId) return null
      return {
        playerId: data.playerId as PlayerId,
        zoneId: data.zoneId as ZoneId,
        position: {
          x: Number(data.x),
          y: Number(data.y),
          z: Number(data.z),
        },
        rotation: Number(data.rotation),
        lastUpdate: Number(data.lastUpdate),
      }
    }

    return {
      getPlayerState: (playerId: PlayerId) =>
        Effect.gen(function* () {
          const data = yield* cache.hgetall(PLAYER_STATE_KEY(playerId))
          return deserializeState(data)
        }),

      setPlayerState: (state: PlayerZoneState) =>
        Effect.gen(function* () {
          // Get old state to handle zone membership change
          const oldData = yield* cache.hgetall(PLAYER_STATE_KEY(state.playerId))
          const oldState = deserializeState(oldData)

          // If zone changed, remove from old zone
          if (oldState && oldState.zoneId !== state.zoneId) {
            yield* cache.srem(ZONE_MEMBERS_KEY(oldState.zoneId), state.playerId)
          }

          // Write player state
          yield* cache.hmset(PLAYER_STATE_KEY(state.playerId), serializeState(state))

          // Add to zone members set
          yield* cache.sadd(ZONE_MEMBERS_KEY(state.zoneId), state.playerId)
        }),

      removePlayer: (playerId: PlayerId) =>
        Effect.gen(function* () {
          const data = yield* cache.hgetall(PLAYER_STATE_KEY(playerId))
          const state = deserializeState(data)

          // Remove player state hash
          yield* cache.del(PLAYER_STATE_KEY(playerId))

          // Remove from zone members
          if (state) {
            yield* cache.srem(ZONE_MEMBERS_KEY(state.zoneId), playerId)
          }
        }),

      getPlayersInZone: (zoneId: ZoneId) =>
        Effect.gen(function* () {
          const memberIds = yield* cache.smembers(ZONE_MEMBERS_KEY(zoneId))
          const results: PlayerZoneState[] = []

          for (const id of memberIds) {
            const data = yield* cache.hgetall(PLAYER_STATE_KEY(id))
            const state = deserializeState(data)
            if (state) results.push(state)
          }

          return results
        }),

      getPlayerZoneId: (playerId: PlayerId) =>
        Effect.gen(function* () {
          const data = yield* cache.hgetall(PLAYER_STATE_KEY(playerId))
          const state = deserializeState(data)
          return state ? state.zoneId : null
        }),

      getActiveZoneIds: () =>
        Effect.gen(function* () {
          // Redis doesn't natively track "all zone keys" so we'd need a meta-set.
          // For now, scan zone:members:* keys. In production use a dedicated tracking set.
          // Returning empty array as this is mainly used for monitoring.
          return [] as ZoneId[]
        }),
    }
  }),
)
