import { Data } from "effect"

export class MonsterNotFoundError extends Data.TaggedError("MonsterNotFoundError")<{
  readonly monsterId: string
}> {}

export class SpawnPointNotFoundError extends Data.TaggedError("SpawnPointNotFoundError")<{
  readonly spawnId: number
}> {}

export class InvalidTargetError extends Data.TaggedError("InvalidTargetError")<{
  readonly targetId: string
  readonly reason: string
}> {}
