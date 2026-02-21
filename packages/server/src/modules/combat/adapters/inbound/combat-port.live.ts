import { Effect, Layer } from "effect"
import { CombatPort } from "../../ports/inbound/combat.port"
import { SkillRepository } from "../../ports/outbound/skill.repository"
import { CooldownRepository } from "../../ports/outbound/cooldown.repository"
import { SkillSlotRepository } from "../../ports/outbound/skill-slot.repository"
import { EventBus } from "../../../../shared/infrastructure/event-bus/index"
import { activateSkill } from "../../application/activate-skill.use-case"
import { autoAttack } from "../../application/auto-attack.use-case"
import { updateProficiency } from "../../application/update-proficiency.use-case"
import { assignSkillSlot, clearSkillSlot } from "../../application/assign-skill-slot.use-case"
import { unlockSkill } from "../../application/unlock-skill.use-case"
import type { PlayerId } from "../../../../shared/kernel/types"
import type { ActiveSkill } from "../../domain/entities/active-skill"

// In-memory active skill tracking
const activeSkills = new Map<string, ActiveSkill>()

export const CombatPortLive = Layer.effect(
  CombatPort,
  Effect.gen(function* () {
    const _skillRepo = yield* SkillRepository
    const _cooldownRepo = yield* CooldownRepository
    const _skillSlotRepo = yield* SkillSlotRepository
    const _eventBus = yield* EventBus

    return {
      activateSkill: (playerId: PlayerId, skillId: number, targetId?: string) =>
        activateSkill(playerId, skillId, targetId).pipe(
          Effect.tap((active) => Effect.sync(() => activeSkills.set(playerId, active))),
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(SkillRepository, _skillRepo),
              Layer.succeed(CooldownRepository, _cooldownRepo),
            ),
          ),
        ),

      cancelSkill: (playerId: PlayerId) =>
        Effect.sync(() => {
          activeSkills.delete(playerId)
        }),

      getActiveSkill: (playerId: PlayerId) =>
        Effect.sync(() => activeSkills.get(playerId) ?? null),

      getCooldownRemaining: (playerId: PlayerId, skillId: number) =>
        _cooldownRepo.getCooldownRemaining(playerId, skillId),

      updateProficiency: (characterId: PlayerId, skillId: number) =>
        updateProficiency(characterId, skillId).pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(SkillSlotRepository, _skillSlotRepo),
              Layer.succeed(EventBus, _eventBus),
            ),
          ),
        ),

      assignSkillSlot: (characterId: PlayerId, skillId: number, slotIndex: number) =>
        assignSkillSlot(characterId, skillId, slotIndex).pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(SkillSlotRepository, _skillSlotRepo),
              Layer.succeed(EventBus, _eventBus),
            ),
          ),
        ),

      clearSkillSlot: (characterId: PlayerId, slotIndex: number) =>
        clearSkillSlot(characterId, slotIndex).pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(SkillSlotRepository, _skillSlotRepo),
              Layer.succeed(EventBus, _eventBus),
            ),
          ),
        ),

      unlockSkill: (characterId: PlayerId, skillId: number, playerLevel: number) =>
        unlockSkill(characterId, skillId, playerLevel).pipe(
          Effect.provide(
            Layer.mergeAll(
              Layer.succeed(SkillRepository, _skillRepo),
              Layer.succeed(SkillSlotRepository, _skillSlotRepo),
              Layer.succeed(EventBus, _eventBus),
            ),
          ),
        ),

      autoAttack: (playerId: PlayerId, targetId: string, weaponAtk: number, targetDef: number, dex: number, lck: number) =>
        autoAttack(playerId, targetId, weaponAtk, targetDef, dex, lck).pipe(
          Effect.provide(
            Layer.succeed(CooldownRepository, _cooldownRepo),
          ),
        ),
    }
  }),
)
