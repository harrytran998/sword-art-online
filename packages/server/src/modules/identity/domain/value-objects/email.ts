const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class Email {
  readonly value: string

  private constructor(value: string) {
    this.value = value.toLowerCase()
  }

  static create(value: string): Email | null {
    if (!EMAIL_REGEX.test(value)) return null
    return new Email(value)
  }

  static isValid(value: string): boolean {
    return EMAIL_REGEX.test(value)
  }
}
