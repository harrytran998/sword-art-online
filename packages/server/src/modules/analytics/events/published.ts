import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface GameEventLogged extends DomainEvent {
  readonly _tag: "GameEventLogged"
  readonly eventType: string
  readonly payload: Record<string, unknown>
}

export interface LeaderboardUpdated extends DomainEvent {
  readonly _tag: "LeaderboardUpdated"
  readonly leaderboardId: string
}
