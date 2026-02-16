import { create } from "zustand"
import type { Character } from "@domain/entities/character"
import type { Position } from "@domain/entities/position"
import type { RemotePlayer } from "@domain/entities/remote-player"

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
}))
