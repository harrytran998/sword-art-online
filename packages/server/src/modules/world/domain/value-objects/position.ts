export interface Position {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface Velocity {
  readonly x: number
  readonly y: number
  readonly z: number
}

export const positionDistance = (a: Position, b: Position): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export const addVelocityToPosition = (pos: Position, vel: Velocity, dt: number): Position => ({
  x: pos.x + vel.x * dt,
  y: pos.y + vel.y * dt,
  z: pos.z + vel.z * dt,
})
