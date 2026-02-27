import { useEffect, useRef, type MutableRefObject } from "react"
import { createPixiAdapter } from "@adapters/renderer/pixi.adapter"
import { createWebSocketAdapter } from "@adapters/network/websocket.adapter"
import { createKeyboardAdapter } from "@adapters/input/keyboard.adapter"
import { createSkillInputAdapter } from "@adapters/input/skill-input.adapter"
import { createMouseAdapter } from "@adapters/input/mouse.adapter"
import { createInputProcessor } from "@application/use-cases/process-input"
import { useGameStore } from "@application/stores/game.store"
import { useNetworkStore } from "@application/stores/network.store"
import { HEARTBEAT_CLIENT_INTERVAL_MS } from "@sao/shared"
import { HpMpBars } from "./hud/HpMpBars"
import { SkillBar } from "./hud/SkillBar"
import { TargetFrame } from "./hud/TargetFrame"
import { PartyMinimap } from "./hud/PartyMinimap"
import { InventoryPanel } from "./panels/InventoryPanel"
import { EquipmentPanel } from "./panels/EquipmentPanel"
import { CharacterStatsPanel } from "./panels/CharacterStatsPanel"
import { useUiStore } from "@application/stores/ui.store"
import { PartyFrame } from "./social/PartyFrame"
import { PartyInviteDialog } from "./social/PartyInviteDialog"
import { ChatWindow } from "./social/ChatWindow"

interface GameCanvasProps {
  readonly networkRef: MutableRefObject<ReturnType<typeof createWebSocketAdapter> | null>
}

