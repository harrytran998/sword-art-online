import { Data } from "effect"

export class SkillOnCooldownError extends Data.TaggedError("SkillOnCooldownError")<{
  readonly skillId: string
  readonly remainingMs: number
}> {}

export class OutOfRangeError extends Data.TaggedError("OutOfRangeError")<{
  readonly distance: number
  readonly maxRange: number
}> {}

export class InvalidTargetError extends Data.TaggedError("InvalidTargetError")<{
  readonly targetId: string
  readonly reason: string
}> {}
