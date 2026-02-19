import { Context, Effect } from "effect"
import type { PlayerId } from "../../../../shared/kernel/types"
import type { ActiveSkill } from "../../domain/entities/active-skill"
import type {
  SkillOnCooldownError,
  OutOfRangeError,
  InvalidTargetError,
  InsufficientMpError,
} from "../../domain/errors"

export interface CombatPort {
  readonly activateSkill: (
    playerId: PlayerId,
    skillId: number,
    targetId?: string,
  ) => Effect.Effect<ActiveSkill, SkillOnCooldownError | OutOfRangeError | InvalidTargetError | InsufficientMpError>
  readonly cancelSkill: (playerId: PlayerId) => Effect.Effect<void>
  readonly getActiveSkill: (playerId: PlayerId) => Effect.Effect<ActiveSkill | null>
  readonly getCooldownRemaining: (playerId: PlayerId, skillId: number) => Effect.Effect<number>
}

export class CombatPort extends Context.Tag("CombatPort")<CombatPort, CombatPort>() {}
