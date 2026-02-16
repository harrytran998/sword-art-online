import { useEffect, useRef } from "react"
import { createPixiAdapter } from "@adapters/renderer/pixi.adapter"
import { createWebSocketAdapter } from "@adapters/network/websocket.adapter"
import { createKeyboardAdapter } from "@adapters/input/keyboard.adapter"
import { createInputProcessor } from "@application/use-cases/process-input"
import { handleServerMessage } from "@application/use-cases/handle-server-message"
import { useGameStore } from "@application/stores/game.store"
import { useNetworkStore } from "@application/stores/network.store"
import { useAuthStore } from "@application/stores/auth.store"
import { HEARTBEAT_CLIENT_INTERVAL_MS } from "@sao/shared"

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<ReturnType<typeof createPixiAdapter> | null>(null)
  const networkRef = useRef<ReturnType<typeof createWebSocketAdapter> | null>(null)
  const keyboardRef = useRef<ReturnType<typeof createKeyboardAdapter> | null>(null)
  const rafRef = useRef<number>(0)
  const prevPlayersRef = useRef<Set<string>>(new Set())

  const token = useAuthStore((s) => s.token)
  const connectionStatus = useGameStore((s) => s.connectionStatus)
  const currentPosition = useGameStore((s) => s.currentPosition)
  const currentZone = useGameStore((s) => s.currentZone)
  const currentZoneName = useGameStore((s) => s.currentZoneName)
  const latency = useNetworkStore((s) => s.latency)
  const playerId = useGameStore((s) => s.currentCharacter?.id)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !token) return

    const renderer = createPixiAdapter()
    const network = createWebSocketAdapter()
    rendererRef.current = renderer
    networkRef.current = network

    const inputProcessor = createInputProcessor(network)

    const keyboard = createKeyboardAdapter({
      onMove: (dx, dz) => inputProcessor.move(dx, dz),
      onStop: () => inputProcessor.stopMoving(),
    })
    keyboardRef.current = keyboard

    let destroyed = false
    let heartbeatInterval: ReturnType<typeof setInterval> | undefined
    let unsubMessage: (() => void) | undefined
    let unsubDisconnect: (() => void) | undefined

    const setup = async () => {
      await renderer.init(canvas)
      if (destroyed) {
        renderer.destroy()
        return
      }

      // Connect WebSocket
      const wsUrl = `ws://${window.location.hostname}:${window.location.port || "8080"}`
      useGameStore.getState().setConnectionStatus("connecting")

      unsubMessage = network.onMessage(handleServerMessage)
      unsubDisconnect = network.onDisconnect(() => {
        useGameStore.getState().setConnectionStatus("disconnected")
      })

      network.connect(wsUrl, token)
      keyboard.attach()

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

        rafRef.current = requestAnimationFrame(renderLoop)
      }

      rafRef.current = requestAnimationFrame(renderLoop)
    }

    void setup()

    return () => {
      destroyed = true
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      cancelAnimationFrame(rafRef.current)
      keyboardRef.current?.detach()
      unsubMessage?.()
      unsubDisconnect?.()
      networkRef.current?.disconnect()
      rendererRef.current?.destroy()
    }
  }, [token])

  return (
    <div className="relative h-full w-full bg-sao-dark">
      <canvas ref={canvasRef} className="h-full w-full" />

      {/* HUD overlay */}
      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
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
        WASD to move
      </div>
    </div>
  )
}
