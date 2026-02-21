import { Effect } from "effect"
import type { PlayerId } from "../../../shared/kernel/types"
import { CooldownRepository } from "../ports/outbound/cooldown.repository"
import { SkillOnCooldownError, InvalidTargetError } from "../domain/errors"

const AUTO_ATTACK_COOLDOWN_MS = 1000
const AUTO_ATTACK_SKILL_ID = -1 // sentinel for auto-attack cooldown key

export interface AutoAttackResult {
  readonly attackerId: PlayerId
  readonly targetId: string
  readonly baseDamage: number
  readonly finalDamage: number
  readonly isCritical: boolean
}

/**
 * Calculate auto-attack damage using raw weapon ATK and target DEF.
 * Formula: Final = WeaponATK * (1 - DEF / (DEF + 100))
 */
export const calculateAutoAttackDamage = (
  weaponAtk: number,
  targetDef: number,
  dex: number,
  lck: number,
): { baseDamage: number; finalDamage: number; isCritical: boolean } => {
  const baseDamage = weaponAtk
  const reduction = targetDef / (targetDef + 100)
  let damage = Math.floor(baseDamage * (1 - reduction))

  const critRate = dex * 0.005
  const isCritical = Math.random() < critRate
  if (isCritical) {
    const critMultiplier = 1.5 + lck * 0.005
    damage = Math.floor(damage * critMultiplier)
  }

  return { baseDamage, finalDamage: Math.max(1, damage), isCritical }
}

/**
 * Basic auto-attack without Sword Skill activation.
 * No MP cost, no pre/post-motion phases. 1-second cooldown.
 */
export const autoAttack = (
  playerId: PlayerId,
  targetId: string,
  weaponAtk: number,
  targetDef: number,
  attackerDex: number,
  attackerLck: number,
): Effect.Effect<AutoAttackResult, SkillOnCooldownError | InvalidTargetError, CooldownRepository> =>
  Effect.gen(function* () {
    const cooldownRepo = yield* CooldownRepository

    if (!targetId) {
      return yield* Effect.fail(
        new InvalidTargetError({ targetId: "", reason: "No target specified" }),
      )
    }

    // Check auto-attack cooldown
    const isOnCooldown = yield* cooldownRepo.isOnCooldown(playerId, AUTO_ATTACK_SKILL_ID)
    if (isOnCooldown) {
      const remaining = yield* cooldownRepo.getCooldownRemaining(playerId, AUTO_ATTACK_SKILL_ID)
      return yield* Effect.fail(
        new SkillOnCooldownError({ skillId: AUTO_ATTACK_SKILL_ID, remainingMs: remaining }),
      )
    }

    // Set cooldown
    yield* cooldownRepo.setCooldown(playerId, AUTO_ATTACK_SKILL_ID, AUTO_ATTACK_COOLDOWN_MS)

    // Calculate damage
    const { baseDamage, finalDamage, isCritical } = calculateAutoAttackDamage(
      weaponAtk,
      targetDef,
      attackerDex,
      attackerLck,
    )

    return {
      attackerId: playerId,
      targetId,
      baseDamage,
      finalDamage,
      isCritical,
    }
  })
