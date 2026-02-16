import type { Position } from "./position"

export type MonsterBehavior =
  | "idle"
  | "patrol"
  | "chase"
  | "attack"
  | "flee"
  | "dead"

export interface MonsterEntity {
  readonly id: string
  readonly name: string
  readonly level: number
  readonly hp: number
  readonly maxHp: number
  readonly position: Position
  readonly rotation: number
  readonly behavior: MonsterBehavior
  readonly targetId: string | null
}
