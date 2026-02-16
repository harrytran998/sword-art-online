import type { NetworkPort } from "@ports/network.port"

export const createWebSocketAdapter = (): NetworkPort => {
  let ws: WebSocket | null = null
  const messageHandlers = new Set<(data: unknown) => void>()
  const disconnectHandlers = new Set<() => void>()

  return {
    connect: (url, token) => {
      ws = new WebSocket(`${url}?token=${token}`)

      ws.onmessage = (event) => {
        const data: unknown = JSON.parse(String(event.data))
        messageHandlers.forEach((handler) => handler(data))
      }

      ws.onclose = () => {
        disconnectHandlers.forEach((handler) => handler())
      }
    },

    disconnect: () => {
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
