import { Data } from "effect"

export class IdentityNotFoundError extends Data.TaggedError("IdentityNotFoundError")<{
  readonly id: string
}> {}

export class InvalidCredentialsError extends Data.TaggedError("InvalidCredentialsError")<{
  readonly message: string
}> {}

export class SessionExpiredError extends Data.TaggedError("SessionExpiredError")<{
  readonly sessionId: string
}> {}
