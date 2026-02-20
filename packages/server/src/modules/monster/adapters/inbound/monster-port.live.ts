import { Effect, Layer } from "effect"
import { MonsterPort } from "../../ports/inbound/monster.port"
import { MonsterRepository, SpawnPointRepository } from "../../ports/outbound/monster.repository"
import { MonsterId } from "../../../../shared/kernel/types"
import { MonsterNotFoundError, InvalidTargetError } from "../../domain/errors"
import { Monster, type MonsterState } from "../../domain/entities/monster"

export const MonsterPortLive = Layer.effect(
  MonsterPort,
  Effect.gen(function* () {
    const monsterRepo = yield* MonsterRepository
    const spawnRepo = yield* SpawnPointRepository

    return {
      spawnMonster: (spawnPointId: number) =>
        Effect.gen(function* () {
          const spawnPoints = yield* spawnRepo.getAllActiveSpawnPoints()
          const spawnPoint = spawnPoints.find((sp) => sp.id === spawnPointId)
          if (!spawnPoint) {
            return yield* Effect.fail(new MonsterNotFoundError(`spawn_${spawnPointId}` as MonsterId))
          }

          const pos = spawnPoint.getRandomSpawnPosition()
          const monsterId = MonsterId(`monster_${Date.now()}_${Math.random().toString(36).slice(2)}`)
          const monster = Monster.create({
            id: monsterId,
            definitionId: spawnPoint.monsterDefId,
            name: "Monster",
            monsterType: "beast",
            level: 1,
            maxHp: 100,
            currentHp: 100,
            attack: 10,
            defense: 5,
            zoneId: spawnPoint.zoneId,
            positionX: pos.x,
            positionY: pos.y,
            positionZ: pos.z,
            spawnX: spawnPoint.spawnX,
            spawnY: spawnPoint.spawnY,
            spawnZ: spawnPoint.spawnZ,
            aggroRange: 5.0,
            patrolRange: 10.0,
            attackRange: 2.0,
            state: "idle",
            targetId: null,
          })

          yield* monsterRepo.saveMonster(monster)
          return monster
        }),

      despawnMonster: (monsterId: MonsterId) =>
        Effect.gen(function* () {
          yield* monsterRepo.deleteMonster(monsterId)
        }),

      getMonster: (monsterId: MonsterId) =>
        Effect.gen(function* () {
          const monster = yield* monsterRepo.getMonsterById(monsterId)
          if (!monster) {
            return yield* Effect.fail(new MonsterNotFoundError(monsterId))
          }
          return monster
        }),

      getMonstersInZone: (zoneId) =>
        Effect.gen(function* () {
          return yield* monsterRepo.getMonstersByZone(zoneId)
        }),

      updateMonsterState: (monsterId: MonsterId, state: MonsterState) =>
        Effect.gen(function* () {
          const monster = yield* monsterRepo.getMonsterById(monsterId)
          if (!monster) {
            return yield* Effect.fail(new MonsterNotFoundError(monsterId))
          }
          const updated = monster.withState(state)
          yield* monsterRepo.saveMonster(updated)
          return updated
        }),

      updateMonsterPosition: (monsterId: MonsterId, x: number, y: number, z: number) =>
        Effect.gen(function* () {
          const monster = yield* monsterRepo.getMonsterById(monsterId)
          if (!monster) {
            return yield* Effect.fail(new MonsterNotFoundError(monsterId))
          }
          const updated = monster.withPosition(x, y, z)
          yield* monsterRepo.saveMonster(updated)
          return updated
        }),

      damageMonster: (monsterId: MonsterId, attackerId: string, damage: number) =>
        Effect.gen(function* () {
          const monster = yield* monsterRepo.getMonsterById(monsterId)
          if (!monster) {
            return yield* Effect.fail(new MonsterNotFoundError(monsterId))
          }
          if (!monster.isAlive()) {
            return yield* Effect.fail(new InvalidTargetError(monsterId, "Target is dead"))
          }
          const updated = monster.takeDamage(damage).withTarget(attackerId).withState("aggro")
          yield* monsterRepo.saveMonster(updated)
          return updated
        }),
    }
  }),
)
