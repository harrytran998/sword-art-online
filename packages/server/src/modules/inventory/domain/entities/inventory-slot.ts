import type { ItemId } from "../../../../shared/kernel/types"
import { ItemDefinition } from "./item-definition"

export interface InventorySlotProps {
  readonly id: ItemId
  readonly characterId: string
  readonly itemDefinition: ItemDefinition
  readonly quantity: number
  readonly enhancementLevel: number
  readonly durability: number | null
  readonly slotType: string | null
  readonly slotIndex: number | null
}

export class InventorySlot {
  private constructor(private readonly props: InventorySlotProps) {}

  static create(props: InventorySlotProps): InventorySlot {
    return new InventorySlot(props)
  }

  get id(): ItemId { return this.props.id }
  get characterId(): string { return this.props.characterId }
  get itemDefinition(): ItemDefinition { return this.props.itemDefinition }
  get quantity(): number { return this.props.quantity }
  get enhancementLevel(): number { return this.props.enhancementLevel }
  get durability(): number | null { return this.props.durability }
  get slotType(): string | null { return this.props.slotType }
  get slotIndex(): number | null { return this.props.slotIndex }

  canStackWith(other: ItemDefinition): boolean {
    return this.itemDefinition.id === other.id && 
           this.itemDefinition.isStackable() && 
           this.quantity < this.itemDefinition.maxStack
  }

  availableSpace(): number {
    return Math.max(0, this.itemDefinition.maxStack - this.quantity)
  }

  withQuantity(quantity: number): InventorySlot {
    return InventorySlot.create({ ...this.props, quantity })
  }

  addQuantity(amount: number): InventorySlot {
    const newQuantity = Math.min(this.quantity + amount, this.itemDefinition.maxStack)
    return this.withQuantity(newQuantity)
  }

  withSlot(slotType: string | null, slotIndex: number | null): InventorySlot {
    return InventorySlot.create({ ...this.props, slotType, slotIndex })
  }
}
