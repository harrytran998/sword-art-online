import { Effect } from "effect"
import { CharacterRepository } from "../ports/outbound/character.repository"
import { EventBus } from "../../../shared/infrastructure/event-bus/index"
import { PlayerNotFoundError, InvalidStatsError } from "../domain/errors"
import { isValidCharacterStat } from "../domain/value-objects/stats"
import { StatsAllocated } from "../events/published"
import type { PlayerId } from "../../../shared/kernel/types"
import type { StatAllocation } from "../ports/inbound/player.port"

export const allocateStats = (id: PlayerId, allocation: StatAllocation) =>
  Effect.gen(function* () {
    const repo = yield* CharacterRepository
    const eventBus = yield* EventBus

    const character = yield* repo.findById(id)
    if (!character) {
      return yield* Effect.fail(new PlayerNotFoundError({ id }))
    }

    const allocationValues = [
      allocation.str,
      allocation.agi,
      allocation.vit,
      allocation.dex,
      allocation.int,
      allocation.lck,
    ]

    if (allocationValues.some((v) => v < 0 || !Number.isInteger(v))) {
      return yield* Effect.fail(
        new InvalidStatsError({
          message: "Allocation values must be non-negative integers",
        }),
      )
    }

    const totalAllocated =
      allocation.str +
      allocation.agi +
      allocation.vit +
      allocation.dex +
      allocation.int +
      allocation.lck

    if (totalAllocated > character.stats.unallocatedPoints) {
      return yield* Effect.fail(
        new InvalidStatsError({
          message: `Not enough points: have ${character.stats.unallocatedPoints}, need ${totalAllocated}`,
        }),
      )
    }

    const newStats = {
      str: character.stats.str + allocation.str,
      agi: character.stats.agi + allocation.agi,
      vit: character.stats.vit + allocation.vit,
      dex: character.stats.dex + allocation.dex,
      int: character.stats.int + allocation.int,
      lck: character.stats.lck + allocation.lck,
      unallocatedPoints:
        character.stats.unallocatedPoints - totalAllocated,
    }

    const allValid =
      isValidCharacterStat(newStats.str) &&
      isValidCharacterStat(newStats.agi) &&
      isValidCharacterStat(newStats.vit) &&
      isValidCharacterStat(newStats.dex) &&
      isValidCharacterStat(newStats.int) &&
      isValidCharacterStat(newStats.lck)

    if (!allValid) {
      return yield* Effect.fail(
        new InvalidStatsError({
          message: "Stat value out of range (1-999)",
        }),
      )
    }

    yield* repo.saveStats(character.id, newStats)

    yield* eventBus.publish(new StatsAllocated({
      timestamp: new Date(),
      aggregateId: character.id,
      playerId: character.id,
    }))
  })
