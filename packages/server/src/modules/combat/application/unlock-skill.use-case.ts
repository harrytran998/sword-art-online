import { Effect } from "effect"
import { SkillRepository } from "../ports/outbound/skill.repository"
import { SkillSlotRepository } from "../ports/outbound/skill-slot.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { SkillUnlocked } from "../events/published"
import { SkillNotUnlockedError, InvalidTargetError } from "../domain/errors"
import type { PlayerId } from "../../../shared/kernel/types"

export const unlockSkill = (
  characterId: PlayerId,
  skillId: number,
  playerLevel: number,
) =>
  Effect.gen(function* () {
    const skillRepo = yield* SkillRepository
    const skillSlotRepo = yield* SkillSlotRepository
    const eventBus = yield* EventBus

    // Check the skill exists
    const skillDef = yield* skillRepo.getSkillById(skillId)
    if (!skillDef) {
      return yield* Effect.fail(
        new InvalidTargetError({ targetId: String(skillId), reason: "Skill not found" }),
      )
    }

    // Check level requirement
    if (playerLevel < skillDef.levelReq) {
      return yield* Effect.fail(
        new SkillNotUnlockedError({ skillId, levelReq: skillDef.levelReq }),
      )
    }

    // Check if already learned
    const existing = yield* skillSlotRepo.getCharacterSkill(characterId, skillId)
    if (existing) {
      return // Already learned, no-op
    }

    yield* skillSlotRepo.insertCharacterSkill(characterId, skillId)

    yield* eventBus.publish(
      new SkillUnlocked({
        timestamp: new Date(),
        aggregateId: characterId,
        playerId: characterId,
        skillId: String(skillId),
        skillName: skillDef.name,
      }),
    )
  })
