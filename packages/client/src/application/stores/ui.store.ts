import { create } from "zustand"

interface UiState {
  inventoryOpen: boolean
  equipmentOpen: boolean
  characterOpen: boolean
  settingsOpen: boolean
  chatOpen: boolean

  toggleInventory: () => void
  toggleEquipment: () => void
  toggleCharacter: () => void
  toggleSettings: () => void
  toggleChat: () => void
  closeAll: () => void
}

export const useUiStore = create<UiState>((set) => ({
  inventoryOpen: false,
  equipmentOpen: false,
  characterOpen: false,
  settingsOpen: false,
  chatOpen: false,

  toggleInventory: () => set((s) => ({ inventoryOpen: !s.inventoryOpen })),
  toggleEquipment: () => set((s) => ({ equipmentOpen: !s.equipmentOpen })),
  toggleCharacter: () => set((s) => ({ characterOpen: !s.characterOpen })),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  closeAll: () =>
    set({
      inventoryOpen: false,
      equipmentOpen: false,
      characterOpen: false,
      settingsOpen: false,
      chatOpen: false,
    }),
}))
