import { Effect } from "effect"
import type { MonsterId, PlayerId, ZoneId } from "../../../shared/kernel/types"
import { BossInstance } from "../domain/entities/boss-instance"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { BossPhaseChanged, BossDefeated } from "../events/boss-events"

// In-memory boss state (stateful per-server)
const activeBosses = new Map<string, BossInstance>()

export const initializeBoss = (
  bossId: MonsterId,
  zoneId: ZoneId,
): BossInstance => {
  const boss = BossInstance.createIllfang(bossId, zoneId)
  activeBosses.set(bossId, boss)
  return boss
}

export const getActiveBoss = (zoneId: ZoneId): BossInstance | null => {
  for (const boss of activeBosses.values()) {
    if (boss.zoneId === zoneId && boss.isAlive()) {
      return boss
    }
  }
  return null
}

export const damageBoss = (
  bossId: MonsterId,
  damage: number,
  attackerId: PlayerId,
): Effect.Effect<BossInstance, never, EventBus> =>
  Effect.gen(function* () {
    const eventBus = yield* EventBus
    const boss = activeBosses.get(bossId)
    if (!boss || !boss.isAlive()) {
      return boss ?? BossInstance.createIllfang(bossId, "floor_1_boss_room" as ZoneId)
    }

    const previousPhase = boss.phase
    const updatedBoss = boss.takeDamage(damage)
    activeBosses.set(bossId, updatedBoss)

    // Phase transition
    if (updatedBoss.phase !== previousPhase) {
      yield* eventBus.publish(
        new BossPhaseChanged({
          timestamp: new Date(),
          aggregateId: bossId,
          bossId,
          bossName: updatedBoss.name,
          newPhase: updatedBoss.phase,
          currentHp: updatedBoss.currentHp,
          totalHp: updatedBoss.totalHp,
        }),
      )
    }

    // Boss defeated
    if (updatedBoss.isDefeated) {
      yield* eventBus.publish(
        new BossDefeated({
          timestamp: new Date(),
          aggregateId: bossId,
          bossId,
          bossName: updatedBoss.name,
          floorId: 1,
          lastAttackPlayerId: attackerId,
        }),
      )
      activeBosses.delete(bossId)
    }

    return updatedBoss
  })

/**
 * Update boss AI for the current tick
 * Returns the boss action to execute
 */
export interface BossAction {
  readonly type: "idle" | "melee" | "charge" | "aoe" | "summon" | "room_aoe"
  readonly targetId: PlayerId | null
  readonly damage: number
  readonly radius: number
}

export const updateBossAI = (
  bossId: MonsterId,
  playerPositions: Map<PlayerId, { x: number; z: number }>,
): BossAction => {
  const boss = activeBosses.get(bossId)
  if (!boss || !boss.isAlive()) {
    return { type: "idle", targetId: null, damage: 0, radius: 0 }
  }

  // Find closest player for aggro
  let closestPlayer: PlayerId | null = null
  let closestDist = Number.POSITIVE_INFINITY

  for (const [playerId, pos] of playerPositions) {
    const dx = pos.x - boss.positionX
    const dz = pos.z - boss.positionZ
    const dist = Math.hypot(dx, dz)
    if (dist < closestDist) {
      closestDist = dist
      closestPlayer = playerId
    }
  }

  if (!closestPlayer) {
    return { type: "idle", targetId: null, damage: 0, radius: 0 }
  }

  // Update aggro target
  const updatedBoss = boss.withAggroTarget(closestPlayer)
  activeBosses.set(bossId, updatedBoss)

  const baseDamage = boss.attack * boss.getPhaseAttackMultiplier()

  // Phase-specific AI behavior
  switch (boss.phase) {
    case 1:
      // Phase 1: Basic melee, occasionally summon sentinels
      if (boss.summonIds.length === 0 && Math.random() < 0.05) {
        return { type: "summon", targetId: null, damage: 0, radius: 0 }
      }
      if (closestDist <= 5) {
        return { type: "melee", targetId: closestPlayer, damage: baseDamage, radius: 0 }
      }
      return { type: "charge", targetId: closestPlayer, damage: baseDamage * 0.8, radius: 0 }

    case 2:
      // Phase 2: Faster attacks, wider AoE
      if (Math.random() < 0.15) {
        return {
          type: "aoe",
          targetId: closestPlayer,
          damage: baseDamage * 0.7,
          radius: boss.getPhaseAoeRadius(),
        }
      }
      return { type: "melee", targetId: closestPlayer, damage: baseDamage, radius: 0 }

    case 3:
      // Phase 3: Enrage — continuous charges and room-wide AoE
      if (Math.random() < 0.2) {
        return {
          type: "room_aoe",
          targetId: null,
          damage: baseDamage * 0.5,
          radius: boss.getPhaseAoeRadius(),
        }
      }
      return {
        type: "charge",
        targetId: closestPlayer,
        damage: baseDamage * 1.2,
        radius: 0,
      }
  }
}

export const removeBoss = (bossId: MonsterId): void => {
  activeBosses.delete(bossId)
}

export const getAllActiveBosses = (): BossInstance[] => {
  return Array.from(activeBosses.values())
}
