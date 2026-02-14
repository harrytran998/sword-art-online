import { Data } from "effect"

export class MonsterNotFoundError extends Data.TaggedError("MonsterNotFoundError")<{
  readonly id: string
}> {}

export class SpawnPointOccupiedError extends Data.TaggedError("SpawnPointOccupiedError")<{
  readonly spawnPointId: string
}> {}
