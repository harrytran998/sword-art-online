import { create } from "zustand"

interface UiState {
  inventoryOpen: boolean
  characterOpen: boolean
  settingsOpen: boolean
  chatOpen: boolean

  toggleInventory: () => void
  toggleCharacter: () => void
  toggleSettings: () => void
  toggleChat: () => void
  closeAll: () => void
}

export const useUiStore = create<UiState>((set) => ({
  inventoryOpen: false,
  characterOpen: false,
  settingsOpen: false,
  chatOpen: false,

  toggleInventory: () => set((s) => ({ inventoryOpen: !s.inventoryOpen })),
  toggleCharacter: () => set((s) => ({ characterOpen: !s.characterOpen })),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  closeAll: () =>
    set({
      inventoryOpen: false,
      characterOpen: false,
      settingsOpen: false,
      chatOpen: false,
    }),
}))
