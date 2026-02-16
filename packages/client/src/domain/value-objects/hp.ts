export interface HP {
  readonly current: number
  readonly max: number
}

export const createHP = (current: number, max: number): HP => ({
  current: Math.max(0, Math.min(current, max)),
  max,
})

export const hpPercentage = (hp: HP): number =>
  hp.max === 0 ? 0 : (hp.current / hp.max) * 100

export const isDead = (hp: HP): boolean => hp.current <= 0
