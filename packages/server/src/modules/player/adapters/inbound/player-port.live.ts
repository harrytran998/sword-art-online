import { Effect, Layer } from "effect"
import { PlayerPort } from "../../ports/inbound/player.port"
import { CharacterRepository } from "../../ports/outbound/character.repository"
import { createCharacter } from "../../application/create-character.use-case"
import { getPlayer, getPlayerByAccountId } from "../../application/get-player.use-case"
import { allocateStats } from "../../application/allocate-stats.use-case"
import { grantExperience } from "../../application/grant-experience.use-case"
import { applyDeathPenalty } from "../../application/death-penalty.use-case"
import { EventBus } from "../../../../shared/infrastructure/event-bus/index"
import { CacheService } from "../../../../shared/infrastructure/cache/index"

export const PlayerPortLive = Layer.effect(
  PlayerPort,
  Effect.gen(function* () {
    const ctx = yield* Effect.context<CharacterRepository | EventBus | CacheService>()

    return {
      createCharacter: (params) =>
        createCharacter(params).pipe(Effect.provide(ctx)),
      getPlayer: (id) =>
        getPlayer(id).pipe(Effect.provide(ctx)),
      getPlayerByAccountId: (accountId) =>
        getPlayerByAccountId(accountId).pipe(Effect.provide(ctx)),
      allocateStats: (id, stats) =>
        allocateStats(id, stats).pipe(Effect.provide(ctx)),
      addCurrency: () => Effect.void, // TODO: Implement
      deductCurrency: () => Effect.void, // TODO: Implement
      grantExperience: (id, amount) =>
        grantExperience(id, amount).pipe(Effect.provide(ctx)),
      applyDeathPenalty: (id) =>
        applyDeathPenalty(id).pipe(Effect.provide(ctx)),
    }
  }),
)

