export class EnhancementLevel {
  private constructor(private readonly level: number) {}

  static create(level: number): EnhancementLevel {
    if (level < 0 || level > 15) {
      throw new Error('Enhancement level must be between 0 and 15')
    }
    return new EnhancementLevel(level)
  }

  static zero(): EnhancementLevel {
    return new EnhancementLevel(0)
  }

  get value(): number { return this.level }

  canEnhance(): boolean {
    return this.level < 15
  }

  getSuccessRate(): number {
    const rates = [100, 100, 100, 95, 90, 80, 70, 60, 50, 40, 30, 20, 15, 10, 5]
    return rates[this.level] ?? 0
  }

  getStatBonus(): number {
    return 1 + (this.level * 0.05)
  }

  next(): EnhancementLevel | null {
    if (!this.canEnhance()) return null
    return new EnhancementLevel(this.level + 1)
  }
}
