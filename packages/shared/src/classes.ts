export interface ClassDefinition {
  readonly id: number
  readonly name: string
  readonly description: string
  readonly weaponType: string
  readonly stats: {
    readonly str: number
    readonly agi: number
    readonly vit: number
    readonly dex: number
    readonly int: number
    readonly lck: number
  }
}

export const CLASS_DEFINITIONS: readonly ClassDefinition[] = [
  {
    id: 1,
    name: "Swordsman",
    description: "A balanced melee fighter wielding a one-handed sword. Strong defense and reliable damage.",
    weaponType: "1H Sword",
    stats: { str: 10, agi: 5, vit: 8, dex: 5, int: 3, lck: 3 },
  },
  {
    id: 2,
    name: "Fencer",
    description: "A swift duelist wielding a rapier. Excels in speed and precision strikes.",
    weaponType: "Rapier",
    stats: { str: 5, agi: 10, vit: 5, dex: 8, int: 3, lck: 3 },
  },
  {
    id: 3,
    name: "Rogue",
    description: "A cunning fighter wielding daggers. Relies on agility and luck for critical hits.",
    weaponType: "Dagger",
    stats: { str: 4, agi: 8, vit: 4, dex: 7, int: 3, lck: 8 },
  },
  {
    id: 4,
    name: "Berserker",
    description: "A heavy hitter wielding a two-handed sword. Maximum strength and endurance.",
    weaponType: "2H Sword",
    stats: { str: 12, agi: 3, vit: 10, dex: 4, int: 2, lck: 3 },
  },
  {
    id: 5,
    name: "Lancer",
    description: "A versatile fighter wielding a spear. Good reach with balanced offense and defense.",
    weaponType: "Spear",
    stats: { str: 8, agi: 5, vit: 7, dex: 7, int: 3, lck: 4 },
  },
  {
    id: 6,
    name: "Archer",
    description: "A ranged fighter wielding a bow. High dexterity for precise long-range attacks.",
    weaponType: "Bow",
    stats: { str: 4, agi: 7, vit: 4, dex: 10, int: 5, lck: 4 },
  },
  {
    id: 7,
    name: "Monk",
    description: "A martial artist fighting with fists. Balanced physical and spiritual power.",
    weaponType: "Fist",
    stats: { str: 7, agi: 6, vit: 6, dex: 5, int: 7, lck: 3 },
  },
] as const

export const TOTAL_CLASSES: number = CLASS_DEFINITIONS.length

export const getClassById = (id: number): ClassDefinition | undefined =>
  CLASS_DEFINITIONS.find((c) => c.id === id)

export const isValidClassId = (id: number): boolean =>
  CLASS_DEFINITIONS.some((c) => c.id === id)
