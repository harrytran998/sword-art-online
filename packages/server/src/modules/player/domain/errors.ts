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

export class InvalidCharacterNameError extends Data.TaggedError("InvalidCharacterNameError")<{
  readonly name: string
}> {}

export class InvalidClassIdError extends Data.TaggedError("InvalidClassIdError")<{
  readonly classId: number
}> {}

export class AccountAlreadyHasCharacterError extends Data.TaggedError("AccountAlreadyHasCharacterError")<{
  readonly accountId: string
}> {}

export class MaxLevelReachedError extends Data.TaggedError("MaxLevelReachedError")<{
  readonly level: number
}> {}
