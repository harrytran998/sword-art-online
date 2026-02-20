import type { ItemCategory, ItemRarity } from "../../../../shared/infrastructure/database/types"

export interface ItemStats {
  attack?: number
  defense?: number
  strength?: number
  agility?: number
  vitality?: number
  intelligence?: number
  maxHp?: number
  maxMp?: number
  criticalRate?: number
  evasionRate?: number
  healHp?: number
  healMp?: number
  teleport?: boolean
  buffAttack?: number
  buffDefense?: number
  buffSpeed?: number
  buffDuration?: number
  cureStatus?: string[]
}

export interface ItemRequirements {
  level?: number
  strength?: number
  agility?: number
  classes?: string[]
}

export interface ItemDefinitionProps {
  readonly id: number
  readonly name: string
  readonly description: string | null
  readonly category: ItemCategory
  readonly subcategory: string | null
  readonly rarity: ItemRarity
  readonly stats: ItemStats
  readonly requirements: ItemRequirements
  readonly maxStack: number
  readonly tradeable: boolean
  readonly basePrice: number
}

export class ItemDefinition {
  private constructor(private readonly props: ItemDefinitionProps) {}

  static create(props: ItemDefinitionProps): ItemDefinition {
    return new ItemDefinition(props)
  }

  get id(): number { return this.props.id }
  get name(): string { return this.props.name }
  get description(): string | null { return this.props.description }
  get category(): ItemCategory { return this.props.category }
  get subcategory(): string | null { return this.props.subcategory }
  get rarity(): ItemRarity { return this.props.rarity }
  get stats(): ItemStats { return this.props.stats }
  get requirements(): ItemRequirements { return this.props.requirements }
  get maxStack(): number { return this.props.maxStack }
  get tradeable(): boolean { return this.props.tradeable }
  get basePrice(): number { return this.props.basePrice }

  isStackable(): boolean {
    return this.props.maxStack > 1
  }

  isEquipment(): boolean {
    return ['weapon', 'armor', 'accessory'].includes(this.props.category)
  }

  isConsumable(): boolean {
    return this.props.category === 'consumable'
  }
}
