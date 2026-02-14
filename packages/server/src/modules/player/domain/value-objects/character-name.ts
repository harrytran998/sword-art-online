const NAME_REGEX = /^[A-Za-z0-9_]{2,32}$/

export class CharacterName {
  readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): CharacterName | null {
    if (!NAME_REGEX.test(value)) return null
    return new CharacterName(value)
  }

  static isValid(value: string): boolean {
    return NAME_REGEX.test(value)
  }
}
