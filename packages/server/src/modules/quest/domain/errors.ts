import { Data } from "effect"

export class QuestNotFoundError extends Data.TaggedError("QuestNotFoundError")<{
  readonly questId: string
}> {}

export class QuestAlreadyAcceptedError extends Data.TaggedError("QuestAlreadyAcceptedError")<{
  readonly questId: string
  readonly playerId: string
}> {}

export class QuestRequirementsNotMetError extends Data.TaggedError("QuestRequirementsNotMetError")<{
  readonly questId: string
  readonly reason: string
}> {}
