export interface DomainEvent {
  readonly _tag: string
  readonly timestamp: Date
  readonly aggregateId: string
}

export const createEvent = <T extends string>(
  tag: T,
  aggregateId: string,
): DomainEvent & { readonly _tag: T } => ({
  _tag: tag,
  timestamp: new Date(),
  aggregateId,
})
