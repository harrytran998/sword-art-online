import type { ServerMessage } from "@sao/shared"
import { useGameStore } from "@application/stores/game.store"
import { usePlayerStore } from "@application/stores/player.store"
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

    case "character_data": {
      const game = useGameStore.getState()
      const playerStore = usePlayerStore.getState()

      game.setCurrentCharacter({
        id: msg.characterId,
        name: msg.name,
        level: msg.level,
        experience: msg.experience,
        currentHp: msg.currentHp,
        maxHp: msg.maxHp,
        currentFloor: msg.currentFloor,
        col: msg.col,
        isAlive: msg.currentHp > 0,
        stats: msg.stats,
      })

      playerStore.setHp(msg.currentHp)
      playerStore.setMaxHp(msg.maxHp)
      playerStore.setCol(msg.col)

      game.setGamePhase("in_game")
      break
    }

    case "no_character": {
      useGameStore.getState().setGamePhase("character_create")
      break
    }

    case "character_create_error": {
      // Store error for CharacterCreate to display
      useGameStore.getState().setCharacterCreateError(msg.message)
      break
    }

    case "player_joined": {
      const game = useGameStore.getState()
      // Don't add ourselves
      if (msg.playerId === game.currentCharacter?.id) break

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
        if (player.id === game.currentCharacter?.id) {
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

    case "skill_activated": {
      const game = useGameStore.getState()
      if (msg.playerId === game.currentCharacter?.id) {
        game.setActiveSkill(msg.skillId)
      }
      game.addCombatEffect({
        type: "glow",
        targetId: msg.playerId,
        color: 0xffff00,
      })
      break
    }

    case "skill_executed": {
      const game = useGameStore.getState()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = msg as any

      if (message.attackerId === game.currentCharacter?.id) {
        game.setActiveSkill(null)
      }
      
      if (message.damage) {
        game.addCombatEffect({
          type: "damage",
          targetId: message.targetId,
          amount: message.damage.finalDamage,
          isCritical: message.damage.isCritical,
        })
      }
      
      game.addCombatEffect({
        type: "skill",
        skillId: message.skillId,
        sourceId: message.attackerId,
      })
      break
    }

    case "damage": {
       const game = useGameStore.getState()
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const message = msg as any

       if (game.targets.has(message.targetId)) {
           game.updateTarget(message.targetId, { currentHp: message.currentHp })
       }

       game.addCombatEffect({
           type: "damage",
           targetId: message.targetId,
           amount: message.amount,
           isCritical: false
       })
       break
    }

    case "target_hp_update": {
       const game = useGameStore.getState()
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const message = msg as any

       if (game.targets.has(message.targetId)) {
           game.updateTarget(message.targetId, { currentHp: message.currentHp, maxHp: message.maxHp })
       }
       break
    }

    case "chat_broadcast":
      // Will be handled in future sprints
      break
  }
}
