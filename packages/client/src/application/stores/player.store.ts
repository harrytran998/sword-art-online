import { create } from "zustand"
import type { SkillState } from "../../domain/value-objects/skill"
import type { InventorySlot } from "@sao/server/src/modules/inventory/domain/entities/inventory-slot"
import type { EquipmentSlotType } from "@sao/server/src/modules/inventory/domain/value-objects/equipment-slot"

interface PlayerState {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  experience: number
  experienceToNext: number
  col: number
  skills: SkillState[]
  selectedTargetId: string | null
  inventory: InventorySlot[]
  equipment: Record<EquipmentSlotType, InventorySlot | null>

  setHp: (hp: number) => void
  setMaxHp: (maxHp: number) => void
  setMp: (mp: number) => void
  setMaxMp: (maxMp: number) => void
  setExperience: (experience: number, experienceToNext: number) => void
  setCol: (col: number) => void
  setSkills: (skills: SkillState[]) => void
  setSkillCooldown: (skillId: number, cooldown: number) => void
  setSelectedTarget: (targetId: string | null) => void
  setInventory: (slots: InventorySlot[]) => void
  setEquipment: (equipment: Record<EquipmentSlotType, InventorySlot | null>) => void
  updateInventorySlot: (slot: InventorySlot) => void
  removeInventorySlot: (slotId: string) => void
  moveInventoryItem: (fromIndex: number, toIndex: number) => void
  equipItem: (inventoryIndex: number, equipmentSlot: EquipmentSlotType) => void
  unequipItem: (equipmentSlot: EquipmentSlotType, inventoryIndex: number) => void
  useItem: (inventoryIndex: number) => void
  dropItem: (inventoryIndex: number) => void
  reset: () => void
}

const initialState = {
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  experience: 0,
  experienceToNext: 100,
  col: 0,
  skills: [],
  selectedTargetId: null,
  inventory: [],
  equipment: {
    head: null,
    chest: null,
    hands: null,
    legs: null,
    feet: null,
    main_hand: null,
    off_hand: null,
  } as Record<EquipmentSlotType, InventorySlot | null>,
}

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,

  setHp: (hp) => set({ hp }),
  setMaxHp: (maxHp) => set({ maxHp }),
  setMp: (mp) => set({ mp }),
  setMaxMp: (maxMp) => set({ maxMp }),
  setExperience: (experience, experienceToNext) =>
    set({ experience, experienceToNext }),
  setCol: (col) => set({ col }),
  setSkills: (skills) => set({ skills }),
  setSkillCooldown: (skillId, cooldown) =>
    set((state) => ({
      skills: state.skills.map((s) =>
        s.skillId === skillId ? { ...s, currentCooldown: cooldown } : s,
      ),
    })),
  setSelectedTarget: (selectedTargetId) => set({ selectedTargetId }),
  setInventory: (inventory) => set({ inventory }),
  setEquipment: (equipment) => set({ equipment }),
  updateInventorySlot: (slot) =>
    set((state) => {
      const existingIdx = state.inventory.findIndex((s) => s.id === slot.id)
      if (existingIdx >= 0) {
        const newInventory = [...state.inventory]
        newInventory[existingIdx] = slot
        return { inventory: newInventory }
      }
      return { inventory: [...state.inventory, slot] }
    }),
  removeInventorySlot: (slotId) =>
    set((state) => ({
      inventory: state.inventory.filter((s) => s.id !== slotId),
    })),
  moveInventoryItem: (fromIndex, toIndex) =>
    set((state) => {
      console.log(`[Store] Moving item from ${fromIndex} to ${toIndex}`)
      const newInventory = [...state.inventory]
      const fromItemIdx = newInventory.findIndex((s) => s.slotIndex === fromIndex)
      const toItemIdx = newInventory.findIndex((s) => s.slotIndex === toIndex)
      
      if (fromItemIdx >= 0) {
        // Simple swap logic for UI
        const fromItem = { ...newInventory[fromItemIdx], slotIndex: toIndex } as InventorySlot
        newInventory[fromItemIdx] = fromItem
        
        if (toItemIdx >= 0) {
          const toItem = { ...newInventory[toItemIdx], slotIndex: fromIndex } as InventorySlot
          newInventory[toItemIdx] = toItem
        }
      }
      return { inventory: newInventory }
    }),
  equipItem: (inventoryIndex, equipmentSlot) =>
    set((state) => {
      console.log(`[Store] Equipping item from ${inventoryIndex} to ${equipmentSlot}`)
      // Basic optimistic UI update
      return state
    }),
  unequipItem: (equipmentSlot, inventoryIndex) =>
    set((state) => {
      console.log(`[Store] Unequipping ${equipmentSlot} to ${inventoryIndex}`)
      // Basic optimistic UI update
      return state
    }),
  useItem: (inventoryIndex) =>
    set((state) => {
      console.log(`[Store] Using item at ${inventoryIndex}`)
      // Basic optimistic UI update
      return state
    }),
  dropItem: (inventoryIndex) =>
    set((state) => {
      console.log(`[Store] Dropping item at ${inventoryIndex}`)
      // Basic optimistic UI update
      return state
    }),
  reset: () => set(initialState),
}))
