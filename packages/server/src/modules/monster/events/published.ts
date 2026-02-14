import type { DomainEvent } from "../../../shared/kernel/events.js"

export interface MonsterSpawned extends DomainEvent {
  readonly _tag: "MonsterSpawned"
  readonly monsterId: string
  readonly zoneId: string
}

export interface MonsterKilled extends DomainEvent {
  readonly _tag: "MonsterKilled"
  readonly monsterId: string
  readonly killedBy: string
}

export interface LootDropped extends DomainEvent {
  readonly _tag: "LootDropped"
  readonly monsterId: string
  readonly items: readonly string[]
}
