/**
 * Position value object — pure TypeScript.
 */
export interface Position {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly rotation: number
}

export const createPosition = (
  x: number,
  y: number,
  z: number,
  rotation = 0,
): Position => ({ x, y, z, rotation })

export const distanceBetween = (a: Position, b: Position): number =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
