import { Effect } from "effect"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { PlayerNotFoundError } from "../domain/errors"
import type { PlayerId } from "../../../shared/kernel/types"

const DEATH_PENALTY_RATE = 0.1 // 10% of current level XP

export const applyDeathPenalty = (id: PlayerId) =>
  Effect.gen(function* () {
    const repo = yield* CharacterRepository

    const character = yield* repo.findById(id)
    if (!character) {
      return yield* Effect.fail(new PlayerNotFoundError({ id }))
    }

    // Lose 10% of current level XP, but never go below 0 (never level down)
    const xpLoss = Math.floor(character.experience * DEATH_PENALTY_RATE)
    const newExperience = Math.max(0, character.experience - xpLoss)

    yield* repo.updateExperienceAndLevel(
      id,
      newExperience,
      character.level,
      character.stats.unallocatedPoints,
      character.maxHp,
    )
  })
