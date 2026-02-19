import { Effect } from "effect"
import type { PlayerId } from "../../../shared/kernel/types"
import { ActiveSkill } from "../domain/entities/active-skill"
import type { DamageResult } from "../domain/value-objects/damage-result"
import { SkillRepository } from "../ports/outbound/skill.repository"
import { CooldownRepository } from "../ports/outbound/cooldown.repository"
import {
  SkillOnCooldownError,
  OutOfRangeError,
  InvalidTargetError,
} from "../domain/errors"

export const activateSkill = (
  playerId: PlayerId,
  skillId: number,
  targetId?: string,
): Effect.Effect<
  ActiveSkill,
  SkillOnCooldownError | OutOfRangeError | InvalidTargetError,
  SkillRepository | CooldownRepository
> =>
  Effect.gen(function* () {
    const skillRepo = yield* SkillRepository
    const cooldownRepo = yield* CooldownRepository

    const skill = yield* skillRepo.getSkillById(skillId).pipe(
      Effect.flatMap((s) =>
        s
          ? Effect.succeed(s)
          : Effect.fail(new InvalidTargetError({ targetId: String(skillId), reason: "Skill not found" })),
      ),
    )

    const isOnCooldown = yield* cooldownRepo.isOnCooldown(playerId, skillId)
    if (isOnCooldown) {
      const remaining = yield* cooldownRepo.getCooldownRemaining(playerId, skillId)
      yield* Effect.fail(new SkillOnCooldownError({ skillId, remainingMs: remaining }))
    }

    const activeSkill = ActiveSkill.create({
      playerId,
      skillId,
      phase: "pre_motion",
      startedAt: Date.now(),
      ...(targetId !== undefined && { targetId }),
    })

    yield* cooldownRepo.setCooldown(playerId, skillId, skill.cooldownMs)

    return activeSkill
  })

export const calculateDamage = (
  _attackerId: PlayerId,
  _targetId: string,
  skillId: number,
): Effect.Effect<DamageResult, never, SkillRepository> =>
  Effect.gen(function* () {
    const skillRepo = yield* SkillRepository

    const skill = yield* skillRepo.getSkillById(skillId)
    if (!skill) {
      return { baseDamage: 10, finalDamage: 10, isCritical: false, criticalMultiplier: 1 }
    }

    const baseDamage = 10 * skill.damageMultiplier
    const isCritical = Math.random() < 0.1
    const criticalMultiplier = isCritical ? 1.5 : 1
    const finalDamage = Math.floor(baseDamage * criticalMultiplier)

    return { baseDamage, finalDamage, isCritical, criticalMultiplier }
  })
