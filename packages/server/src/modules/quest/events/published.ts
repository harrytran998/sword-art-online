import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface QuestAccepted extends DomainEvent {
  readonly _tag: "QuestAccepted"
  readonly questId: string
  readonly playerId: string
}

export interface QuestCompleted extends DomainEvent {
  readonly _tag: "QuestCompleted"
  readonly questId: string
  readonly playerId: string
}

export interface ObjectiveUpdated extends DomainEvent {
  readonly _tag: "ObjectiveUpdated"
  readonly questId: string
  readonly objectiveId: string
  readonly progress: number
}
