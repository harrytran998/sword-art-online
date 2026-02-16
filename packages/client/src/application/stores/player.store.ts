import { create } from "zustand"

interface PlayerState {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  experience: number
  experienceToNext: number
  col: number

  setHp: (hp: number) => void
  setMaxHp: (maxHp: number) => void
  setMp: (mp: number) => void
  setMaxMp: (maxMp: number) => void
  setExperience: (experience: number, experienceToNext: number) => void
  setCol: (col: number) => void
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
  reset: () => set(initialState),
}))
