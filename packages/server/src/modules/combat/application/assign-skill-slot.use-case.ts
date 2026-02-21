import { Effect } from "effect"
import { SkillSlotRepository } from "../ports/outbound/skill-slot.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { SkillSlotAssigned } from "../events/published"
import { InvalidTargetError } from "../domain/errors"
import type { PlayerId } from "../../../shared/kernel/types"

const WEAPON_SLOTS = { min: 1, max: 5 }
const SUPPORT_SLOTS = { min: 6, max: 10 }
const PASSIVE_SLOTS = { min: 11, max: 13 }
const MAX_SLOT_INDEX = PASSIVE_SLOTS.max

export type SkillSlotType = "weapon" | "support" | "passive"

export const getSlotType = (slotIndex: number): SkillSlotType | null => {
  if (slotIndex >= WEAPON_SLOTS.min && slotIndex <= WEAPON_SLOTS.max) return "weapon"
  if (slotIndex >= SUPPORT_SLOTS.min && slotIndex <= SUPPORT_SLOTS.max) return "support"
  if (slotIndex >= PASSIVE_SLOTS.min && slotIndex <= PASSIVE_SLOTS.max) return "passive"
  return null
}

export const assignSkillSlot = (
  characterId: PlayerId,
  skillId: number,
  slotIndex: number,
) =>
  Effect.gen(function* () {
    const skillSlotRepo = yield* SkillSlotRepository
    const eventBus = yield* EventBus

    if (slotIndex < 1 || slotIndex > MAX_SLOT_INDEX) {
      return yield* Effect.fail(
        new InvalidTargetError({
          targetId: String(slotIndex),
          reason: `Slot index must be between 1 and ${MAX_SLOT_INDEX}`,
        }),
      )
    }

    const skill = yield* skillSlotRepo.getCharacterSkill(characterId, skillId)
    if (!skill) {
      return yield* Effect.fail(
        new InvalidTargetError({
          targetId: String(skillId),
          reason: "Skill not learned",
        }),
      )
    }

    yield* skillSlotRepo.assignSlot(characterId, skillId, slotIndex)

    yield* eventBus.publish(
      new SkillSlotAssigned({
        timestamp: new Date(),
        aggregateId: characterId,
        playerId: characterId,
        skillId: String(skillId),
        slotIndex,
      }),
    )
  })

export const clearSkillSlot = (
  characterId: PlayerId,
  slotIndex: number,
) =>
  Effect.gen(function* () {
    const skillSlotRepo = yield* SkillSlotRepository

    if (slotIndex < 1 || slotIndex > MAX_SLOT_INDEX) {
      return yield* Effect.fail(
        new InvalidTargetError({
          targetId: String(slotIndex),
          reason: `Slot index must be between 1 and ${MAX_SLOT_INDEX}`,
        }),
      )
    }

    yield* skillSlotRepo.clearSlot(characterId, slotIndex)
  })
