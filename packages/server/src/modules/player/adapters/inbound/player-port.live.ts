import { Effect, Layer } from "effect"
import { PlayerPort } from "../../ports/inbound/player.port.js"
import { CharacterRepository } from "../../ports/outbound/character.repository.js"
import { createCharacter } from "../../application/create-character.use-case.js"
import { getPlayer, getPlayerByAccountId } from "../../application/get-player.use-case.js"
import { allocateStats } from "../../application/allocate-stats.use-case.js"
import { EventBus } from "../../../../shared/infrastructure/event-bus/index.js"
import { CacheService } from "../../../../shared/infrastructure/cache/index.js"

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
    }
  }),
)
