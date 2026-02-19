export interface MP {
  readonly current: number
  readonly max: number
}

export const createMP = (current: number, max: number): MP => ({
  current: Math.max(0, Math.min(current, max)),
  max,
})

export const mpPercentage = (mp: MP): number =>
  mp.max === 0 ? 0 : (mp.current / mp.max) * 100
