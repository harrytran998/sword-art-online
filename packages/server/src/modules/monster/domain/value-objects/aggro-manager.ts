export interface AggroEntry {
  readonly playerId: string
  readonly value: number
}

export class AggroManager {
  private readonly entries: Map<string, number> = new Map()

  addDamageAggro(playerId: string, damage: number): void {
    const current = this.entries.get(playerId) ?? 0
    this.entries.set(playerId, current + damage)
  }

  addProximityAggro(playerId: string): void {
    const current = this.entries.get(playerId) ?? 0
    this.entries.set(playerId, current + 10)
  }

  getTopAggro(): string | null {
    let topPlayer: string | null = null
    let topValue = 0
    for (const [playerId, value] of this.entries) {
      if (value > topValue) {
        topValue = value
        topPlayer = playerId
      }
    }
    return topPlayer
  }

  removeAggro(playerId: string): void {
    this.entries.delete(playerId)
  }

  clear(): void {
    this.entries.clear()
  }

  getAllEntries(): AggroEntry[] {
    return Array.from(this.entries.entries()).map(([playerId, value]) => ({
      playerId,
      value,
    }))
  }
}
