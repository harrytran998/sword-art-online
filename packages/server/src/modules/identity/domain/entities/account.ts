import type { AccountId } from "../../../../shared/kernel/types.js"

interface AccountProps {
  readonly id: AccountId
  readonly email: string
  readonly username: string
  readonly status: "active" | "banned" | "suspended"
  readonly createdAt: Date
}

export class Account {
  private constructor(private readonly props: AccountProps) {}

  static create(props: AccountProps): Account {
    return new Account(props)
  }

  get id(): AccountId {
    return this.props.id
  }
  get email(): string {
    return this.props.email
  }
  get username(): string {
    return this.props.username
  }
  get status(): "active" | "banned" | "suspended" {
    return this.props.status
  }
  get createdAt(): Date {
    return this.props.createdAt
  }

  isActive(): boolean {
    return this.props.status === "active"
  }

  isBanned(): boolean {
    return this.props.status === "banned"
  }
}
