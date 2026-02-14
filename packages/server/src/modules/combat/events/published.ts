import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface SkillExecuted extends DomainEvent {
  readonly _tag: "SkillExecuted"
  readonly playerId: string
  readonly skillId: string
}

export interface DamageDealt extends DomainEvent {
  readonly _tag: "DamageDealt"
  readonly attackerId: string
  readonly targetId: string
  readonly damage: number
}

export interface PlayerDefeated extends DomainEvent {
  readonly _tag: "PlayerDefeated"
  readonly playerId: string
  readonly defeatedBy: string
}
