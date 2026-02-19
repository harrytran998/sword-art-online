import { usePlayerStore } from "@application/stores/player.store"

interface SkillInputDependencies {
  activateSkill: (skillId: number) => void
  cancelSkill: () => void
  selectTarget: (targetId: string | null) => void
}

export const createSkillInputAdapter = (deps: SkillInputDependencies) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
      return
    }

    if (e.key >= "1" && e.key <= "9") {
      const slotIndex = parseInt(e.key) - 1
      const skills = usePlayerStore.getState().skills
      const skill = skills.find(s => s.slotIndex === slotIndex)
      
      if (skill) {
        deps.activateSkill(skill.skillId)
      }
    }
    
    if (e.key === "Escape") {
      deps.selectTarget(null)
      deps.cancelSkill()
    }
  }

  const handleUiActivate = ((e: CustomEvent) => {
    deps.activateSkill(e.detail.skillId)
  }) as EventListener

  const attach = () => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("ui:activate-skill", handleUiActivate)
  }

  const detach = () => {
    window.removeEventListener("keydown", handleKeyDown)
    window.removeEventListener("ui:activate-skill", handleUiActivate)
  }

  return { attach, detach }
}
