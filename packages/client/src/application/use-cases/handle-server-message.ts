import type { ServerMessage } from "@sao/shared"
import { useGameStore } from "@application/stores/game.store"
import { useNetworkStore } from "@application/stores/network.store"
import { createPosition } from "@domain/entities/position"

const isServerMessage = (data: unknown): data is ServerMessage =>
  data !== null &&
  typeof data === "object" &&
  "_tag" in data &&
  typeof (data as { _tag: unknown })._tag === "string"

export const handleServerMessage = (data: unknown) => {
  if (!isServerMessage(data)) return

  const msg = data

  useNetworkStore.getState().incrementReceived()

  switch (msg._tag) {
    case "connection_ready": {
      useGameStore.getState().setConnectionStatus("connected")
      useGameStore.getState().setCurrentFloor(msg.floor)
      break
    }

    case "player_joined": {
      const game = useGameStore.getState()
      // Don't add ourselves
      const currentChar = game.currentCharacter
      if (currentChar && msg.playerId === currentChar.id) break

      game.addOtherPlayer({
        id: msg.playerId,
        name: msg.name,
        level: msg.level,
        position: createPosition(0, 0, 0),
        rotation: 0,
        animationState: "idle",
      })
      break
    }

    case "player_left": {
      useGameStore.getState().removeOtherPlayer(msg.playerId)
      break
    }

    case "player_moved": {
      useGameStore.getState().updateOtherPlayer(msg.playerId, {
        position: createPosition(msg.x, msg.y, msg.z),
        rotation: msg.rotation,
        animationState: "walking",
      })
      break
    }

    case "zone_state": {
      const game = useGameStore.getState()
      game.setCurrentZone(msg.zoneId, msg.zoneName, msg.isSafeZone)
      game.setCurrentPosition(
        createPosition(msg.spawnX, msg.spawnY, msg.spawnZ),
      )
      game.clearOtherPlayers()
      for (const p of msg.players) {
        game.addOtherPlayer({
          id: p.playerId,
          name: "",
          level: 1,
          position: createPosition(p.x, p.y, p.z),
          rotation: p.rotation,
          animationState: "idle",
        })
      }
      break
    }

    case "heartbeat_ack": {
      const net = useNetworkStore.getState()
      const latency = Date.now() - net.lastHeartbeatSent
      net.setLatency(latency)
      net.recordHeartbeatReceived()
      break
    }

    case "state_update": {
      const game = useGameStore.getState()
      for (const player of msg.players) {
        if (game.currentCharacter && player.id === game.currentCharacter.id) {
          // Server reconciliation: update own position
          game.setCurrentPosition(
            createPosition(player.x, player.y, player.z, player.rotation),
          )
        } else {
          game.updateOtherPlayer(player.id, {
            position: createPosition(player.x, player.y, player.z),
            rotation: player.rotation,
          })
        }
      }
      break
    }

    case "error": {
      console.error(`[Server Error] ${msg.code}: ${msg.message}`)
      break
    }

    case "damage":
    case "chat_broadcast":
      // Will be handled in future sprints
      break
  }
}
