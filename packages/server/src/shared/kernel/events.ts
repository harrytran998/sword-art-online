export interface DomainEvent {
  readonly _tag: string
  readonly timestamp: Date
  readonly aggregateId: string
}