export const GameCanvas = ({ networkRef }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<ReturnType<typeof createPixiAdapter> | null>(null)
  const keyboardRef = useRef<ReturnType<typeof createKeyboardAdapter> | null>(null)
  const skillInputRef = useRef<ReturnType<typeof createSkillInputAdapter> | null>(null)
  const mouseRef = useRef<ReturnType<typeof createMouseAdapter> | null>(null)
  const rafRef = useRef<number>(0)
  const prevPlayersRef = useRef<Set<string>>(new Set())

  const connectionStatus = useGameStore((s) => s.connectionStatus)
  const currentPosition = useGameStore((s) => s.currentPosition)
  const currentZone = useGameStore((s) => s.currentZone)
  const currentZoneName = useGameStore((s) => s.currentZoneName)
  const latency = useNetworkStore((s) => s.latency)
  const playerId = useGameStore((s) => s.currentCharacter?.id)
  const isReconnecting = useNetworkStore((s) => s.isReconnecting)
  const reconnectAttempt = useNetworkStore((s) => s.reconnectAttempt)

  useEffect(() => {
    const canvas = canvasRef.current
    const network = networkRef.current
    if (!canvas || !network) return

    const renderer = createPixiAdapter()
    rendererRef.current = renderer

    const inputProcessor = createInputProcessor(network)

    const keyboard = createKeyboardAdapter({
      onMove: (dx, dz) => inputProcessor.move(dx, dz),
      onStop: () => inputProcessor.stopMoving(),
    })
    keyboardRef.current = keyboard
    
    const skillInput = createSkillInputAdapter({
      activateSkill: (skillId) => inputProcessor.activateSkill(skillId),
      cancelSkill: () => inputProcessor.cancelSkill(),
      selectTarget: (targetId) => inputProcessor.selectTarget(targetId),
    })
    skillInputRef.current = skillInput

    const mouse = createMouseAdapter(canvas, {
      onClick: (x, y) => {
        const entityId = renderer.getEntityAt(x, y)
        if (entityId) {
          inputProcessor.selectTarget(entityId)
        } else {
          inputProcessor.selectTarget(null)
        }
      }
    })
    mouseRef.current = mouse

    let destroyed = false
    let heartbeatInterval: ReturnType<typeof setInterval> | undefined

    const setup = async () => {
      await renderer.init(canvas)
      if (destroyed) {
        renderer.destroy()
        return
      }

      keyboard.attach()
      skillInput.attach()
      mouse.attach()

      // Heartbeat interval
      heartbeatInterval = setInterval(() => {
        if (network.isConnected()) {
          useNetworkStore.getState().recordHeartbeatSent()
          network.send({ _tag: "heartbeat", timestamp: Date.now() })
        }
      }, HEARTBEAT_CLIENT_INTERVAL_MS)

      // Render loop
      const renderLoop = () => {
        if (destroyed) return

        const state = useGameStore.getState()
        const pos = state.currentPosition

        // Sync local player sprite
        if (pos && state.currentCharacter) {
          const id = state.currentCharacter.id
          renderer.addPlayer(id, state.currentCharacter.name, pos.x, pos.z, true)
          renderer.updatePlayer(id, pos.x, pos.z, state.rotation)
          renderer.setCamera(pos.x, pos.z, 1)
        }

        // Sync other players
        const currentIds = new Set<string>()
        for (const [id, player] of state.otherPlayers) {
          currentIds.add(id)
          renderer.addPlayer(id, player.name, player.position.x, player.position.z, false)
          renderer.updatePlayer(id, player.position.x, player.position.z, player.rotation)
        }

        // Remove players that left
        for (const id of prevPlayersRef.current) {
          if (!currentIds.has(id)) {
            renderer.removePlayer(id)
          }
        }
        prevPlayersRef.current = currentIds

        const effects = state.combatEffects
        if (effects.length > 0) {
          for (const effect of effects) {
            if (effect.type === "damage") {
              const target =
                effect.targetId === state.currentCharacter?.id
                  ? { position: state.currentPosition }
                  : state.otherPlayers.get(effect.targetId) ?? state.targets.get(effect.targetId)

              if (target?.position) {
                renderer.showDamageNumber(
                  target.position.x,
                  target.position.z,
                  effect.amount,
                  effect.isCritical,
                )
              }
            } else if (effect.type === "skill") {
              const source =
                effect.sourceId === state.currentCharacter?.id
                  ? { position: state.currentPosition }
                  : state.otherPlayers.get(effect.sourceId)

              if (source?.position) {
                renderer.showSkillEffect(
                  source.position.x,
                  source.position.z,
                  effect.skillId,
                  effect.sourceId === state.currentCharacter?.id,
                )
              }
            } else if (effect.type === "glow") {
              renderer.showGlowEffect(effect.targetId, effect.color)
            }
          }
          state.clearCombatEffects()
        }

        rafRef.current = requestAnimationFrame(renderLoop)
      }

      rafRef.current = requestAnimationFrame(renderLoop)
    }

    void setup()

    // Global hotkeys for UI
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore input when typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      
      const key = e.key.toLowerCase()
      if (key === "i" || key === "b") {
        useUiStore.getState().toggleInventory()
      } else if (key === "c" || key === "e") {
        useUiStore.getState().toggleEquipment()
      } else if (key === "escape") {
        useUiStore.getState().closeAll()
      }
    }
    globalThis.addEventListener("keydown", onKeyDown)

    return () => {
      destroyed = true
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      cancelAnimationFrame(rafRef.current)
      globalThis.removeEventListener("keydown", onKeyDown)
      keyboardRef.current?.detach()
      skillInputRef.current?.detach()
      mouseRef.current?.detach()
      rendererRef.current?.destroy()
    }
  }, [networkRef])

  return (
    <div className="relative h-full w-full bg-sao-dark">
      <canvas ref={canvasRef} className="h-full w-full" />
      
      <HpMpBars />
      <TargetFrame />
      <PartyMinimap />
      <SkillBar />
      <InventoryPanel />
      <EquipmentPanel />
      <CharacterStatsPanel />
      <PartyFrame
        onCreateParty={() => {
          networkRef.current?.send({ _tag: "party_create" })
        }}
        onInvite={(targetPlayerId) => {
          networkRef.current?.send({ _tag: "party_invite", targetPlayerId })
        }}
        onLeaveParty={() => {
          networkRef.current?.send({ _tag: "party_leave" })
        }}
        onDisbandParty={() => {
          networkRef.current?.send({ _tag: "party_disband" })
        }}
        onSetLootMode={(mode) => {
          networkRef.current?.send({ _tag: "party_set_loot_mode", mode })
        }}
      />
      <PartyInviteDialog
        onRespond={(inviteId, accept) => {
          networkRef.current?.send({ _tag: "party_invite_respond", inviteId, accept })
        }}
      />
      <ChatWindow
        onSend={(channel, message) => {
          networkRef.current?.send({ _tag: "chat", channel, message })
        }}
      />

      {/* Reconnection overlay */}
      {isReconnecting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <p className="text-lg text-sao-gold">Reconnecting...</p>
            <p className="mt-1 text-sm text-gray-400">
              Attempt {reconnectAttempt} of 5
            </p>
          </div>
        </div>
      )}

      {/* HUD overlay */}
      <div className="pointer-events-none absolute left-4 top-24 flex flex-col gap-2">
        <div className="rounded bg-sao-panel/80 px-3 py-1.5 text-xs text-gray-300">
          <span className="text-sao-gold">{currentZoneName ?? "---"}</span>
          {currentZone && (
            <span className="ml-2 text-gray-500">({currentZone})</span>
          )}
        </div>
        <div className="rounded bg-sao-panel/80 px-3 py-1.5 text-xs text-gray-400">
          Pos: {currentPosition ? `${Math.round(currentPosition.x)}, ${Math.round(currentPosition.z)}` : "---"}
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 flex flex-col gap-2">
        <div className="rounded bg-sao-panel/80 px-3 py-1.5 text-xs text-gray-400">
          <span className={connectionStatus === "connected" ? "text-sao-green" : "text-sao-gold"}>
            {connectionStatus}
          </span>
          {latency > 0 && (
            <span className="ml-2">{latency}ms</span>
          )}
        </div>
        {playerId && (
          <div className="rounded bg-sao-panel/80 px-3 py-1.5 text-xs text-gray-500">
            {playerId.slice(0, 8)}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded bg-sao-panel/80 px-3 py-1.5 text-xs text-gray-500">
        WASD to move • 1-9 Skills • Click to Select
      </div>
    </div>
  )
}
