import { create } from "zustand"
import type { SkillState } from "../../domain/value-objects/skill"

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

  setHp: (hp: number) => void
  setMaxHp: (maxHp: number) => void
  setMp: (mp: number) => void
  setMaxMp: (maxMp: number) => void
  setExperience: (experience: number, experienceToNext: number) => void
  setCol: (col: number) => void
  setSkills: (skills: SkillState[]) => void
  setSkillCooldown: (skillId: number, cooldown: number) => void
  setSelectedTarget: (targetId: string | null) => void
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
  reset: () => set(initialState),
}))
