import { Effect } from "effect"
import type { ZoneId } from "../../../shared/kernel/types"
import { SpawnPointRepository } from "../ports/outbound/monster.repository"

export const PLAYER_COUNT_THRESHOLD = 10

export const adjustSpawnCount = (
  zoneId: ZoneId,
  playerCount: number,
): Effect.Effect<number, never, SpawnPointRepository> =>
  Effect.gen(function* () {
    const spawnRepo = yield* SpawnPointRepository

    const spawnPoints = yield* spawnRepo.getSpawnPointsByZone(zoneId)

    const totalBaseSpawns = spawnPoints.reduce((sum, sp) => sum + sp.spawnCount, 0)

    if (playerCount < PLAYER_COUNT_THRESHOLD) {
      const adjustedCount = Math.max(
        1,
        Math.floor(totalBaseSpawns * playerCount / PLAYER_COUNT_THRESHOLD),
      )
      return adjustedCount
    }

    return totalBaseSpawns
  })

export const getDesiredSpawnCount = (
  baseCount: number,
  playerCount: number,
): number => {
  if (playerCount >= PLAYER_COUNT_THRESHOLD) {
    return baseCount
  }
  return Math.max(1, Math.floor(baseCount * playerCount / PLAYER_COUNT_THRESHOLD))
}
