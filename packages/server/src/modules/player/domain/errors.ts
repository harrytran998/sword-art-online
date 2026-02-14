import { Data } from "effect"

export class PlayerNotFoundError extends Data.TaggedError("PlayerNotFoundError")<{
  readonly id: string
}> {}

export class InvalidStatsError extends Data.TaggedError("InvalidStatsError")<{
  readonly message: string
}> {}

export class CharacterNameTakenError extends Data.TaggedError("CharacterNameTakenError")<{
  readonly name: string
}> {}
