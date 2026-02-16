import type { PlayerId, AccountId } from "../../../../shared/kernel/types"
import type { CharacterStats } from "../value-objects/stats"

interface CharacterProps {
  readonly id: PlayerId
  readonly accountId: AccountId
  readonly name: string
  readonly level: number
  readonly experience: number
  readonly currentHp: number
  readonly maxHp: number
  readonly currentFloor: number
  readonly col: number
  readonly isAlive: boolean
  readonly stats: CharacterStats
}

export class Character {
  private constructor(private readonly props: CharacterProps) {}

  static create(props: CharacterProps): Character {
    return new Character(props)
  }

  get id(): PlayerId {
    return this.props.id
  }
  get accountId(): AccountId {
    return this.props.accountId
  }
  get name(): string {
    return this.props.name
  }
  get level(): number {
    return this.props.level
  }
  get experience(): number {
    return this.props.experience
  }
  get currentHp(): number {
    return this.props.currentHp
  }
  get maxHp(): number {
    return this.props.maxHp
  }
  get currentFloor(): number {
    return this.props.currentFloor
  }
  get col(): number {
    return this.props.col
  }
  get isAlive(): boolean {
    return this.props.isAlive
  }
  get stats(): CharacterStats {
    return this.props.stats
  }

  canLevelUp(): boolean {
    return this.props.experience >= this.experienceNeeded()
  }

  experienceNeeded(): number {
    return 100 * this.props.level ** 2
  }

  computeMaxHp(): number {
    return 100 + (this.props.level - 1) * 20 + this.props.stats.vit * 10
  }

  computeMaxMp(): number {
    return 50 + (this.props.level - 1) * 5 + this.props.stats.int * 5
  }
}
