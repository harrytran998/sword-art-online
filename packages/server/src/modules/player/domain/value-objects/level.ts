const MIN_LEVEL = 1
const MAX_LEVEL = 100

export class Level {
  readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static create(value: number): Level | null {
    if (!Number.isInteger(value) || value < MIN_LEVEL || value > MAX_LEVEL)
      return null
    return new Level(value)
  }

  static isValid(value: number): boolean {
    return Number.isInteger(value) && value >= MIN_LEVEL && value <= MAX_LEVEL
  }
}
