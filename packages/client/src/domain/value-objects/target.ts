import type { Position } from '../entities/position'

export interface Target {
  readonly id: string
  readonly type: 'player' | 'monster' | 'npc'
  readonly name: string
  readonly level: number
  readonly position: Position
  readonly currentHp: number
  readonly maxHp: number
}
