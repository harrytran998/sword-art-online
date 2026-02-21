/**
 * Line-of-sight check using 2D raycast between two positions.
 *
 * Currently a simplified implementation:
 * - Open zones: always returns true (no obstacle geometry yet)
 * - Boss rooms: blocked by room boundary walls
 *
 * Will be enhanced with proper obstacle geometry when map data is available.
 */

export interface Position2D {
  readonly x: number
  readonly z: number
}

export interface Obstacle {
  readonly minX: number
  readonly minZ: number
  readonly maxX: number
  readonly maxZ: number
}

/**
 * Check if there is a clear line of sight between two positions.
 * Uses a simple 2D AABB intersection test against obstacle rectangles.
 *
 * @returns true if line of sight is clear (no obstacles blocking)
 */
export const checkLineOfSight = (
  from: Position2D,
  to: Position2D,
  obstacles: readonly Obstacle[],
): boolean => {
  if (obstacles.length === 0) return true

  // Simple ray-AABB intersection using parametric line test
  const dx = to.x - from.x
  const dz = to.z - from.z

  for (const obs of obstacles) {
    if (rayIntersectsAABB(from.x, from.z, dx, dz, obs)) {
      return false
    }
  }

  return true
}

/**
 * Test a single slab intersection. Returns the updated [tMin, tMax] range,
 * or null if the ray misses the slab entirely.
 */
const slabIntersect = (
  origin: number,
  dir: number,
  slabMin: number,
  slabMax: number,
  tMin: number,
  tMax: number,
): [number, number] | null => {
  if (Math.abs(dir) < 1e-8) {
    // Ray is parallel to slab
    if (origin < slabMin || origin > slabMax) return null
    return [tMin, tMax]
  }
  const invD = 1 / dir
  let t1 = (slabMin - origin) * invD
  let t2 = (slabMax - origin) * invD
  if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
  const newMin = Math.max(tMin, t1)
  const newMax = Math.min(tMax, t2)
  if (newMin > newMax) return null
  return [newMin, newMax]
}

/**
 * Test if a ray from (ox, oz) with direction (dx, dz) intersects an AABB.
 * Uses the slab method for 2D ray-AABB intersection.
 */
const rayIntersectsAABB = (
  ox: number,
  oz: number,
  dx: number,
  dz: number,
  aabb: Obstacle,
): boolean => {
  // X-axis slab
  const xResult = slabIntersect(ox, dx, aabb.minX, aabb.maxX, 0, 1)
  if (!xResult) return false

  // Z-axis slab
  const zResult = slabIntersect(oz, dz, aabb.minZ, aabb.maxZ, xResult[0], xResult[1])
  return zResult !== null
}
