import { Effect, Layer, Ref } from "effect"
import type { PlayerId, ZoneId } from "../../../../shared/kernel/types.js"
import {
  ZoneStateRepository,
  type PlayerZoneState,
} from "../../ports/outbound/zone-state.repository.js"

export const InMemoryZoneStateLive = Layer.effect(
  ZoneStateRepository,
  Effect.gen(function* () {
    const playerStates = yield* Ref.make<Map<string, PlayerZoneState>>(new Map())
    const zoneMembers = yield* Ref.make<Map<string, Set<string>>>(new Map())

    return {
      getPlayerState: (playerId: PlayerId) =>
        Ref.get(playerStates).pipe(
          Effect.map((map) => map.get(playerId) ?? null),
        ),

      setPlayerState: (state: PlayerZoneState) =>
        Effect.gen(function* () {
          // Get old zone to remove from zone members
          const oldState = yield* Ref.get(playerStates).pipe(
            Effect.map((map) => map.get(state.playerId)),
          )

          // If zone changed, remove from old zone's member set
          if (oldState && oldState.zoneId !== state.zoneId) {
            yield* Ref.update(zoneMembers, (map) => {
              const updated = new Map(map)
              const oldMembers = updated.get(oldState.zoneId)
              if (oldMembers) {
                const newMembers = new Set(oldMembers)
                newMembers.delete(state.playerId)
                if (newMembers.size === 0) {
                  updated.delete(oldState.zoneId)
                } else {
                  updated.set(oldState.zoneId, newMembers)
                }
              }
              return updated
            })
          }

          // Update player state
          yield* Ref.update(playerStates, (map) => {
            const updated = new Map(map)
            updated.set(state.playerId, state)
            return updated
          })

          // Add to zone members
          yield* Ref.update(zoneMembers, (map) => {
            const updated = new Map(map)
            const members = updated.get(state.zoneId) ?? new Set()
            const newMembers = new Set(members)
            newMembers.add(state.playerId)
            updated.set(state.zoneId, newMembers)
            return updated
          })
        }),

      removePlayer: (playerId: PlayerId) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(playerStates).pipe(
            Effect.map((map) => map.get(playerId)),
          )

          yield* Ref.update(playerStates, (map) => {
            const updated = new Map(map)
            updated.delete(playerId)
            return updated
          })

          if (state) {
            yield* Ref.update(zoneMembers, (map) => {
              const updated = new Map(map)
              const members = updated.get(state.zoneId)
              if (members) {
                const newMembers = new Set(members)
                newMembers.delete(playerId)
                if (newMembers.size === 0) {
                  updated.delete(state.zoneId)
                } else {
                  updated.set(state.zoneId, newMembers)
                }
              }
              return updated
            })
          }
        }),

      getPlayersInZone: (zoneId: ZoneId) =>
        Effect.gen(function* () {
          const members = yield* Ref.get(zoneMembers).pipe(
            Effect.map((map) => map.get(zoneId) ?? new Set<string>()),
          )
          const states = yield* Ref.get(playerStates)
          const result: PlayerZoneState[] = []
          for (const id of members) {
            const state = states.get(id)
            if (state) result.push(state)
          }
          return result
        }),

      getPlayerZoneId: (playerId: PlayerId) =>
        Ref.get(playerStates).pipe(
          Effect.map((map) => {
            const state = map.get(playerId)
            return state ? state.zoneId : null
          }),
        ),

      getActiveZoneIds: () =>
        Ref.get(zoneMembers).pipe(
          Effect.map((map) => Array.from(map.keys()) as ZoneId[]),
        ),
    }
  }),
)
