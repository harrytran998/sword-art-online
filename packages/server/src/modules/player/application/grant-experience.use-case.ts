import { Effect } from "effect"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { PlayerNotFoundError, MaxLevelReachedError } from "../domain/errors"
import { levelUp, xpNeededForLevel } from "./level-up.use-case"
import type { PlayerId } from "../../../shared/kernel/types"
import type { Character } from "../domain/entities/character"

export const grantExperience = (
  id: PlayerId,
  amount: number,
): Effect.Effect<Character, PlayerNotFoundError | MaxLevelReachedError, CharacterRepository | EventBus> =>
  Effect.gen(function* () {
    const repo = yield* CharacterRepository

    const character = yield* repo.findById(id)
    if (!character) {
      return yield* Effect.fail(new PlayerNotFoundError({ id }))
    }

    if (amount <= 0) {
      return character
    }

    const newExperience = character.experience + amount

    // Update XP first
    yield* repo.updateExperienceAndLevel(
      id,
      newExperience,
      character.level,
      character.stats.unallocatedPoints,
      character.maxHp,
    )

    // Check if level-up is triggered
    if (newExperience >= xpNeededForLevel(character.level)) {
      return yield* levelUp(id)
    }

    return yield* repo.findById(id).pipe(
      Effect.flatMap((c) =>
        c
          ? Effect.succeed(c)
          : Effect.fail(new PlayerNotFoundError({ id })),
      ),
    )
  })
