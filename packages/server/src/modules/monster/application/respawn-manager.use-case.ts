import { Effect } from "effect"
import type { ZoneId } from "../../../shared/kernel/types"
import { RespawnTimer } from "../domain/value-objects/respawn-timer"
import { MonsterPort } from "../ports/inbound/monster.port"
import { SpawnPointRepository } from "../ports/outbound/monster.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { MonsterSpawned } from "../events/published"
import type { MonsterNotFoundError } from "../domain/errors"

const respawnTimers = new Map<number, RespawnTimer>()

export const scheduleRespawn = (
  spawnPointId: number,
  delayMs: number,
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    const timer = RespawnTimer.create(spawnPointId, delayMs)
    respawnTimers.set(spawnPointId, timer)
  })

export const processRespawns = (
  zoneId: ZoneId,
): Effect.Effect<void, MonsterNotFoundError, MonsterPort | SpawnPointRepository | EventBus> =>
  Effect.gen(function* () {
    const spawnRepo = yield* SpawnPointRepository
    const monsterPort = yield* MonsterPort
    const eventBus = yield* EventBus
    const now = new Date()

    const spawnPoints = yield* spawnRepo.getSpawnPointsByZone(zoneId)

    for (const [spawnPointId, timer] of respawnTimers) {
      if (timer.shouldRespawn(now)) {
        const spawnPoint = spawnPoints.find((sp) => sp.id === spawnPointId)
        if (spawnPoint && spawnPoint.isActive) {
          const monster = yield* monsterPort.spawnMonster(spawnPointId)
          respawnTimers.delete(spawnPointId)

          yield* eventBus.publish(
            new MonsterSpawned({
              timestamp: now,
              aggregateId: monster.id,
              monsterId: monster.id,
              zoneId: monster.zoneId,
            }),
          )
        }
      }
    }
  })

export const getPendingRespawns = (): Map<number, RespawnTimer> => {
  return new Map(respawnTimers)
}

export const clearRespawnTimer = (spawnPointId: number): void => {
  respawnTimers.delete(spawnPointId)
}
