import { Effect } from "effect"
import type { MonsterId, PlayerId } from "../../../shared/kernel/types"
import { MonsterRepository } from "../ports/outbound/monster.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { MonsterAttack } from "../domain/entities/monster-attack"
import { AttackPattern, type AttackPatternType } from "../domain/value-objects/attack-pattern"
import { MonsterNotFoundError } from "../domain/errors"
import { MonsterAttackTelegraphed, MonsterAttackExecuted } from "../events/published"

const activeAttacks = new Map<string, MonsterAttack>()
const attackCooldowns = new Map<string, Map<AttackPatternType, Date>>()

export const startTelegraph = (
  monsterId: MonsterId,
  attackType: AttackPatternType,
  targetId: PlayerId | null,
  targetX: number,
  targetY: number,
  targetZ: number,
): Effect.Effect<MonsterAttack, MonsterNotFoundError, MonsterRepository | EventBus> =>
  Effect.gen(function* () {
    const monsterRepo = yield* MonsterRepository
    const eventBus = yield* EventBus

    const monster = yield* monsterRepo.getMonsterById(monsterId)
    if (!monster) {
      return yield* Effect.fail(new MonsterNotFoundError(monsterId))
    }

    const pattern = getAttackPattern(attackType)
    const attackId = `attack_${monsterId}_${Date.now()}`

    const attack = MonsterAttack.startTelegraph(
      attackId,
      monsterId,
      attackType,
      targetId,
      targetX,
      targetY,
      targetZ,
      pattern.telegraphMs,
      pattern.damageMultiplier,
      pattern.aoeRadius ?? null,
    )

    activeAttacks.set(attackId, attack)

    const targetArea = attack.getTargetArea()
    yield* eventBus.publish(
      new MonsterAttackTelegraphed({
        timestamp: new Date(),
        aggregateId: monsterId,
        monsterId,
        attackType,
        targetAreaX: targetArea.x,
        targetAreaY: targetArea.y,
        targetAreaZ: targetArea.z,
        targetAreaRadius: targetArea.radius,
        executeAt: attack.executeAt,
      }),
    )

    return attack
  })

export const executeMonsterAttack = (
  attackId: string,
  playerPositions: Map<PlayerId, { x: number; y: number; z: number }>,
): Effect.Effect<{ targets: PlayerId[]; damage: number }, MonsterNotFoundError, MonsterRepository | EventBus> =>
  Effect.gen(function* () {
    const monsterRepo = yield* MonsterRepository
    const eventBus = yield* EventBus

    const attack = activeAttacks.get(attackId)
    if (!attack || !attack.isReady()) {
      return { targets: [], damage: 0 }
    }

    const monster = yield* monsterRepo.getMonsterById(attack.monsterId)
    if (!monster) {
      return yield* Effect.fail(new MonsterNotFoundError(attack.monsterId))
    }

    const targets: PlayerId[] = []
    const baseDamage = monster.attack * attack.damageMultiplier

    if (attack.attackType === "aoe" && attack.aoeRadius) {
      for (const [playerId, pos] of playerPositions) {
        const dx = pos.x - attack.targetPositionX
        const dz = pos.z - attack.targetPositionZ
        const distance = Math.sqrt(dx * dx + dz * dz)
        if (distance <= attack.aoeRadius) {
          targets.push(playerId)
        }
      }
    } else if (attack.targetId) {
      targets.push(attack.targetId)
    }

    activeAttacks.delete(attackId)

    const cooldowns = attackCooldowns.get(attack.monsterId) ?? new Map()
    cooldowns.set(attack.attackType, new Date(Date.now() + getAttackPattern(attack.attackType).cooldownMs))
    attackCooldowns.set(attack.monsterId, cooldowns)

    yield* eventBus.publish(
      new MonsterAttackExecuted({
        timestamp: new Date(),
        aggregateId: attack.monsterId,
        monsterId: attack.monsterId,
        attackType: attack.attackType,
        targets,
        damage: baseDamage,
      }),
    )

    return { targets, damage: baseDamage }
  })

export const processActiveAttacks = (
  playerPositions: Map<PlayerId, { x: number; y: number; z: number }>,
): Effect.Effect<void, MonsterNotFoundError, MonsterRepository | EventBus> =>
  Effect.gen(function* () {
    const now = new Date()
    const readyAttacks: string[] = []

    for (const [attackId, attack] of activeAttacks) {
      if (attack.isReady(now)) {
        readyAttacks.push(attackId)
      }
    }

    for (const attackId of readyAttacks) {
      yield* executeMonsterAttack(attackId, playerPositions)
    }
  })

export const isAttackOnCooldown = (
  monsterId: MonsterId,
  attackType: AttackPatternType,
): boolean => {
  const cooldowns = attackCooldowns.get(monsterId)
  if (!cooldowns) return false
  const cooldownEnd = cooldowns.get(attackType)
  if (!cooldownEnd) return false
  return new Date() < cooldownEnd
}

const getAttackPattern = (type: AttackPatternType): AttackPattern => {
  switch (type) {
    case "melee":
      return AttackPattern.melee()
    case "charge":
      return AttackPattern.charge()
    case "aoe":
      return AttackPattern.aoe()
  }
}
