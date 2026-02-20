import { Effect } from "effect"
import { MonsterId, type ZoneId } from "../../../shared/kernel/types"
import { Monster } from "../domain/entities/monster"
import { MonsterRepository, SpawnPointRepository } from "../ports/outbound/monster.repository"
import { MonsterNotFoundError } from "../domain/errors"

export const spawnMonstersForZone = (
  zoneId: ZoneId,
): Effect.Effect<Monster[], never, SpawnPointRepository | MonsterRepository> =>
  Effect.gen(function* () {
    const spawnRepo = yield* SpawnPointRepository
    const monsterRepo = yield* MonsterRepository

    const spawnPoints = yield* spawnRepo.getSpawnPointsByZone(zoneId)
    const monsters: Monster[] = []

    for (const spawn of spawnPoints) {
      const existingMonsters = yield* monsterRepo.getMonstersByZone(zoneId)
      const sameDefMonsters = existingMonsters.filter((m) => m.definitionId === spawn.monsterDefId)

      const toSpawn = Math.max(0, spawn.spawnCount - sameDefMonsters.length)

      for (let i = 0; i < toSpawn; i++) {
        const pos = spawn.getRandomSpawnPosition()
        const monsterId = MonsterId(`monster_${Date.now()}_${Math.random().toString(36).slice(2)}`)
        const monster = Monster.create({
          id: monsterId,
          definitionId: spawn.monsterDefId,
          name: "Monster",
          monsterType: "beast",
          level: 1,
          maxHp: 100,
          currentHp: 100,
          attack: 10,
          defense: 5,
          zoneId: spawn.zoneId,
          positionX: pos.x,
          positionY: pos.y,
          positionZ: pos.z,
          spawnX: spawn.spawnX,
          spawnY: spawn.spawnY,
          spawnZ: spawn.spawnZ,
          aggroRange: 5.0,
          patrolRange: 10.0,
          attackRange: 2.0,
          state: "idle",
          targetId: null,
        })
        yield* monsterRepo.saveMonster(monster)
        monsters.push(monster)
      }
    }

    return monsters
  })

export const updateMonsterAI = (
  monsterId: MonsterId,
  playerPositions: Map<string, { x: number; z: number }>,
): Effect.Effect<Monster, MonsterNotFoundError, MonsterRepository> =>
  Effect.gen(function* () {
    const monsterRepo = yield* MonsterRepository

    const monster = yield* monsterRepo.getMonsterById(monsterId)
    if (!monster) {
      return yield* Effect.fail(new MonsterNotFoundError(monsterId))
    }

    if (!monster.isAlive()) {
      return monster
    }

    let updatedMonster = monster

    switch (monster.state) {
      case "idle":
      case "patrol":
        for (const [playerId, pos] of playerPositions) {
          if (monster.isInAggroRange(pos.x, pos.z)) {
            updatedMonster = monster.withState("aggro").withTarget(playerId)
            break
          }
        }
        break

      case "aggro":
        if (monster.targetId) {
          const targetPos = playerPositions.get(monster.targetId)
          if (targetPos) {
            if (monster.isInAttackRange(targetPos.x, targetPos.z)) {
              updatedMonster = monster.withState("attack")
            }
          } else {
            updatedMonster = monster.withState("return").withTarget(null)
        }
        }
        break

      case "attack":
        if (monster.targetId) {
          const targetPos = playerPositions.get(monster.targetId)
          if (!targetPos || !monster.isInAggroRange(targetPos.x, targetPos.z)) {
            updatedMonster = monster.withState("return").withTarget(null)
          }
        }
        break

      case "return":
        if (monster.isAtSpawn()) {
          updatedMonster = monster.withState("idle")
        }
        break
    }

    yield* monsterRepo.saveMonster(updatedMonster)
    return updatedMonster
  })
