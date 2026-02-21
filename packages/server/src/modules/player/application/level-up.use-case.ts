import { Effect } from "effect"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { PlayerNotFoundError, MaxLevelReachedError } from "../domain/errors"
import { PlayerLeveledUp } from "../events/published"
import type { PlayerId } from "../../../shared/kernel/types"

const MAX_LEVEL = 100
const STAT_POINTS_PER_LEVEL = 5

export const xpNeededForLevel = (level: number): number => 100 * level ** 2

export const levelUp = (id: PlayerId) =>
  Effect.gen(function* () {
    const repo = yield* CharacterRepository
    const eventBus = yield* EventBus

    const character = yield* repo.findById(id)
    if (!character) {
      return yield* Effect.fail(new PlayerNotFoundError({ id }))
    }

    if (character.level >= MAX_LEVEL) {
      return yield* Effect.fail(new MaxLevelReachedError({ level: character.level }))
    }

    let currentLevel = character.level
    let currentXp = character.experience
    let totalNewPoints = 0

    // Multi-level catch-up: keep leveling while XP is sufficient
    while (
      currentLevel < MAX_LEVEL &&
      currentXp >= xpNeededForLevel(currentLevel)
    ) {
      currentXp -= xpNeededForLevel(currentLevel)
      currentLevel++
      totalNewPoints += STAT_POINTS_PER_LEVEL
    }

    if (currentLevel === character.level) {
      // Not enough XP to level up
      return character
    }

    const newUnallocatedPoints =
      character.stats.unallocatedPoints + totalNewPoints

    // Recalculate derived stats at new level
    const newMaxHp =
      100 + (currentLevel - 1) * 20 + character.stats.vit * 10

    yield* repo.updateExperienceAndLevel(
      id,
      currentXp,
      currentLevel,
      newUnallocatedPoints,
      newMaxHp,
    )

    yield* eventBus.publish(
      new PlayerLeveledUp({
        timestamp: new Date(),
        aggregateId: id,
        playerId: id,
        newLevel: currentLevel,
      }),
    )

    return yield* repo.findById(id).pipe(
      Effect.flatMap((c) =>
        c
          ? Effect.succeed(c)
          : Effect.fail(new PlayerNotFoundError({ id })),
      ),
    )
  })
