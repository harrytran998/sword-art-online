export type Direction = "up" | "down" | "left" | "right"

export interface MovementInput {
  readonly dx: number
  readonly dz: number
}

export const normalizeMovement = (dx: number, dz: number): MovementInput => {
  const magnitude = Math.sqrt(dx * dx + dz * dz)
  if (magnitude === 0) return { dx: 0, dz: 0 }
  return { dx: dx / magnitude, dz: dz / magnitude }
}
