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

export const isValidStat = (value: number): boolean =>
  Number.isInteger(value) && value >= MIN_STAT && value <= MAX_STAT

export const getStartingStats = (classId: number): CharacterStats => {
  switch (classId) {
    case 1:
      return {
        str: 10,
        agi: 5,
        vit: 8,
        dex: 5,
        int: 3,
        lck: 3,
        unallocatedPoints: 0,
      }
    case 2:
      return {
        str: 5,
        agi: 10,
        vit: 5,
        dex: 8,
        int: 3,
        lck: 3,
        unallocatedPoints: 0,
      }
    case 3:
      return {
        str: 3,
        agi: 5,
        vit: 5,
        dex: 5,
        int: 10,
        lck: 6,
        unallocatedPoints: 0,
      }
    default:
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
}
