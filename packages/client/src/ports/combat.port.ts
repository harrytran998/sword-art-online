export interface CombatPort {
  readonly activateSkill: (skillId: number, targetId?: string) => void
  readonly cancelSkill: () => void
  readonly selectTarget: (targetId: string | null) => void
}
