import { Effect } from "effect"
import { SkillSlotRepository } from "../ports/outbound/skill-slot.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { SkillProficiencyUpdated } from "../events/published"
import { InvalidTargetError } from "../domain/errors"
import type { PlayerId } from "../../../shared/kernel/types"
import { getTierName } from "../domain/value-objects/proficiency-tier"

export const updateProficiency = (
  characterId: PlayerId,
  skillId: number,
) =>
  Effect.gen(function* () {
    const skillSlotRepo = yield* SkillSlotRepository
    const eventBus = yield* EventBus

    const skill = yield* skillSlotRepo.getCharacterSkill(characterId, skillId)
    if (!skill) {
      return yield* Effect.fail(
        new InvalidTargetError({ targetId: String(skillId), reason: "Skill not learned" }),
      )
    }

    const newProficiency = skill.proficiency + 1
    yield* skillSlotRepo.updateProficiency(characterId, skillId, newProficiency)

    const tierName = getTierName(newProficiency)

    yield* eventBus.publish(
      new SkillProficiencyUpdated({
        timestamp: new Date(),
        aggregateId: characterId,
        playerId: characterId,
        skillId: String(skillId),
        newProficiency,
        tierName,
      }),
    )
  })
