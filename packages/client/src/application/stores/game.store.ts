import { create } from "zustand"
import type { Character } from "@domain/entities/character"
import type { Position } from "@domain/entities/position"

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

interface GameState {
  // Connection
  connectionStatus: ConnectionStatus

  // Player
  currentCharacter: Character | null
  currentPosition: Position | null

  // World
  currentFloor: number
  currentZone: string | null

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void
  setCurrentCharacter: (character: Character | null) => void
  setCurrentPosition: (position: Position) => void
  setCurrentFloor: (floor: number) => void
  setCurrentZone: (zone: string | null) => void
}

export const useGameStore = create<GameState>((set) => ({
  connectionStatus: "disconnected",
  currentCharacter: null,
  currentPosition: null,
  currentFloor: 1,
  currentZone: null,

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setCurrentCharacter: (character) => set({ currentCharacter: character }),
  setCurrentPosition: (position) => set({ currentPosition: position }),
  setCurrentFloor: (floor) => set({ currentFloor: floor }),
  setCurrentZone: (zone) => set({ currentZone: zone }),
}))
