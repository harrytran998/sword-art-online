import { getClassById } from "@sao/shared"

const MIN_STAT = 1
const MAX_STAT = 999

export interface CharacterStats {
  readonly str: number
  readonly agi: number
  readonly vit: number
  readonly dex: number
  readonly int: number
  readonly lck: number
  readonly unallocatedPoints: number
}

export const isValidCharacterStat = (value: number): boolean =>
  Number.isInteger(value) && value >= MIN_STAT && value <= MAX_STAT

export const getStartingStats = (classId: number): CharacterStats => {
  const classDef = getClassById(classId)
  if (!classDef) {
    return {
      str: 5,
      agi: 5,
      vit: 5,
      dex: 5,
      int: 5,
      lck: 5,
      unallocatedPoints: 0,
    }
  }
  return { ...classDef.stats, unallocatedPoints: 0 }
}
