/**
 * Character entity — pure TypeScript, no framework dependencies.
 */
export interface CharacterStats {
  readonly str: number
  readonly agi: number
  readonly vit: number
  readonly dex: number
  readonly int: number
  readonly lck: number
}

export interface Character {
  readonly id: string
  readonly name: string
  readonly level: number
  readonly experience: number
  readonly currentHp: number
  readonly maxHp: number
  readonly currentFloor: number
  readonly col: number
  readonly isAlive: boolean
  readonly stats: CharacterStats
}
