import { create } from "zustand"

interface NetworkState {
  latency: number
  lastHeartbeatSent: number
  lastHeartbeatReceived: number
  messagesSent: number
  messagesReceived: number

  setLatency: (latency: number) => void
  recordHeartbeatSent: () => void
  recordHeartbeatReceived: () => void
  incrementSent: () => void
  incrementReceived: () => void
  reset: () => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  latency: 0,
  lastHeartbeatSent: 0,
  lastHeartbeatReceived: 0,
  messagesSent: 0,
  messagesReceived: 0,

  setLatency: (latency) => set({ latency }),
  recordHeartbeatSent: () => set({ lastHeartbeatSent: Date.now() }),
  recordHeartbeatReceived: () => set({ lastHeartbeatReceived: Date.now() }),
  incrementSent: () => set((s) => ({ messagesSent: s.messagesSent + 1 })),
  incrementReceived: () =>
    set((s) => ({ messagesReceived: s.messagesReceived + 1 })),
  reset: () =>
    set({
      latency: 0,
      lastHeartbeatSent: 0,
      lastHeartbeatReceived: 0,
      messagesSent: 0,
      messagesReceived: 0,
    }),
}))
