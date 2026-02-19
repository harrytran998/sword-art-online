import { create } from "zustand"
import type { Character } from "@domain/entities/character"
import type { Position } from "@domain/entities/position"
import type { RemotePlayer } from "@domain/entities/remote-player"
import type { Target } from "../../domain/value-objects/target"

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

export type GamePhase = "loading" | "character_select" | "character_create" | "in_game"

interface GameState {
  // Connection
  connectionStatus: ConnectionStatus

  // Game phase
  gamePhase: GamePhase

  // Player
  currentCharacter: Character | null
  currentPosition: Position | null
  velocity: { x: number; y: number; z: number }
  rotation: number

  // World
  currentFloor: number
  currentZone: string | null
  currentZoneName: string | null
  isSafeZone: boolean

  // Other players
  otherPlayers: Map<string, RemotePlayer>

  targets: Map<string, Target>
  activeSkillId: number | null

  // Character creation
  characterCreateError: string | null
  isCreatingCharacter: boolean

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void
  setGamePhase: (phase: GamePhase) => void
  setCurrentCharacter: (character: Character | null) => void
  setCurrentPosition: (position: Position) => void
  setVelocity: (velocity: { x: number; y: number; z: number }) => void
  setRotation: (rotation: number) => void
  setCurrentFloor: (floor: number) => void
  setCurrentZone: (zone: string | null, zoneName?: string | null, isSafeZone?: boolean) => void
  addOtherPlayer: (player: RemotePlayer) => void
  updateOtherPlayer: (id: string, updates: Partial<RemotePlayer>) => void
  removeOtherPlayer: (id: string) => void
  clearOtherPlayers: () => void
  addTarget: (target: Target) => void
  updateTarget: (id: string, updates: Partial<Target>) => void
  removeTarget: (id: string) => void
  setActiveSkill: (skillId: number | null) => void
  setCharacterCreateError: (error: string | null) => void
  setIsCreatingCharacter: (creating: boolean) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  connectionStatus: "disconnected",
  gamePhase: "loading",
  currentCharacter: null,
  currentPosition: null,
  velocity: { x: 0, y: 0, z: 0 },
  rotation: 0,
  currentFloor: 1,
  currentZone: null,
  currentZoneName: null,
  isSafeZone: false,
  otherPlayers: new Map(),
  targets: new Map(),
  activeSkillId: null,
  characterCreateError: null,
  isCreatingCharacter: false,

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setCurrentCharacter: (character) => set({ currentCharacter: character }),
  setCurrentPosition: (position) => set({ currentPosition: position }),
  setVelocity: (velocity) => set({ velocity }),
  setRotation: (rotation) => set({ rotation }),
  setCurrentFloor: (floor) => set({ currentFloor: floor }),
  setCurrentZone: (zone, zoneName, isSafeZone) =>
    set({
      currentZone: zone,
      currentZoneName: zoneName ?? null,
      isSafeZone: isSafeZone ?? false,
    }),

  addOtherPlayer: (player) => {
    const current = get().otherPlayers
    const next = new Map(current)
    next.set(player.id, player)
    set({ otherPlayers: next })
  },

  updateOtherPlayer: (id, updates) => {
    const current = get().otherPlayers
    const existing = current.get(id)
    if (!existing) return
    const next = new Map(current)
    next.set(id, { ...existing, ...updates })
    set({ otherPlayers: next })
  },

  removeOtherPlayer: (id) => {
    const current = get().otherPlayers
    const next = new Map(current)
    next.delete(id)
    set({ otherPlayers: next })
  },

  clearOtherPlayers: () => set({ otherPlayers: new Map() }),

  addTarget: (target) => {
    const current = get().targets
    const next = new Map(current)
    next.set(target.id, target)
    set({ targets: next })
  },

  updateTarget: (id, updates) => {
    const current = get().targets
    const existing = current.get(id)
    if (!existing) return
    const next = new Map(current)
    next.set(id, { ...existing, ...updates })
    set({ targets: next })
  },

  removeTarget: (id) => {
    const current = get().targets
    const next = new Map(current)
    next.delete(id)
    set({ targets: next })
  },

  setActiveSkill: (activeSkillId) => set({ activeSkillId }),
  setCharacterCreateError: (error) => set({ characterCreateError: error, isCreatingCharacter: false }),
  setIsCreatingCharacter: (creating) => set({ isCreatingCharacter: creating, characterCreateError: null }),
}))
