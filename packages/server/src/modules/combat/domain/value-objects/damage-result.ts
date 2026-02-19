export interface DamageResult {
  readonly baseDamage: number
  readonly finalDamage: number
  readonly isCritical: boolean
  readonly criticalMultiplier: number
}

export const createDamageResult = (
  baseDamage: number,
  finalDamage: number,
  isCritical: boolean,
  criticalMultiplier: number,
): DamageResult => ({
  baseDamage,
  finalDamage,
  isCritical,
  criticalMultiplier,
})
