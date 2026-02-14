import { Data } from "effect"

export class DomainError extends Data.TaggedError("DomainError")<{
  readonly message: string
  readonly code: string
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly entity: string
  readonly id: string
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string
  readonly message: string
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly message: string
}> {}
