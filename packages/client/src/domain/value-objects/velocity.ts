import type { Position } from "../entities/position"

export interface Velocity {
  readonly x: number
  readonly y: number
  readonly z: number
}

export const ZERO_VELOCITY: Velocity = { x: 0, y: 0, z: 0 }

export const lerpPosition = (
  from: Position,
  to: Position,
  t: number,
): Position => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
  z: from.z + (to.z - from.z) * t,
  rotation: from.rotation + (to.rotation - from.rotation) * t,
})
