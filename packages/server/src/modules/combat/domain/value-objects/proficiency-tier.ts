export type ProficiencyTierName =
  | "Novice"
  | "Apprentice"
  | "Expert"
  | "Master"
  | "Grandmaster"

export interface ProficiencyModifiers {
  readonly powerMultiplier: number
  readonly cooldownReduction: number
}

interface TierDefinition {
  readonly name: ProficiencyTierName
  readonly minProficiency: number
  readonly maxProficiency: number
  readonly modifiers: ProficiencyModifiers
}

const TIERS: readonly TierDefinition[] = [
  {
    name: "Novice",
    minProficiency: 0,
    maxProficiency: 99,
    modifiers: { powerMultiplier: 0.9, cooldownReduction: 0 },
  },
  {
    name: "Apprentice",
    minProficiency: 100,
    maxProficiency: 499,
    modifiers: { powerMultiplier: 1, cooldownReduction: 0 },
  },
  {
    name: "Expert",
    minProficiency: 500,
    maxProficiency: 999,
    modifiers: { powerMultiplier: 1.1, cooldownReduction: 0 },
  },
  {
    name: "Master",
    minProficiency: 1000,
    maxProficiency: 4999,
    modifiers: { powerMultiplier: 1.25, cooldownReduction: 0.1 },
  },
  {
    name: "Grandmaster",
    minProficiency: 5000,
    maxProficiency: Number.POSITIVE_INFINITY,
    modifiers: { powerMultiplier: 1.5, cooldownReduction: 0.2 },
  },
] as const

export const getTierForProficiency = (proficiency: number): TierDefinition => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const tier = TIERS[i]
    if (tier && proficiency >= tier.minProficiency) {
      return tier
    }
  }
  return TIERS[0] as TierDefinition
}

export const getTierModifiers = (proficiency: number): ProficiencyModifiers => {
  return getTierForProficiency(proficiency).modifiers
}

export const getTierName = (proficiency: number): ProficiencyTierName => {
  return getTierForProficiency(proficiency).name
}
