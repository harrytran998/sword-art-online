import type { NetworkPort } from "@ports/network.port"
import { useGameStore } from "@application/stores/game.store"
import { useNetworkStore } from "@application/stores/network.store"
import { MAX_MOVE_SPEED } from "@sao/shared"
import { normalizeMovement } from "@domain/value-objects/direction"
import { createPosition } from "@domain/entities/position"

export const createInputProcessor = (network: NetworkPort) => {
  const move = (dx: number, dz: number) => {
    const game = useGameStore.getState()
    const position = game.currentPosition
    if (!position) return

    const { dx: ndx, dz: ndz } = normalizeMovement(dx, dz)
    const speed = MAX_MOVE_SPEED
    const vx = ndx * speed
    const vz = ndz * speed

    // Client-side prediction: update position immediately
    const dt = 1 / 60 // one frame at 60fps
    const newX = position.x + vx * dt
    const newZ = position.z + vz * dt
    const rotation = Math.atan2(ndx, ndz)

    game.setCurrentPosition(createPosition(newX, position.y, newZ, rotation))
    game.setVelocity({ x: vx, y: 0, z: vz })
    game.setRotation(rotation)

    // Send to server
    network.send({
      _tag: "movement",
      x: newX,
      y: position.y,
      z: newZ,
      rotation,
      timestamp: Date.now(),
    })
    useNetworkStore.getState().incrementSent()
  }

  const stopMoving = () => {
    useGameStore.getState().setVelocity({ x: 0, y: 0, z: 0 })
  }

  return { move, stopMoving }
}
