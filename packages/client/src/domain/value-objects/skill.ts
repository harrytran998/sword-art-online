export interface Skill {
  readonly id: number
  readonly name: string
  readonly weaponType: string
  readonly mpCost: number
  readonly cooldownMs: number
  readonly damageMultiplier: number
}

export interface SkillState {
  readonly skillId: number
  readonly slotIndex: number
  readonly currentCooldown: number
  readonly isActive: boolean
}
