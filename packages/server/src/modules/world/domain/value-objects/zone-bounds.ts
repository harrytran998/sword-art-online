export interface ZoneBounds {
  readonly minX: number
  readonly minY: number
  readonly minZ: number
  readonly maxX: number
  readonly maxY: number
  readonly maxZ: number
}

export const contains = (bounds: ZoneBounds, x: number, y: number, z: number): boolean =>
  x >= bounds.minX &&
  x <= bounds.maxX &&
  y >= bounds.minY &&
  y <= bounds.maxY &&
  z >= bounds.minZ &&
  z <= bounds.maxZ

export const clamp = (
  bounds: ZoneBounds,
  x: number,
  y: number,
  z: number,
): { x: number; y: number; z: number } => ({
  x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
  y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
  z: Math.max(bounds.minZ, Math.min(bounds.maxZ, z)),
})
