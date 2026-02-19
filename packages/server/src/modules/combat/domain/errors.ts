import { Data } from "effect"

export class SkillOnCooldownError extends Data.TaggedError("SkillOnCooldownError")<{
  readonly skillId: number
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

export class InsufficientMpError extends Data.TaggedError("InsufficientMpError")<{
  readonly required: number
  readonly current: number
}> {}

export class SkillNotUnlockedError extends Data.TaggedError("SkillNotUnlockedError")<{
  readonly skillId: number
  readonly levelReq: number
}> {}
