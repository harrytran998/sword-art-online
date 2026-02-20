export interface LootEntry {
  readonly itemName: string
  readonly dropChance: number
  readonly quantityMin: number
  readonly quantityMax: number
}

export interface LootTableProps {
  readonly id: number
  readonly name: string
  readonly entries: LootEntry[]
}

export class LootTable {
  private constructor(private readonly props: LootTableProps) {}

  static create(props: LootTableProps): LootTable {
    return new LootTable(props)
  }

  get id(): number { return this.props.id }
  get name(): string { return this.props.name }
  get entries(): LootEntry[] { return this.props.entries }

  rollLoot(): { item: string; quantity: number }[] {
    const results: { item: string; quantity: number }[] = []
    for (const entry of this.props.entries) {
      if (Math.random() < entry.dropChance) {
        const quantity = Math.floor(
          Math.random() * (entry.quantityMax - entry.quantityMin + 1) + entry.quantityMin,
        )
        results.push({ item: entry.itemName, quantity })
      }
    }
    return results
  }
}
