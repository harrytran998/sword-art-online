import type { NetworkPort } from "@ports/network.port"
import { usePlayerStore } from "@application/stores/player.store"
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

  const activateSkill = (skillId: number, targetId?: string) => {
    useGameStore.getState().setActiveSkill(skillId)
    network.send({
      _tag: "skill_activate",
      skillId,
      targetId: targetId ?? usePlayerStore.getState().selectedTargetId ?? undefined,
      timestamp: Date.now(),
    })
    useNetworkStore.getState().incrementSent()
  }

  const cancelSkill = () => {
    useGameStore.getState().setActiveSkill(null)
    network.send({
      _tag: "skill_cancel",
      timestamp: Date.now(),
    })
  }

  const selectTarget = (targetId: string | null) => {
    usePlayerStore.getState().setSelectedTarget(targetId)
  }

  return { move, stopMoving, activateSkill, cancelSkill, selectTarget }
}
