import { Context, Effect } from "effect"
import type { PlayerId } from "../../../../shared/kernel/types"

export class CooldownRepository extends Context.Tag("CooldownRepository")<
  CooldownRepository,
  {
    readonly setCooldown: (playerId: PlayerId, skillId: number, durationMs: number) => Effect.Effect<void>
    readonly getCooldownRemaining: (playerId: PlayerId, skillId: number) => Effect.Effect<number>
    readonly isOnCooldown: (playerId: PlayerId, skillId: number) => Effect.Effect<boolean>
  }
>() {}
