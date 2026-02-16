import { create } from "zustand"

interface NetworkState {
  latency: number
  lastHeartbeatSent: number
  lastHeartbeatReceived: number
  messagesSent: number
  messagesReceived: number
  isReconnecting: boolean
  reconnectAttempt: number

  setLatency: (latency: number) => void
  recordHeartbeatSent: () => void
  recordHeartbeatReceived: () => void
  incrementSent: () => void
  incrementReceived: () => void
  setReconnecting: (isReconnecting: boolean, attempt?: number) => void
  reset: () => void
}

const initialState = {
  latency: 0,
  lastHeartbeatSent: 0,
  lastHeartbeatReceived: 0,
  messagesSent: 0,
  messagesReceived: 0,
  isReconnecting: false,
  reconnectAttempt: 0,
}

export const useNetworkStore = create<NetworkState>((set) => ({
  ...initialState,

  setLatency: (latency) => set({ latency }),
  recordHeartbeatSent: () => set({ lastHeartbeatSent: Date.now() }),
  recordHeartbeatReceived: () => set({ lastHeartbeatReceived: Date.now() }),
  incrementSent: () => set((s) => ({ messagesSent: s.messagesSent + 1 })),
  incrementReceived: () =>
    set((s) => ({ messagesReceived: s.messagesReceived + 1 })),
  setReconnecting: (isReconnecting, attempt) =>
    set({ isReconnecting, reconnectAttempt: attempt ?? 0 }),
  reset: () => set(initialState),
}))
