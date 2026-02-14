import { Effect } from "effect"
import { CharacterRepository } from "../ports/outbound/character.repository.js"
import { EventBus } from "../../../shared/infrastructure/event-bus/index.js"
import { PlayerNotFoundError, InvalidStatsError } from "../domain/errors.js"
import { isValidStat } from "../domain/value-objects/stats.js"
import { createEvent } from "../../../shared/kernel/events.js"
import type { PlayerId } from "../../../shared/kernel/types.js"
import type { StatAllocation } from "../ports/inbound/player.port.js"

export const allocateStats = (id: PlayerId, allocation: StatAllocation) =>
  Effect.gen(function* () {
    const repo = yield* CharacterRepository
    const eventBus = yield* EventBus

    const character = yield* repo.findById(id)
    if (!character) {
      return yield* Effect.fail(new PlayerNotFoundError({ id }))
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
      isValidStat(newStats.str) &&
      isValidStat(newStats.agi) &&
      isValidStat(newStats.vit) &&
      isValidStat(newStats.dex) &&
      isValidStat(newStats.int) &&
      isValidStat(newStats.lck)

    if (!allValid) {
      return yield* Effect.fail(
        new InvalidStatsError({
          message: "Stat value out of range (1-999)",
        }),
      )
    }

    yield* repo.saveStats(character.id, newStats)

    yield* eventBus.publish(createEvent("StatsAllocated", character.id))
  })
