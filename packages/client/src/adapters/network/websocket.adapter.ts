import type { NetworkPort } from "@ports/network.port"
import { useNetworkStore } from "@application/stores/network.store"

const MAX_RECONNECT_ATTEMPTS = 5
const BACKOFF_BASE_MS = 1000
const BACKOFF_CAP_MS = 16000

export const createWebSocketAdapter = (): NetworkPort => {
  let ws: WebSocket | null = null
  let intentionalDisconnect = false
  let reconnectAttempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let storedUrl: string | null = null
  let storedToken: string | null = null

  const messageHandlers = new Set<(data: unknown) => void>()
  const disconnectHandlers = new Set<() => void>()

  const clearReconnectTimer = () => {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const connectInternal = (url: string, token: string) => {
    ws = new WebSocket(`${url}?token=${token}`)

    ws.onopen = () => {
      reconnectAttempt = 0
      useNetworkStore.getState().setReconnecting(false, 0)
    }

    ws.onmessage = (event) => {
      const data: unknown = JSON.parse(String(event.data))
      messageHandlers.forEach((handler) => handler(data))
    }

    ws.onclose = () => {
      ws = null

      if (!intentionalDisconnect && storedUrl && storedToken) {
        scheduleReconnect()
      }

      disconnectHandlers.forEach((handler) => handler())
    }
  }

  const scheduleReconnect = () => {
    if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      useNetworkStore.getState().setReconnecting(false, 0)
      return
    }

    reconnectAttempt++
    const delay = Math.min(
      BACKOFF_BASE_MS * 2 ** (reconnectAttempt - 1),
      BACKOFF_CAP_MS,
    )

    useNetworkStore.getState().setReconnecting(true, reconnectAttempt)

    reconnectTimer = setTimeout(() => {
      if (storedUrl && storedToken) {
        connectInternal(storedUrl, storedToken)
      }
    }, delay)
  }

  return {
    connect: (url, token) => {
      storedUrl = url
      storedToken = token
      intentionalDisconnect = false
      reconnectAttempt = 0
      connectInternal(url, token)
    },

    disconnect: () => {
      intentionalDisconnect = true
      clearReconnectTimer()
      useNetworkStore.getState().setReconnecting(false, 0)
      ws?.close()
      ws = null
    },

    send: (message) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
      }
    },

    onMessage: (handler) => {
      messageHandlers.add(handler)
      return () => messageHandlers.delete(handler)
    },

    onDisconnect: (handler) => {
      disconnectHandlers.add(handler)
      return () => disconnectHandlers.delete(handler)
    },

    isConnected: () => ws?.readyState === WebSocket.OPEN,
  }
}
