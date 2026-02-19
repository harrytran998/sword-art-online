export interface StatBlock {
  readonly str: number
  readonly agi: number
  readonly vit: number
  readonly dex: number
  readonly int: number
  readonly lck: number
}

export const totalStats = (stats: StatBlock): number =>
  stats.str + stats.agi + stats.vit + stats.dex + stats.int + stats.lck
